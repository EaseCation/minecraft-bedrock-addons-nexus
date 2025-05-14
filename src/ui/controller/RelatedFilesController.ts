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
            vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChanged, this)
        );
    }

    // 添加公共方法用于刷新当前文件
    public async refreshCurrentFile(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            await this.onActiveEditorChanged(activeEditor);
        } else {
            this._view.updateCurrentFile(null);
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