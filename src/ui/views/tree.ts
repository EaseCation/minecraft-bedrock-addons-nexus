import * as vscode from 'vscode';
import * as path from 'path';
import { AddonFile, FileType } from '../../core/types';
import { getFileTypeMeta } from '../../core/types/FileTypeMeta';

export class BaseFileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: FileType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly file?: AddonFile,
        public readonly items?: { identifier: string; file?: AddonFile }[],
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        this.iconPath = getFileTypeMeta(type)?.icon;
        if (items) {
            this.tooltip = '';
        } else if (file) {
            this.tooltip = file.path ? path.relative(vscode.workspace.rootPath || '', file.path) : '文件未找到';
        } else {
            this.tooltip = '文件未找到';
        }
        this.description = file ? (file.path ? '' : '(文件未找到)') : undefined;
        this.contextValue = contextValue || (file ? 'file' : (items ? 'group' : undefined));
        if (file) {
            this.command = {
                command: 'vscode.open',
                title: '打开文件',
                arguments: [vscode.Uri.file(file.path)]
            };
        } else if (contextValue === 'toggleShowRecentOnly') {
            this.command = {
                command: 'minecraft-bedrock-addons-nexus.toggleShowRecentOnly',
                title: '切换仅展示最近'
            };
            this.iconPath = new vscode.ThemeIcon('eye');
        }
    }
}

export class RelatedFileItem extends BaseFileItem {}
