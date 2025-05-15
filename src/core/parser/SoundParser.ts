import { AddonFileSound, FileType } from '../types';
import * as fs from 'fs';

export async function parseSound(path: string, content: any): Promise<AddonFileSound | null> {
    try {
        let originalContent: {[key: string]: any};
        if (content['format_version'] && content['sound_definitions']) {
            originalContent = content['sound_definitions'];
        } else {
            originalContent = content;
        }
        const sounds: string[] = Object.keys(originalContent);
        
        if (sounds.length === 0) {
            return null;
        }

        const stat = await fs.promises.stat(path);
        return {
            path,
            type: FileType.SOUND,
            sounds,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error('SoundParser: 解析音效文件时出错:', error);
        return null;
    }
} 