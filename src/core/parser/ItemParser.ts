import { AddonFileItem, FileType } from '../types';

export async function parseItem(filePath: string, content: any): Promise<AddonFileItem | null> {
    try {
        const itemData = content['minecraft:item'];
        
        if (!itemData || !itemData.description || !itemData.description.identifier) {
            return null;
        }

        return {
            path: filePath,
            type: FileType.ITEM,
            updatedAt: Date.now(),
            item: itemData.description.identifier
        };
    } catch (error) {
        console.warn(`[DEBUG] 解析物品文件出错 ${filePath}:`, error);
        return null;
    }
} 