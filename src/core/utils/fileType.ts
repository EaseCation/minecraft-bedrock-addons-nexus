import { FileType } from '../types';
import * as vscode from 'vscode';
import * as fs from 'fs';

export async function determineFileType(filePath: string): Promise<FileType> {
    // 首先通过路径判断基本类型
    if (filePath.includes('animations/') && filePath.endsWith('.json')) {
        return FileType.ANIMATION;
    }
    if (filePath.includes('models/') && filePath.endsWith('.json')) {
        return FileType.MODEL;
    }
    if (filePath.includes('textures/')) {
        return FileType.TEXTURE;
    }
    if (filePath.includes('particles/') && filePath.endsWith('.json')) {
        return FileType.PARTICLE;
    }
    if (filePath.includes('sounds/') && filePath.endsWith('.json')) {
        return FileType.SOUND;
    }
    if (filePath.includes('render_controllers/') && filePath.endsWith('.json')) {
        return FileType.RENDER_CONTROLLER;
    }

    // 对于实体文件，需要读取内容来确定类型
    if (filePath.includes('entities/') || filePath.includes('entity/')) {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const content = JSON.parse(document.getText());
            
            // 检查是否包含服务端实体定义
            if (content['minecraft:entity']) {
                return FileType.SERVER_ENTITY;
            }
            
            // 检查是否包含客户端实体定义
            if (content['minecraft:client_entity']) {
                return FileType.CLIENT_ENTITY;
            }
            
            console.log(`[DEBUG] 未找到实体定义: ${filePath}`);
        } catch (error) {
            console.warn(`[DEBUG] 读取实体文件出错 ${filePath}:`, error);
        }
    }

    console.log(`[DEBUG] 未知文件类型: ${filePath}`);
    return FileType.UNKNOWN;
} 