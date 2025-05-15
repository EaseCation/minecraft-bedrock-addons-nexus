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

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
} 