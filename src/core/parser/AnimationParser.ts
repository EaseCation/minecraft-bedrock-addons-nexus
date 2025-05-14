import { AddonFileAnimation, FileType } from '../types';
import * as fs from 'fs';

export async function parseAnimation(path: string, content: any): Promise<AddonFileAnimation | null> {
    try {
        if (!content.animations) {
            return null;
        }
        const stat = await fs.promises.stat(path);
        return {
            path,
            type: FileType.ANIMATION,
            animations: Object.keys(content.animations),
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error('AnimationParser: 解析动画文件时出错:', error);
        return null;
    }
}