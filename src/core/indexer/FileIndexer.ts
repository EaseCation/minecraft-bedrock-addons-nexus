import * as vscode from 'vscode';
import { AddonFile, AddonStructure, FileType, AddonFileServerEntity, AddonFileClientEntity, AddonFileAnimation, AddonFileModel, AddonFileTexture, AddonFileParticle, AddonFileSound, AddonFileServerBlock, AddonFileClientBlock, AddonFileRenderController } from '../types';
import { determineFileType } from '../utils/fileType';
import * as path from 'path';
import { parseServerEntity, parseClientEntity } from '../parser/EntityParser';
import { parseAnimation } from '../parser/AnimationParser';
import { parseModel } from '../parser/ModelParser';
import { parseTexture } from '../parser/TextureParser';
import { parseParticle } from '../parser/ParticleParser';
import { parseSound } from '../parser/SoundParser';
import { parseRenderController } from '../parser/RenderControllerParser';
import { parseClientBlock } from '../parser/ClientBlockParser';

type ParserFunction = (path: string, content: any) => Promise<AddonFile | null>;
type IndexMap = { [key: string]: AddonFile };

export class FileIndexer {
    private addonStructure: AddonStructure;
    private onIndexUpdate: (structure: AddonStructure) => void;

    private readonly parserMap: Map<FileType, ParserFunction> = new Map<FileType, ParserFunction>([
        [FileType.SERVER_ENTITY, parseServerEntity as ParserFunction],
        [FileType.CLIENT_ENTITY, parseClientEntity as ParserFunction],
        [FileType.ANIMATION, parseAnimation as ParserFunction],
        [FileType.MODEL, parseModel as ParserFunction],
        [FileType.TEXTURE, parseTexture as ParserFunction],
        [FileType.PARTICLE, parseParticle as ParserFunction],
        [FileType.SOUND, parseSound as ParserFunction],
        [FileType.RENDER_CONTROLLER, parseRenderController as ParserFunction],
        [FileType.CLIENT_BLOCK, parseClientBlock as ParserFunction]
    ]);

    private readonly indexMap: Map<FileType, keyof AddonStructure['index']> = new Map([
        [FileType.SERVER_ENTITY, 'serverEntity'],
        [FileType.CLIENT_ENTITY, 'clientEntity'],
        [FileType.ANIMATION, 'animation'],
        [FileType.MODEL, 'model'],
        [FileType.TEXTURE, 'texture'],
        [FileType.PARTICLE, 'particle'],
        [FileType.SOUND, 'sound'],
        [FileType.RENDER_CONTROLLER, 'renderController'],
        [FileType.CLIENT_BLOCK, 'clientBlock']
    ]);

    constructor(onIndexUpdate: (structure: AddonStructure) => void) {
        this.onIndexUpdate = onIndexUpdate;
        this.addonStructure = this.createEmptyStructure();
    }

    private createEmptyStructure(): AddonStructure {
        return {
            resourcePacks: [],
            behaviorPacks: [],
            index: {
                serverBlock: {},
                clientBlock: {},
                serverEntity: {},
                clientEntity: {},
                animation: {},
                model: {},
                texture: {},
                particle: {},
                sound: {},
                renderController: {}
            }
        };
    }

    private async readFileContent(filePath: string): Promise<any> {
        const fileUri = vscode.Uri.file(filePath);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        return JSON.parse(Buffer.from(fileContent).toString('utf8'));
    }

    private async parseFile(filePath: string, fileType: FileType): Promise<AddonFile | null> {
        const parser = this.parserMap.get(fileType);
        if (!parser) {
            console.log(`[DEBUG] No parser found for file type: ${fileType}`);
            return null;
        }
        
        try {
            let content = null;
            if (filePath.endsWith(".json")) {
                content = await this.readFileContent(filePath);
            }
            return await parser(filePath, content);
        } catch (error) {
            console.error(`[DEBUG] Error parsing file ${filePath}:`, error);
            return null;
        }
    }

