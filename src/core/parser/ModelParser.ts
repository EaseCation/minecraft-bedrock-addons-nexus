import { AddonFileModel, FileType } from '../types';
import * as fs from 'fs';

export async function parseModel(path: string, content: any): Promise<AddonFileModel | null> {
    try {
        const geometries: string[] = [];
        
        if (content['minecraft:geometry']) {
            for (const geometry of content['minecraft:geometry']) {
                if (geometry?.description?.identifier) {
                    geometries.push(geometry.description.identifier);
                }
            }
        }

        if (geometries.length === 0) {
            return null;
        }

        const stat = await fs.promises.stat(path);
        return {
            path,
            type: FileType.MODEL,
            geometries,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error('ModelParser: 解析模型文件时出错:', error);
        return null;
    }
}