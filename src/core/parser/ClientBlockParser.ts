import { AddonFile, AddonFileClientBlock, FileType } from '../types';
import * as path from 'path';

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

        // 检查是否在 resource_pack 目录下
        if (!filePath.includes('resource_pack')) {
            return null;
        }

        const blocksData = content as BlocksJson;
        const blocks: string[] = [];

        // 遍历所有方块定义
        for (const [blockIdentifier, blockDef] of Object.entries(blocksData)) {
            blocks.push(blockIdentifier);
        }

        if (blocks.length === 0) {
            return null;
        }

        return {
            type: FileType.CLIENT_BLOCK,
            path: filePath,
            blocks: blocks
        };
    } catch (error) {
        console.error(`Error parsing client block file ${filePath}:`, error);
        return null;
    }
} 