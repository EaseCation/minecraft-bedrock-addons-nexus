import { AddonFileAnimation, FileType } from '../types';

export async function parseAnimation(path: string, content: any): Promise<AddonFileAnimation | null> {
    try {
        if (!content.animations) {
            return null;
        }
        return {
            path,
            type: FileType.ANIMATION,
            animations: Object.keys(content.animations)
        };
    } catch (error) {
        console.error('AnimationParser: 解析动画文件时出错:', error);
        return null;
    }
}