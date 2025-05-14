import * as vscode from 'vscode';
import { AddonFile, AddonStructure, FileType, FileRelationship, AddonFileAnimation, AddonFileModel, AddonFileTexture, AddonFileParticle, AddonFileSound, AddonFileRenderController, AddonFileClientEntity } from '../../core/types';
import { FileTypeIcon } from '../components/FileTypeIcon';
import { FileTypeLabel } from '../components/FileTypeLabel';
import * as path from 'path';

export class RelatedFilesView implements vscode.TreeDataProvider<RelatedFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<RelatedFileItem | undefined | null | void> = new vscode.EventEmitter<RelatedFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RelatedFileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private _addonStructure: AddonStructure | null = null;
    private _currentFile: AddonFile | null = null;

    constructor() {}

    public updateAddonStructure(structure: AddonStructure) {
        this._addonStructure = structure;
        this._onDidChangeTreeData.fire();
    }

    public updateCurrentFile(file: AddonFile | null) {
        this._currentFile = file;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: RelatedFileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: RelatedFileItem): RelatedFileItem[] {
        if (!this._addonStructure || !this._currentFile) {
            return [];
        }

        if (!element) {
            // 根节点
            return this.getRelatedFiles().map(relationship => 
                new RelatedFileItem(
                    FileTypeLabel.getLabel(relationship.type),
                    relationship.type,
                    vscode.TreeItemCollapsibleState.Expanded,
                    undefined,
                    relationship.items
                )
            );
        } else if (element.items) {
            // 文件节点
            const items: RelatedFileItem[] = [];
            
            // 添加 "+" 选项作为第一个子项
            items.push(new RelatedFileItem(
                '新增',
                element.type,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                undefined,
                'add'
            ));

            // 添加现有的文件项
            items.push(...element.items.map(item => 
                new RelatedFileItem(
                    item.identifier,
                    element.type,
                    vscode.TreeItemCollapsibleState.None,
                    item.file,
                    undefined
                )
            ));

            return items;
        }

        return [];
    }

    private getRelatedFiles(): FileRelationship[] {
        console.log(`[RelatedFilesView] 获取相关文件 ${this._currentFile?.path}`);
        if (!this._addonStructure || !this._currentFile) {
            return [];
        }

        const result: FileRelationship[] = [];

        // 如果是客户端实体文件，显示所有相关资源
        if (this._currentFile.type === FileType.CLIENT_ENTITY) {
            const identifier = this.getEntityIdentifier(this._currentFile);
            if (identifier) {
                const entityFiles = this._addonStructure.index.clientEntity[identifier];
                if (entityFiles) {
                    console.log(`[RelatedFilesView] 实体文件: ${JSON.stringify(entityFiles, null, 2)}`);
                    
                    // 查找动画文件
                    if (entityFiles.animations.length > 0) {
                        const animationItems = entityFiles.animations.map(id => ({
                            identifier: id,
                            file: this._addonStructure?.index.animation[id]
                        }));
                        result.push({ type: FileType.ANIMATION, items: animationItems });
                    }

                    // 查找模型文件
                    if (entityFiles.geometries.length > 0) {
                        const modelItems = entityFiles.geometries.map(id => ({
                            identifier: id,
                            file: this._addonStructure?.index.model[id]
                        }));
                        result.push({ type: FileType.MODEL, items: modelItems });
                    }

                    // 查找纹理文件
                    if (entityFiles.textures.length > 0) {
                        const textureItems = entityFiles.textures.map(id => ({
                            identifier: id,
                            file: this._addonStructure?.index.texture[id]
                        }));
                        result.push({ type: FileType.TEXTURE, items: textureItems });
                    }

                    // 查找粒子文件
                    if (entityFiles.particles.length > 0) {
                        const particleItems = entityFiles.particles.map(id => ({
                            identifier: id,
                            file: this._addonStructure?.index.particle[id]
                        }));
                        result.push({ type: FileType.PARTICLE, items: particleItems });
                    }

                    // 查找音效文件
                    if (entityFiles.sounds.length > 0) {
                        const soundItems = entityFiles.sounds.map(id => ({
                            identifier: id,
                            file: this._addonStructure?.index.sound[id]
                        }));
                        result.push({ type: FileType.SOUND, items: soundItems });
                    }

                    // 查找渲染控制器文件
                    if (entityFiles.renderControllers.length > 0) {
                        const renderControllerItems = entityFiles.renderControllers.map(id => ({
                            identifier: id,
                            file: this._addonStructure?.index.renderController[id]
                        }));
                        result.push({ type: FileType.RENDER_CONTROLLER, items: renderControllerItems });
                    }
                }
            }
        }
        // 如果是资源文件，显示使用该资源的所有实体
        else {
            const identifier = this.getResourceIdentifier(this._currentFile);
            if (identifier) {
                const entities = this.findEntitiesUsingResource(this._currentFile.type, identifier);
                if (entities.length > 0) {
                    result.push({ 
                        type: FileType.CLIENT_ENTITY, 
                        items: entities.map(entity => ({
                            identifier: entity.entity,
                            file: entity
                        }))
                    });
                } else {
                    result.push({ 
                        type: FileType.CLIENT_ENTITY, 
                        items: [{ identifier }]
                    });
                }
            }
        }

        console.log(`[RelatedFilesView] 结果: ${JSON.stringify(result, null, 2)}`);
        return result;
    }

    private getEntityIdentifier(file: AddonFile): string | null {
        try {
            if (file.type === FileType.CLIENT_ENTITY) {
                return file.entity;
            }
        } catch (error) {
            console.error('Error getting entity identifier:', error);
        }
        return null;
    }

    private getResourceIdentifier(file: AddonFile): string | null {
        try {
            switch (file.type) {
                case FileType.CLIENT_ENTITY:
                    return file.entity;
                case FileType.CLIENT_BLOCK:
                    return file.blocks[0];
                case FileType.ANIMATION:
                    return file.animations[0];
                case FileType.MODEL:
                    return file.geometries[0];
                case FileType.TEXTURE:
                    return path.basename(file.path, path.extname(file.path));
                case FileType.PARTICLE:
                    return file.particles[0];
                case FileType.SOUND:
                    return file.sounds[0];
                case FileType.RENDER_CONTROLLER:
                    return file.controllers[0];
            }
        } catch (error) {
            console.error('Error getting resource identifier:', error);
        }
        return null;
    }

    private findEntitiesUsingResource(resourceType: FileType, resourceIdentifier: string): AddonFileClientEntity[] {
        if (!this._addonStructure) {
            return [];
        }

        const entities: AddonFileClientEntity[] = [];
        for (const entity of Object.values(this._addonStructure.index.clientEntity)) {
            let shouldAdd = false;
            switch (resourceType) {
                case FileType.ANIMATION:
                    shouldAdd = entity.animations.includes(resourceIdentifier);
                    break;
                case FileType.MODEL:
                    shouldAdd = entity.geometries.includes(resourceIdentifier);
                    break;
                case FileType.TEXTURE:
                    shouldAdd = entity.textures.includes(resourceIdentifier);
                    break;
                case FileType.PARTICLE:
                    shouldAdd = entity.particles.includes(resourceIdentifier);
                    break;
                case FileType.SOUND:
                    shouldAdd = entity.sounds.includes(resourceIdentifier);
                    break;
                case FileType.RENDER_CONTROLLER:
                    shouldAdd = entity.renderControllers.includes(resourceIdentifier);
                    break;
            }
            if (shouldAdd) {
                entities.push(entity);
            }
        }
        return entities;
    }
}

