import * as vscode from 'vscode';
import { AddonFile, FileType } from '../../core/types';
import { getFileTypeMeta } from '../../core/types/FileTypeMeta';
import { RelatedFileItem } from './tree';
import { FileIndexer } from '../../core/indexer/FileIndexer';

type RelatedItem = {
    mode: 'used' | 'usedBy';
    type: FileType;
    identifier: string;
    file: AddonFile;
}

export class RelatedFilesView implements vscode.TreeDataProvider<RelatedFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<RelatedFileItem | undefined | null | void> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<RelatedFileItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private _currentFile: AddonFile | null = null;
    private _fileIndexer: FileIndexer;

    constructor(fileIndexer: FileIndexer) {
        this._fileIndexer = fileIndexer;
    }

    public updateCurrentFile(file: AddonFile | null) {
        this._currentFile = file;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: RelatedFileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: RelatedFileItem): RelatedFileItem[] {
        if (!this._currentFile) return [];
        // 合并正向和反向依赖
        const uses = { ...this._fileIndexer.fileUsesMap[this._currentFile.path] };
        const meta = getFileTypeMeta(this._currentFile.type);
        const ids = meta?.getIdentifiers?.(this._currentFile) || [];
        // 合并反向引用
        for (const id of ids) {
            for (const [type, idMap] of Object.entries(this._fileIndexer.resourceUsedByMap)) {
                if (idMap && idMap[id]) {
                    for (const file of idMap[id]) {
                        const meta2 = getFileTypeMeta(type as FileType);
                        const fileIds = meta2?.getIdentifiers?.(file) || [];
                        for (const fileId of fileIds) {
                            if (!uses[type as FileType]) uses[type as FileType] = {};
                            if (!uses[type as FileType]![fileId]) uses[type as FileType]![fileId] = [];
                            if (!uses[type as FileType]![fileId].some(f => f.path === file.path)) {
                                uses[type as FileType]![fileId].push(file);
                            }
                        }
                    }
                }
            }
        }

        // 根节点：所有 type 分组
        if (!element) {
            return Object.entries(uses)
                .filter(([type, idMap]) => Object.keys(idMap).length > 0)
                .map(([type, idMap]) => {
                    const meta = getFileTypeMeta(type as FileType);
                    return new RelatedFileItem(
                        meta?.label || type,
                        type as FileType,
                        vscode.TreeItemCollapsibleState.Expanded,
                        undefined,
                        // items: identifier+file 平铺
                        ([] as { identifier: string; file?: AddonFile }[]).concat(
                            ...Object.entries(idMap).map(([id, files]) => {
                                if ((files as AddonFile[]).length === 0) {
                                    // 没有文件也要显示
                                    return [{ identifier: id }];
                                } else {
                                    return (files as AddonFile[]).map(f => ({ identifier: id, file: f }));
                                }
                            })
                        )
                    );
                });
        }

        // 类型分组节点：直接平铺 identifier+文件
        if (element.items && !element.file) {
            return element.items.map(item =>
                new RelatedFileItem(
                    item.identifier,
                    element.type,
                    vscode.TreeItemCollapsibleState.None,
                    item.file
                )
            );
        }

        return [];
    }
}