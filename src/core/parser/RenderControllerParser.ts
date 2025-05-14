import { AddonFileRenderController, FileType } from '../types';
import * as fs from 'fs';

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

        const stat = await fs.promises.stat(path);
        return {
            path,
            type: FileType.RENDER_CONTROLLER,
            controllers,
            geometries,
            textures,
            materials,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error('RenderControllerParser: 解析渲染控制器文件时出错:', error);
        return null;
    }
} 