// 通用树节点，便于复用
class BaseFileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: FileType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly file?: AddonFile,
        public readonly items?: { identifier: string; file?: AddonFile }[],
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        this.iconPath = FileTypeIcon.getIcon(type);
        if (items) {
            this.tooltip = '';
        } else if (file) {
            this.tooltip = file.path ? path.relative(vscode.workspace.rootPath || '', file.path) : '文件未找到';
        } else {
            this.tooltip = '文件未找到';
        }
        this.description = file ? (file.path ? '' : '(文件未找到)') : undefined;
        this.contextValue = contextValue || (file ? 'file' : 'group');
        if (file) {
            this.command = {
                command: 'vscode.open',
                title: '打开文件',
                arguments: [vscode.Uri.file(file.path)]
            };
        } else if (contextValue === 'add') {
            this.command = {
                command: 'minecraft-bedrock-addons-nexus.addFile',
                title: '添加文件',
                arguments: [type]
            };
            this.iconPath = new vscode.ThemeIcon('add');
        } else if (contextValue === 'toggleShowRecentOnly') {
            this.command = {
                command: 'minecraft-bedrock-addons-nexus.toggleShowRecentOnly',
                title: '切换仅展示最近'
            };
            this.iconPath = new vscode.ThemeIcon('eye');
        }
    }
}

// RelatedFileItem 继承 BaseFileItem，兼容原有逻辑
class RelatedFileItem extends BaseFileItem {}

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
                item.file
            ));
        }
        return [];
    }

    private getAllTypeGroups(): BaseFileItem[] {
        if (!this._addonStructure) return [];
        const index = this._addonStructure.index;
        const groups: { type: FileType; label: string; items: { identifier: string; file?: AddonFile }[] }[] = [
            { type: FileType.SERVER_BLOCK, label: FileTypeLabel.getLabel(FileType.SERVER_BLOCK), items: this.makeItems(index.serverBlock) },
            { type: FileType.CLIENT_BLOCK, label: FileTypeLabel.getLabel(FileType.CLIENT_BLOCK), items: this.makeItems(index.clientBlock) },
            { type: FileType.SERVER_ENTITY, label: FileTypeLabel.getLabel(FileType.SERVER_ENTITY), items: this.makeItems(index.serverEntity) },
            { type: FileType.CLIENT_ENTITY, label: FileTypeLabel.getLabel(FileType.CLIENT_ENTITY), items: this.makeItems(index.clientEntity) },
            { type: FileType.ANIMATION, label: FileTypeLabel.getLabel(FileType.ANIMATION), items: this.makeItems(index.animation) },
            { type: FileType.MODEL, label: FileTypeLabel.getLabel(FileType.MODEL), items: this.makeItems(index.model) },
            { type: FileType.TEXTURE, label: FileTypeLabel.getLabel(FileType.TEXTURE), items: this.makeItems(index.texture) },
            { type: FileType.PARTICLE, label: FileTypeLabel.getLabel(FileType.PARTICLE), items: this.makeItems(index.particle) },
            { type: FileType.SOUND, label: FileTypeLabel.getLabel(FileType.SOUND), items: this.makeItems(index.sound) },
            { type: FileType.RENDER_CONTROLLER, label: FileTypeLabel.getLabel(FileType.RENDER_CONTROLLER), items: this.makeItems(index.renderController) },
        ];
        return groups.map(g => new BaseFileItem(
            g.label,
            g.type,
            vscode.TreeItemCollapsibleState.Expanded,
            undefined,
            g.items
        ));
    }

    private makeItems<T extends AddonFile>(dict: { [id: string]: T }): { identifier: string; file?: AddonFile }[] {
        const sorted = Object.entries(dict)
            .map(([identifier, file]) => ({ identifier, file }))
            .sort((a, b) => (b.file?.updatedAt || 0) - (a.file?.updatedAt || 0));
        return this._showRecentOnly ? sorted.slice(0, 5) : sorted;
    }
} 