import { AddonFile, AddonFileClientBlock, AddonFileServerBlock, FileType } from '../types';
import * as path from 'path';
import * as fs from 'fs';

interface BlockDefinition {
    textures: string;
    carried_textures?: string;
    sound?: string;
}

interface BlocksJson {
    [blockIdentifier: string]: BlockDefinition;
}

export async function parseClientBlock(filePath: string, content: any): Promise<AddonFileClientBlock | null> {
    try {
        // 检查是否是 blocks.json 文件
        if (!filePath.endsWith('blocks.json')) {
            return null;
        }

        const blocksData = content as BlocksJson;
        const blocks: string[] = [];

        // 遍历所有方块定义
        for (const [blockIdentifier, blockDef] of Object.entries(blocksData)) {
            if (blockIdentifier === 'format_version') {
                continue;
            }
            blocks.push(blockIdentifier);
        }

        if (blocks.length === 0) {
            return null;
        }

        const stat = await fs.promises.stat(filePath);
        return {
            type: FileType.CLIENT_BLOCK,
            path: filePath,
            blocks: blocks,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error(`Error parsing client block file ${filePath}:`, error);
        return null;
    }
}

export async function parseServerBlock(filePath: string, content: any): Promise<AddonFileServerBlock | null> {
    try {
        if (!content["minecraft:block"] || !content["minecraft:block"]["description"]) {
            return null;
        }
        const blockDescription = content["minecraft:block"]["description"];
        const identifier = blockDescription["identifier"];
        const stat = await fs.promises.stat(filePath);
        return {
            type: FileType.SERVER_BLOCK,
            path: filePath,
            block: identifier,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error(`Error parsing server block file ${filePath}:`, error);
        return null;
    }
}