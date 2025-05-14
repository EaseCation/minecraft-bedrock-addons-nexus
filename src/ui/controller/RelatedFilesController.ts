import * as vscode from 'vscode';
import { AddonFile, AddonStructure, FileType } from '../../core/types';
import { RelatedFilesView } from '../views/RelatedFilesView';
import { FileIndexManager } from '../../core/indexer/FileIndexManager';

export class RelatedFilesController {
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private _view: RelatedFilesView,
        private _fileIndexManager: FileIndexManager
    ) {
        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChanged, this),
            vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this),
            vscode.workspace.onDidDeleteFiles(this.onFilesDeleted, this)
        );

        // 监听索引更新
        this._fileIndexManager.onIndexUpdate((structure: AddonStructure) => {
            this._view.updateAddonStructure(structure);
        });
    }

    // 添加公共方法用于刷新当前文件
    public async refreshCurrentFile(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            await this.onActiveEditorChanged(activeEditor);
        }
    }

    private async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
        if (!editor) {
            this._view.updateCurrentFile(null);
            return;
        }

        const file = await this._fileIndexManager.getFile(editor.document.uri.fsPath);
        this._view.updateCurrentFile(file);
    }

    private async onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
        const filePath = event.document.uri.fsPath;
        const fileType = await this._fileIndexManager.getFileType(filePath);
        if (!fileType) {
            return;
        }

        // 从索引中获取文件
        const structure = this._fileIndexManager.getAddonStructure();
        const indexKey = this.getIndexKey(fileType);
        if (!indexKey) {
            return;
        }

        const file = Object.values(structure.index[indexKey]).find((f: AddonFile) => f.path === filePath);
        if (file) {
            console.log(`[RelatedFilesController] 文件已更改: ${filePath}`);
            this._view.updateCurrentFile(file);
        }
    }

    private async onFilesDeleted(event: vscode.FileDeleteEvent) {
        for (const uri of event.files) {
            const filePath = uri.fsPath;
            const fileType = await this._fileIndexManager.getFileType(filePath);
            if (!fileType) {
                continue;
            }

            // 从索引中获取文件
            const structure = this._fileIndexManager.getAddonStructure();
            const indexKey = this.getIndexKey(fileType);
            if (!indexKey) {
                continue;
            }

            const file = Object.values(structure.index[indexKey]).find((f: AddonFile) => f.path === filePath);
            if (file) {
                console.log(`[RelatedFilesController] 文件已删除: ${filePath}`);
                this._view.updateCurrentFile(null);
            }
        }
    }

    private getIndexKey(fileType: FileType): keyof AddonStructure['index'] | null {
        switch (fileType) {
            case FileType.SERVER_BLOCK:
                return 'serverBlock';
            case FileType.CLIENT_BLOCK:
                return 'clientBlock';
            case FileType.SERVER_ENTITY:
                return 'serverEntity';
            case FileType.CLIENT_ENTITY:
                return 'clientEntity';
            case FileType.ANIMATION:
                return 'animation';
            case FileType.MODEL:
                return 'model';
            case FileType.TEXTURE:
                return 'texture';
            case FileType.PARTICLE:
                return 'particle';
            case FileType.SOUND:
                return 'sound';
            default:
                return null;
        }
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
} 