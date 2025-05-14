import { AddonFileTexture, FileType } from '../types';
import * as path from 'path';

export async function parseTexture(filePath: string, content: any): Promise<AddonFileTexture | null> {
    try {
        // 将路径转换为正斜杠格式
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // 查找 textures 目录的位置
        const texturesIndex = normalizedPath.indexOf('/textures/');
        if (texturesIndex === -1) {
            console.error('TextureParser: 无法在路径中找到 textures 目录:', filePath);
            return null;
        }

        // 获取从 textures 目录开始的相对路径
        const relativePath = normalizedPath.substring(texturesIndex + 1); // +1 是为了去掉开头的斜杠
        
        // 移除文件扩展名
        const texture = relativePath.substring(0, relativePath.lastIndexOf('.'));

        return {
            path: filePath,
            type: FileType.TEXTURE,
            texture
        };
    } catch (error) {
        console.error('TextureParser: 解析纹理文件时出错:', error);
        return null;
    }
} 