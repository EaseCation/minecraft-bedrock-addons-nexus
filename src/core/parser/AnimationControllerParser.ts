import { AddonFileAnimationController, FileType } from '../types';

export async function parseAnimationController(filePath: string, content: any): Promise<AddonFileAnimationController | null> {
    try {
        const controllers = content.animation_controllers;
        
        if (!controllers) {
            return null;
        }

        const controllerIds = Object.keys(controllers);

        return {
            path: filePath,
            type: FileType.ANIMATION_CONTROLLER,
            updatedAt: Date.now(),
            controllers: controllerIds
        };
    } catch (error) {
        console.warn(`[DEBUG] 解析动画控制器文件出错 ${filePath}:`, error);
        return null;
    }
} 