    private updateIndex(file: AddonFile): void {
        const indexKey = this.indexMap.get(file.type);
        if (!indexKey) {
            return;
        }

        const identifiers: string[] = [];

        if (file.type === FileType.SERVER_BLOCK) {
            identifiers.push(...file.block);
        } else if (file.type === FileType.CLIENT_BLOCK) {
            identifiers.push(...file.blocks);
        } else if (file.type === FileType.SERVER_ENTITY) {
            identifiers.push(file.entity);
        } else if (file.type === FileType.CLIENT_ENTITY) {
            identifiers.push(file.entity);
        } else if (file.type === FileType.ANIMATION) {
            identifiers.push(...file.animations);
        } else if (file.type === FileType.MODEL) {
            identifiers.push(...file.geometries);
        } else if (file.type === FileType.TEXTURE) {
            identifiers.push(file.texture);
        } else if (file.type === FileType.PARTICLE) {
            identifiers.push(...file.particles);
        } else if (file.type === FileType.SOUND) {
            identifiers.push(...file.sounds);
        } else if (file.type === FileType.RENDER_CONTROLLER) {
            identifiers.push(...file.controllers);
        }

        for (const identifier of identifiers) {
            (this.addonStructure.index[indexKey] as IndexMap)[identifier] = file;
        }
    }

    public async indexFile(filePath: string): Promise<AddonFile | null> {
        try {
            const fileType = await determineFileType(filePath);
            if (!fileType) {
                console.log(`[DEBUG] Skipping file ${filePath} - unknown type`);
                return null;
            }

            console.log(`[DEBUG] Indexing file: ${filePath} (Type: ${fileType})`);

            const parsedFile = await this.parseFile(filePath, fileType);
            if (parsedFile) {
                this.updateIndex(parsedFile);
                this.onIndexUpdate(this.addonStructure);
            }

            return parsedFile;
        } catch (error) {
            console.error(`[DEBUG] Error indexing file ${filePath}:`, error);
            return null;
        }
    }

    public async getFileType(filePath: string): Promise<FileType | null> {
        return await determineFileType(filePath);
    }

    public getAddonStructure(): AddonStructure {
        return this.addonStructure;
    }

    public async getRelatedFiles(filePath: string): Promise<Map<FileType, AddonFile[]>> {
        const result = new Map<FileType, AddonFile[]>();
        const fileType = await this.getFileType(filePath);
        if (!fileType) {
            return result;
        }

        if (fileType === FileType.SERVER_ENTITY || fileType === FileType.CLIENT_ENTITY) {
            const entityFile = fileType === FileType.SERVER_ENTITY 
                ? Object.values(this.addonStructure.index.serverEntity).find(f => f.path === filePath)
                : Object.values(this.addonStructure.index.clientEntity).find(f => f.path === filePath);

            if (entityFile && 'animations' in entityFile) {
                if (entityFile.animations) {
                    this.addRelatedFiles(result, FileType.ANIMATION, entityFile.animations, 'animation');
                }
                if (entityFile.geometries) {
                    this.addRelatedFiles(result, FileType.MODEL, entityFile.geometries, 'model');
                }
                if (entityFile.textures) {
                    this.addRelatedFiles(result, FileType.TEXTURE, entityFile.textures, 'texture');
                }
                if (entityFile.particles) {
                    this.addRelatedFiles(result, FileType.PARTICLE, entityFile.particles, 'particle');
                }
                if (entityFile.sounds) {
                    this.addRelatedFiles(result, FileType.SOUND, entityFile.sounds, 'sound');
                }
            }
        }

        return result;
    }

    private addRelatedFiles(
        result: Map<FileType, AddonFile[]>,
        fileType: FileType,
        ids: string[],
        indexKey: keyof AddonStructure['index']
    ): void {
        const files = ids
            .map(id => this.addonStructure.index[indexKey][id])
            .filter(Boolean);
        if (files.length > 0) {
            result.set(fileType, files);
        }
    }

    public updateFile(file: AddonFile): void {
        this.updateIndex(file);
        this.onIndexUpdate(this.addonStructure);
    }

    public removeFile(filePath: string, fileType: FileType): void {
        const indexKey = this.indexMap.get(fileType);
        if (!indexKey) return;

        const index = this.addonStructure.index[indexKey];
        Object.entries(index).forEach(([id, file]) => {
            if (file.path === filePath) {
                delete index[id];
            }
        });

        this.onIndexUpdate(this.addonStructure);
    }

