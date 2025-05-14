import { AddonFileServerEntity, AddonFileClientEntity, FileType } from '../types';

export async function parseServerEntity(path: string, content: any): Promise<AddonFileServerEntity | null> {
    try {
        const identifier = content['minecraft:entity']?.description?.identifier;
        if (!identifier) {
            return null;
        }
        return {
            path,
            type: FileType.SERVER_ENTITY,
            entity: identifier
        };
    } catch (error) {
        console.error('EntityParser: 解析服务端实体文件时出错:', error);
        return null;
    }
}

export async function parseClientEntity(path: string, content: any): Promise<AddonFileClientEntity | null> {
    try {
        const description = content['minecraft:client_entity']?.description;
        const identifier = description?.identifier;
        if (!identifier) {
            return null;
        }

        const animations: string[] = [];
        const geometries: string[] = [];
        const textures: string[] = [];
        const particles: string[] = [];
        const sounds: string[] = [];
        const renderControllers: string[] = [];

        // 解析动画
        if (description.animations) {
            animations.push(...Object.values(description.animations) as string[]);
        }

        // 解析几何体
        if (description.geometry) {
            geometries.push(...Object.values(description.geometry) as string[]);
        }

        // 解析纹理
        if (description.textures) {
            textures.push(...Object.values(description.textures) as string[]);
        }

        // 解析粒子
        if (description.particle_effects) {
            particles.push(...Object.values(description.particle_effects) as string[]);
        }

        // 解析音效
        if (description.sound_effects) {
            sounds.push(...Object.values(description.sound_effects) as string[]);
        }

        // 解析渲染控制器
        if (description.render_controllers) {
            renderControllers.push(...description.render_controllers);
        }

        return {
            path,
            type: FileType.CLIENT_ENTITY,
            entity: identifier,
            animations,
            geometries,
            textures,
            particles,
            sounds,
            renderControllers
        };
    } catch (error) {
        console.error('EntityParser: 解析客户端实体文件时出错:', error);
        return null;
    }
} 