import * as vscode from 'vscode';
import { FileType } from '../types';
import { FileIndexer } from '../indexer/FileIndexer';
import * as path from 'path';

export class FileWatcher {
    private fileIndexer: FileIndexer;
    private disposables: vscode.Disposable[] = [];
    private fileTypePatterns: Map<FileType, string[]>;

    constructor(fileIndexer: FileIndexer) {
        this.fileIndexer = fileIndexer;
        this.fileTypePatterns = new Map([
            [FileType.SERVER_ENTITY, ['**/entity/**/*.json', '**/entities/**/*.json']],
            [FileType.CLIENT_ENTITY, ['**/entity/**/*.json', '**/entities/**/*.json']],
            [FileType.ANIMATION, ['**/animations/**/*.json']],
            [FileType.MODEL, ['**/models/**/*.json']],
            [FileType.TEXTURE, ['**/textures/**/*.{png,tga}']],
            [FileType.PARTICLE, ['**/particles/**/*.json']],
            [FileType.SOUND, ['**/sounds/**/*.json']]
        ]);
    }

    public async watch(workspaceFolders: readonly vscode.WorkspaceFolder[]): Promise<void> {
        // 清除现有的监听器
        this.dispose();

        // 为每个工作区文件夹创建文件监听器
        for (const folder of workspaceFolders) {
            await this.watchWorkspaceFolder(folder);
        }
    }

    private async watchWorkspaceFolder(folder: vscode.WorkspaceFolder): Promise<void> {
        // 监听所有相关文件类型
        for (const [fileType, patterns] of this.fileTypePatterns) {
            for (const pattern of patterns) {
                const watcher = vscode.workspace.createFileSystemWatcher(
                    new vscode.RelativePattern(folder, pattern)
                );

                // 处理文件创建
                watcher.onDidCreate(async (uri) => {
                    console.log(`[DEBUG] 文件创建: ${uri.fsPath}`);
                    await this.handleFileChange(uri.fsPath, fileType, 'create');
                });

                // 处理文件修改
                watcher.onDidChange(async (uri) => {
                    console.log(`[DEBUG] 文件修改: ${uri.fsPath}`);
                    await this.handleFileChange(uri.fsPath, fileType, 'change');
                });

                // 处理文件删除
                watcher.onDidDelete(async (uri) => {
                    console.log(`[DEBUG] 文件删除: ${uri.fsPath}`);
                    await this.handleFileChange(uri.fsPath, fileType, 'delete');
                });

                this.disposables.push(watcher);
            }
        }

        // 监听 manifest.json 文件
        const manifestWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '**/manifest.json')
        );

        manifestWatcher.onDidChange(async (uri) => {
            console.log(`[DEBUG] manifest.json 修改: ${uri.fsPath}`);
            await this.handleManifestChange(uri);
        });

        this.disposables.push(manifestWatcher);
    }

    private async handleFileChange(filePath: string, fileType: FileType, changeType: 'create' | 'change' | 'delete'): Promise<void> {
        try {
            switch (changeType) {
                case 'create':
                case 'change':
                    await this.fileIndexer.indexFile(filePath);
                    break;
                case 'delete':
                    this.fileIndexer.removeFile(filePath, fileType);
                    break;
            }
        } catch (error) {
            console.error(`[DEBUG] 处理文件变更失败: ${filePath}`, error);
        }
    }

    private async handleManifestChange(uri: vscode.Uri): Promise<void> {
        try {
            const manifestPath = uri.fsPath;
            const packPath = path.dirname(manifestPath);
            const packType = path.basename(path.dirname(packPath));

            // 检查是否是资源包或行为包
            if (packType === 'resource_pack' || packType === 'behavior_pack') {
                // 重新索引整个工作区
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    await this.fileIndexer.indexWorkspace(workspaceFolders);
                }
            }
        } catch (error) {
            console.error(`[DEBUG] 处理 manifest 变更失败: ${uri.fsPath}`, error);
        }
    }

    public dispose(): void {
        // 清理所有监听器
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
} 