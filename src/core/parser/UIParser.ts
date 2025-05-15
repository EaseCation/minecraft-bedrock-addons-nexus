import { AddonFileUI, FileType } from '../types';

export async function parseUI(filePath: string, content: any): Promise<AddonFileUI | null> {
    try {
        if (!content.namespace) {
            return null;
        }

        return {
            path: filePath,
            type: FileType.UI,
            updatedAt: Date.now(),
            ui: content.namespace
        };
    } catch (error) {
        console.warn(`[DEBUG] 解析UI文件出错 ${filePath}:`, error);
        return null;
    }
} 