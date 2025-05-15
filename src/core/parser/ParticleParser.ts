import { AddonFileParticle, FileType } from '../types';
import * as fs from 'fs';

export async function parseParticle(path: string, content: any): Promise<AddonFileParticle | null> {
    try {
        if (!content['particle_effect'] && !content['particle_effect']['description']) {
            return null;
        }

        const description = content['particle_effect']['description'];

        const identifier = description['identifier'];
        let texture = undefined;
        if (description['basic_render_parameters']) {
            texture = description['basic_render_parameters']['texture'];
        }

        const stat = await fs.promises.stat(path);
        return {
            path,
            type: FileType.PARTICLE,
            particle: identifier,
            texture,
            updatedAt: stat.mtimeMs
        };
    } catch (error) {
        console.error('ParticleParser: 解析粒子文件时出错:', error);
        return null;
    }
} 