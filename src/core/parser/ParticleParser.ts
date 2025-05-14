import { AddonFileParticle, FileType } from '../types';
import * as fs from 'fs';

export async function parseParticle(path: string, content: any): Promise<AddonFileParticle | null> {
    try {
        const particles: string[] = [];
        const textures: string[] = [];

        if (content.effect) {
            particles.push(content.effect);
        }

        if (content.textures) {
            if (typeof content.textures === 'string') {
                textures.push(content.textures);
            } else if (Array.isArray(content.textures)) {
                textures.push(...content.textures);
            }
        }

        if (particles.length === 0) {
            return null;
        }

        const stat = await fs.promises.stat(path);
        return {
            path,
            type: FileType.PARTICLE,
            particles,
            textures,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error('ParticleParser: 解析粒子文件时出错:', error);
        return null;
    }
} 