import * as vscode from 'vscode';
import { AddonStructure, FileType, AddonFile } from '../types';
import { FileIndexer } from './FileIndexer';
import { FileWatcher } from '../watcher/FileWatcher';

export class FileIndexManager {
    public fileWatcher: FileWatcher;
    public fileIndexer: FileIndexer;
    private disposables: vscode.Disposable[] = [];
    private indexUpdateCallbacks: ((structure: AddonStructure) => void)[] = [];

    constructor() {
        // 创建 FileIndexer，传入索引更新回调
        this.fileIndexer = new FileIndexer((structure: AddonStructure) => {
            this.indexUpdateCallbacks.forEach(callback => callback(structure));
        });

        // 创建 FileWatcher
        this.fileWatcher = new FileWatcher(this.fileIndexer);

        // 注册工作区变更监听
        this.registerWorkspaceChangeListener();
    }

    private registerWorkspaceChangeListener(): void {
        // 监听工作区文件夹变更
        const workspaceFoldersChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
            console.log('[DEBUG] 工作区文件夹变更');
            
            // 获取当前工作区文件夹
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                // 重新索引工作区
                await this.fileIndexer.indexWorkspace(workspaceFolders);
                // 更新文件监听
                await this.fileWatcher.watch(workspaceFolders);
            }
        });

        this.disposables.push(workspaceFoldersChangeDisposable);
    }

    public async initialize(): Promise<void> {
        try {
            // 获取当前工作区文件夹
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                console.log('[DEBUG] 没有打开的工作区');
                return;
            }

            // 初始化索引
            await this.fileIndexer.indexWorkspace(workspaceFolders);
            
            // 开始监听文件变更
            await this.fileWatcher.watch(workspaceFolders);

            console.log('[DEBUG] FileIndexManager 初始化完成');
        } catch (error) {
            console.error('[DEBUG] FileIndexManager 初始化失败:', error);
            throw error;
        }
    }

    public getAddonStructure(): AddonStructure {
        return this.fileIndexer.getAddonStructure();
    }

    public async getFileType(filePath: string): Promise<FileType | null> {
        return this.fileIndexer.getFileType(filePath);
    }

    public async getFile(filePath: string): Promise<AddonFile | null> {
        const fileType = await this.getFileType(filePath);
        if (!fileType) {
            return null;
        }

        const structure = this.getAddonStructure();

        // 适配数组结构，查找所有数组中path匹配的文件
        for (const arr of Object.values(structure.index[fileType])) {
            if (Array.isArray(arr)) {
                const found = arr.find((f: AddonFile) => f.path === filePath);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    public onIndexUpdate(callback: (structure: AddonStructure) => void): void {
        this.indexUpdateCallbacks.push(callback);
    }

    public dispose(): void {
        // 清理所有资源
        this.fileWatcher.dispose();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
} 