import { AddonFileSound, FileType } from '../types';
import * as fs from 'fs';

export async function parseSound(path: string, content: any): Promise<AddonFileSound | null> {
    try {
        const sounds: string[] = [];

        if (content.sounds) {
            if (typeof content.sounds === 'string') {
                sounds.push(content.sounds);
            } else if (Array.isArray(content.sounds)) {
                content.sounds.forEach((sound: any) => {
                    if (typeof sound === 'string') {
                        sounds.push(sound);
                    } else if (sound.name) {
                        sounds.push(sound.name);
                    }
                });
            }
        }

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