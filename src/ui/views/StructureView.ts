import * as vscode from 'vscode';
import { AddonFile, AddonStructure, FileType } from '../../core/types';
import { getFileTypeMeta, FILE_TYPE_META_LIST } from '../../core/types/FileTypeMeta';
import { BaseFileItem } from './tree';

// 新增完整结构树 StructureView
export class StructureView implements vscode.TreeDataProvider<BaseFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BaseFileItem | undefined | null | void> = new vscode.EventEmitter<BaseFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BaseFileItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private _addonStructure: AddonStructure | null = null;
    private _showRecentOnly: boolean = false;

    constructor() {}

    public updateAddonStructure(structure: AddonStructure) {
        this._addonStructure = structure;
        this._onDidChangeTreeData.fire();
    }

    public toggleShowRecentOnly() {
        this._showRecentOnly = !this._showRecentOnly;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BaseFileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: BaseFileItem): BaseFileItem[] {
        if (!this._addonStructure) return [];
        if (!element) {
            // 根节点，先加一个切换按钮
            const toggleLabel = this._showRecentOnly ? '仅展示最近：开' : '仅展示最近：关';
            const toggleItem = new BaseFileItem(
                toggleLabel,
                FileType.CLIENT_ENTITY, // 图标类型随意
                vscode.TreeItemCollapsibleState.None,
                undefined,
                undefined,
                'toggleShowRecentOnly'
            );
            return [toggleItem, ...this.getAllTypeGroups()];
        } else if (element.items) {
            let items = element.items
                .filter(item => item.file)
                .sort((a, b) => (b.file!.updatedAt || 0) - (a.file!.updatedAt || 0));
            if (this._showRecentOnly) {
                items = items.slice(0, 5);
            }
            return items.map(item => new BaseFileItem(
                item.identifier,
                element.type,
                vscode.TreeItemCollapsibleState.None,
                item.file,
                undefined,
                "item"
            ));
        }
        return [];
    }

    private getAllTypeGroups(): BaseFileItem[] {
        if (!this._addonStructure) return [];
        const index = this._addonStructure.index;
        return FILE_TYPE_META_LIST.map(meta => new BaseFileItem(
            meta.label,
            meta.type,
            vscode.TreeItemCollapsibleState.Expanded,
            undefined,
            this.makeItems(index[meta.type])
        ));
    }

    private makeItems(dict: { [id: string]: AddonFile[] }): { identifier: string; file?: AddonFile }[] {
        // 遍历每个identifier下的AddonFile[]，全部展开
        const all: { identifier: string; file?: AddonFile }[] = [];
        for (const [identifier, files] of Object.entries(dict)) {
            if (Array.isArray(files)) {
                for (const file of files) {
                    all.push({ identifier, file });
                }
            }
        }
        const sorted = all.sort((a, b) => (b.file?.updatedAt || 0) - (a.file?.updatedAt || 0));
        return this._showRecentOnly ? sorted.slice(0, 5) : sorted;
    }
} 