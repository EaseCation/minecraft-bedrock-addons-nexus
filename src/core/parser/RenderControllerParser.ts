import { AddonFileRenderController, FileType } from '../types';

export async function parseRenderController(path: string, content: any): Promise<AddonFileRenderController | null> {
    try {
        // 获取控制器标识符
        if (!content['render_controllers']) {
            console.error('RenderControllerParser: 无法找到控制器标识符');
            return null;
        }

        const controllers = Object.keys(content['render_controllers']);
        const geometries: string[] = [];
        const textures: string[] = [];
        const materials: string[] = [];

        return {
            path,
            type: FileType.RENDER_CONTROLLER,
            controllers,
            geometries,
            textures,
            materials
        };
    } catch (error) {
        console.error('RenderControllerParser: 解析渲染控制器文件时出错:', error);
        return null;
    }
} 