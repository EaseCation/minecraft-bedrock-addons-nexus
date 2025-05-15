import { AddonFileAttachable, FileType } from '../types';

export async function parseAttachable(filePath: string, content: any): Promise<AddonFileAttachable | null> {
    try {
        const attachableData = content['minecraft:attachable'];
        
        if (!attachableData || !attachableData.description || !attachableData.description.identifier) {
            return null;
        }

        return {
            path: filePath,
            type: FileType.ATTACHABLE,
            updatedAt: Date.now(),
            attachable: attachableData.description.identifier
        };
    } catch (error) {
        console.warn(`[DEBUG] 解析附加物文件出错 ${filePath}:`, error);
        return null;
    }
} 