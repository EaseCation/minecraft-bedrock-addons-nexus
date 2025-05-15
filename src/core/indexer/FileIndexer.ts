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
import { parseClientBlock, parseServerBlock } from '../parser/BlockParser';
import { getFileTypeMeta } from '../types/FileTypeMeta';
import { parseItem } from '../parser/ItemParser';
import { parseUI } from '../parser/UIParser';
import { parseAttachable } from '../parser/AttachableParser';
import { parseAnimationController } from '../parser/AnimationControllerParser';

type ParserFunction = (path: string, content: any) => Promise<AddonFile | null>;
type IndexMap = { [key: string]: AddonFile[] };

export type FileUsesMap = {
    [filePath: string]: { [type in FileType]?: { [key: string]: AddonFile[] } }
};
export type ResourceUsedByMap = {
    [type in FileType]?: {
        [identifier: string]: AddonFile[]
    }
};

// 常量：合法的后缀名
const FILE_EXT_NAMES = [
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".tiff",
    ".materal"
]

export class FileIndexer {
    private addonStructure: AddonStructure;
    private onIndexUpdate: (structure: AddonStructure) => void;
    public fileUsesMap: FileUsesMap = {};
    public resourceUsedByMap: ResourceUsedByMap = {};

    private readonly parserMap: Map<FileType, ParserFunction> = new Map<FileType, ParserFunction>([
        [FileType.CLIENT_BLOCK, parseClientBlock as ParserFunction],
        [FileType.SERVER_BLOCK, parseServerBlock as ParserFunction],
        [FileType.SERVER_ENTITY, parseServerEntity as ParserFunction],
        [FileType.CLIENT_ENTITY, parseClientEntity as ParserFunction],
        [FileType.ANIMATION, parseAnimation as ParserFunction],
        [FileType.MODEL, parseModel as ParserFunction],
        [FileType.TEXTURE, parseTexture as ParserFunction],
        [FileType.PARTICLE, parseParticle as ParserFunction],
        [FileType.SOUND, parseSound as ParserFunction],
        [FileType.RENDER_CONTROLLER, parseRenderController as ParserFunction],
        [FileType.ITEM, parseItem as ParserFunction],
        [FileType.UI, parseUI as ParserFunction],
        [FileType.ATTACHABLE, parseAttachable as ParserFunction],
        [FileType.ANIMATION_CONTROLLER, parseAnimationController as ParserFunction]
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
                [FileType.MANIFEST]: {},
                [FileType.SERVER_BLOCK]: {},
                [FileType.CLIENT_BLOCK]: {},
                [FileType.SERVER_ENTITY]: {},
                [FileType.CLIENT_ENTITY]: {},
                [FileType.ITEM]: {},
                [FileType.UI]: {},
                [FileType.ATTACHABLE]: {},
                [FileType.ANIMATION]: {},
                [FileType.ANIMATION_CONTROLLER]: {},
                [FileType.MODEL]: {},
                [FileType.TEXTURE]: {},
                [FileType.PARTICLE]: {},
                [FileType.SOUND]: {},
                [FileType.RENDER_CONTROLLER]: {},
                [FileType.FOG]: {},
                [FileType.UNKNOWN]: {}
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
            //console.debug(`[DEBUG] No parser found for file type: ${fileType}`);
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
        const meta = getFileTypeMeta(file.type);
        const identifiers: string[] = meta?.getIdentifiers?.(file) || [];
        
        for (const identifier of identifiers) {
            const arr = (this.addonStructure.index[file.type] as IndexMap)[identifier];
            if (!arr) {
                (this.addonStructure.index[file.type] as IndexMap)[identifier] = [file];
            } else {
                // 避免重复添加同一文件
                if (!arr.some(f => f.path === file.path)) {
                    arr.push(file);
                }
            }
        }
    }

    public async indexFile(filePath: string): Promise<AddonFile | null> {
        try {
            const fileType = await determineFileType(filePath);
            if (!fileType) {
                console.log(`[DEBUG] Skipping file ${filePath} - unknown type`);
                return null;
            }
            const parsedFile = await this.parseFile(filePath, fileType);
            if (parsedFile) {
                this.updateIndex(parsedFile);
                this.buildReferenceMaps();
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

    public removeFile(filePath: string, fileType: FileType): void {
        const index = this.addonStructure.index[fileType];
        Object.entries(index).forEach(([id, arr]) => {
            if (Array.isArray(arr)) {
                const newArr = arr.filter(f => f.path !== filePath);
                if (newArr.length === 0) {
                    delete index[id];
                } else {
                    index[id] = newArr;
                }
            }
        });
        this.buildReferenceMaps();
        this.onIndexUpdate(this.addonStructure);
    }

    private async updateEntityIndex(): Promise<void> {
        // 重置所有索引
        this.addonStructure.index = this.createEmptyStructure().index;

        // 处理所有包中的文件
        const allPacks = [...this.addonStructure.resourcePacks, ...this.addonStructure.behaviorPacks];
        for (const pack of allPacks) {
            // 递归查找所有文件
            const allFiles = await this.findAllFiles(pack);
            for (const filePath of allFiles) {
                const fileType = await this.getFileType(filePath);
                if (fileType) {
                    const parsedFile = await this.parseFile(filePath, fileType);
                    if (parsedFile) {
                        this.updateIndex(parsedFile);
                    }
                }
            }
        }
    }

    // 递归查找所有合法的文件
    private async findAllFiles(rootDir: string): Promise<string[]> {
        const files: string[] = [];
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
                } else if (entry.isFile() && FILE_EXT_NAMES.find(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
        await walk(rootDir);
        return files;
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
        this.buildReferenceMaps();
        this.onIndexUpdate(this.addonStructure);
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

    public buildReferenceMaps() {
        this.fileUsesMap = {};
        this.resourceUsedByMap = {};
        const structure = this.addonStructure;
        for (const type of Object.values(FileType)) {
            const meta = getFileTypeMeta(type);
            if (!meta?.findUsingOtherFiles) continue;
            const indexDict = structure.index[type];
            for (const [identifier, files] of Object.entries(indexDict)) {
                for (const file of files) {
                    // 正向：file 用了哪些资源（新结构，直接存）
                    const uses = meta.findUsingOtherFiles(structure, file);
                    this.fileUsesMap[file.path] = uses;
                    // 反向：被哪些文件引用
                    for (const [usedType, idMap] of Object.entries(uses)) {
                        for (const [usedId, usedFiles] of Object.entries(idMap)) {
                            for (const usedFile of usedFiles) {
                                if (!this.resourceUsedByMap[usedType as FileType]) {
                                    this.resourceUsedByMap[usedType as FileType] = {};
                                }
                                if (!this.resourceUsedByMap[usedType as FileType]![usedId]) {
                                    this.resourceUsedByMap[usedType as FileType]![usedId] = [];
                                }
                                // 避免重复
                                if (!this.resourceUsedByMap[usedType as FileType]![usedId].some(f => f.path === file.path)) {
                                    this.resourceUsedByMap[usedType as FileType]![usedId].push(file);
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log('------ buildReferenceMaps -------');
        console.log(this.fileUsesMap);
        console.log(this.resourceUsedByMap);
    }
} 