    private async updateEntityIndex(): Promise<void> {
        // 重置所有索引
        this.addonStructure.index = this.createEmptyStructure().index;

        // 处理所有包中的文件
        const allPacks = [...this.addonStructure.resourcePacks, ...this.addonStructure.behaviorPacks];
        for (const pack of allPacks) {
            // 递归查找所有 .json 文件
            const jsonFiles = await this.findAllJsonFiles(pack);
            for (const filePath of jsonFiles) {
                const fileType = await this.getFileType(filePath);
                if (fileType) {
                    console.log(`[DEBUG] 处理${fileType}文件: ${filePath}`);
                    const parsedFile = await this.parseFile(filePath, fileType);
                    if (parsedFile) {
                        this.updateIndex(parsedFile);
                    }
                }
            }
        }

        console.log('[DEBUG] 所有索引更新完成');
    }

    // 递归查找所有 .json 文件
    private async findAllJsonFiles(rootDir: string): Promise<string[]> {
        const jsonFiles: string[] = [];
        const fs = require('fs').promises;
        const pathModule = require('path');

        async function walk(dir: string) {
            let entries: any[];
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch (e) {
                return;
            }
            for (const entry of entries) {
                const fullPath = pathModule.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.json')) {
                    jsonFiles.push(fullPath);
                }
            }
        }
        await walk(rootDir);
        return jsonFiles;
    }

    public async indexWorkspace(workspaceFolders: readonly vscode.WorkspaceFolder[]): Promise<void> {
        // 清除现有索引
        this.addonStructure = this.createEmptyStructure();

        // 为每个工作区文件夹创建索引
        for (const folder of workspaceFolders) {
            await this.indexWorkspaceFolder(folder);
        }

        // 更新索引
        await this.updateEntityIndex();
        this.onIndexUpdate(this.addonStructure);

        console.log('[DEBUG] 索引完成，当前索引结构：', JSON.stringify(this.addonStructure, null, 2));
    }

    private async indexWorkspaceFolder(folder: vscode.WorkspaceFolder): Promise<void> {
        // 递归查找所有 manifest.json
        const manifestPaths = await this.findAllManifests(folder.uri.fsPath);
        const resourcePacks: string[] = [];
        const behaviorPacks: string[] = [];

        for (const manifestPath of manifestPaths) {
            const packType = await this.parseManifestType(manifestPath);
            if (packType === 'resource') {
                resourcePacks.push(path.dirname(manifestPath));
            } else if (packType === 'behavior') {
                behaviorPacks.push(path.dirname(manifestPath));
            }
        }

        this.addonStructure.resourcePacks.push(...resourcePacks);
        this.addonStructure.behaviorPacks.push(...behaviorPacks);

        console.log('[DEBUG] 找到的资源包：', resourcePacks);
        console.log('[DEBUG] 找到的行为包：', behaviorPacks);
    }

    // 递归查找所有 manifest.json 文件
    private async findAllManifests(rootDir: string): Promise<string[]> {
        const manifests: string[] = [];
        const fs = require('fs').promises;
        const pathModule = require('path');

        async function walk(dir: string) {
            let entries: any[];
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch (e) {
                return;
            }
            for (const entry of entries) {
                const fullPath = pathModule.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile() && entry.name === 'manifest.json') {
                    manifests.push(fullPath);
                }
            }
        }
        await walk(rootDir);
        return manifests;
    }

    // 解析 manifest.json 判断类型
    private async parseManifestType(manifestPath: string): Promise<'resource' | 'behavior' | null> {
        try {
            const content = await this.readFileContent(manifestPath);
            if (content && content.modules && Array.isArray(content.modules)) {
                for (const mod of content.modules) {
                    if (mod.type === 'resources') {
                        return 'resource';
                    } else if (mod.type === 'data') {
                        return 'behavior';
                    }
                }
            }
        } catch (e) {
            // 忽略解析错误
        }
        return null;
    }

    private clearIndex() {
        if (!this.addonStructure) {
            return;
        }

        // 清空客户端方块索引
        this.addonStructure.index.clientBlock = {};

        // ... existing code ...
    }
} 