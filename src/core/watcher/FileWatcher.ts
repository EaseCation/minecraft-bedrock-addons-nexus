import * as vscode from 'vscode';
import { FileType } from '../types';
import { FileIndexer } from '../indexer/FileIndexer';
import * as path from 'path';

export class FileWatcher {
    private fileIndexer: FileIndexer;
    private disposables: vscode.Disposable[] = [];
    private onIndexChanged?: () => void;

    constructor(fileIndexer: FileIndexer) {
        this.fileIndexer = fileIndexer;
    }

    public setOnIndexChanged(callback: () => void) {
        this.onIndexChanged = callback;
    }

    public async watch(workspaceFolders: readonly vscode.WorkspaceFolder[]): Promise<void> {
        // 清除现有的监听器
        this.dispose();

        // 为每个工作区文件夹创建全局文件监听器
        for (const folder of workspaceFolders) {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(folder, '**/*')
            );

            watcher.onDidCreate(async (uri) => {
                await this.handleFileChange(uri.fsPath, 'create');
            });

            watcher.onDidChange(async (uri) => {
                await this.handleFileChange(uri.fsPath, 'change');
            });

            watcher.onDidDelete(async (uri) => {
                await this.handleFileChange(uri.fsPath, 'delete');
            });

            this.disposables.push(watcher);
        }

        // 监听 manifest.json 文件
        for (const folder of workspaceFolders) {
            const manifestWatcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(folder, '**/manifest.json')
            );

            manifestWatcher.onDidChange(async (uri) => {
                console.log(`[DEBUG] manifest.json 修改: ${uri.fsPath}`);
                await this.handleManifestChange(uri);
            });

            this.disposables.push(manifestWatcher);
        }
    }

    private async handleFileChange(filePath: string, changeType: 'create' | 'change' | 'delete'): Promise<void> {
        try {
            // 跳过.git目录下的文件
            if (filePath.includes(`${path.sep}.git${path.sep}`) || filePath.includes(`${path.sep}.git${path.posix.sep}`) || filePath.endsWith(`${path.sep}.git`) || filePath.endsWith(`${path.posix.sep}.git`)) {
                return;
            }
            const fileType = await this.fileIndexer.getFileType(filePath);
            if (!fileType || fileType === FileType.UNKNOWN) return;
            switch (changeType) {
                case 'create':
                case 'change':
                    await this.fileIndexer.indexFile(filePath);
                    break;
                case 'delete':
                    this.fileIndexer.removeFile(filePath, fileType);
                    break;
            }
            if (this.onIndexChanged) {
                this.onIndexChanged();
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
            if (this.onIndexChanged) {
                this.onIndexChanged();
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