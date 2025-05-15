import { FileType, AddonStructure, AddonFile, AddonFileClientEntity, AddonFileServerBlock, AddonFileClientBlock, AddonFileServerEntity, AddonFileModel, AddonFileAnimation, AddonFileTexture, AddonFileParticle, AddonFileSound, AddonFileRenderController } from '.';
import * as vscode from 'vscode';
import * as path from 'path';

export interface FileTypeMeta {
    type: FileType;
    label: string;
    icon: vscode.ThemeIcon;
    getIdentifiers?: (file: AddonFile) => string[] | null;
    // 查找 该资源 -使用-> [其他资源]
    findUsingOtherFiles?: (
        structure: AddonStructure,  // 完整索引
        addonFile: AddonFile  // 当前类型资源
    ) => { [type in FileType]?: { [key: string]: AddonFile[] } };
}

export const FILE_TYPE_META_LIST: FileTypeMeta[] = [
    {
        type: FileType.SERVER_BLOCK,
        label: '服务端方块',
        icon: new vscode.ThemeIcon('package'),
        getIdentifiers: (file) => (file as AddonFileServerBlock).block ? [(file as AddonFileServerBlock).block] : null,
        findUsingOtherFiles: (structure, addonFile) => {
            const result: { [type in FileType]?: { [key: string]: AddonFile[] } } = {};
            const id = (addonFile as AddonFileServerBlock).block;
            for (const [clientBlockId, files] of Object.entries(structure.index.client_block)) {
                if (!result[FileType.CLIENT_BLOCK]) {
                    result[FileType.CLIENT_BLOCK] = {};
                }
                if (!result[FileType.CLIENT_BLOCK]![clientBlockId]) {
                    result[FileType.CLIENT_BLOCK]![clientBlockId] = [];
                }
                for (const file of files) {
                    if (file.blocks.includes(id)) {
                        result[FileType.CLIENT_BLOCK]![clientBlockId].push(file);
                    }
                }
            }
            return result;
        }
    },
    {
        type: FileType.CLIENT_BLOCK,
        label: '客户端方块',
        icon: new vscode.ThemeIcon('archive'),
        getIdentifiers: (file) => (file as AddonFileClientBlock).blocks ?? null,
        findUsingOtherFiles: (structure, addonFile) => {
            const result: { [type in FileType]?: { [key: string]: AddonFile[] } } = {};
            const ids = (addonFile as AddonFileClientBlock).blocks;
            for (const id of ids) {
                for (const [serverBlockId, files] of Object.entries(structure.index.server_block)) {
                    if (!result[FileType.SERVER_BLOCK]) {
                        result[FileType.SERVER_BLOCK] = {};
                    }
                    if (!result[FileType.SERVER_BLOCK]![serverBlockId]) {
                        result[FileType.SERVER_BLOCK]![serverBlockId] = [];
                    }
                    for (const file of files) {
                        if (file.block === id) {
                            result[FileType.SERVER_BLOCK]![serverBlockId].push(file);
                        }
                    }
                }
            }
            return result;
        }
    },
    {
        type: FileType.SERVER_ENTITY,
        label: '服务端实体',
        icon: new vscode.ThemeIcon('symbol-namespace'),
        getIdentifiers: (file) => (file as AddonFileServerEntity).entity ? [(file as AddonFileServerEntity).entity] : null,
    },
    {
        type: FileType.CLIENT_ENTITY,
        label: '客户端实体',
        icon: new vscode.ThemeIcon('symbol-object'),
        getIdentifiers: (file) => (file as AddonFileClientEntity).entity ? [(file as AddonFileClientEntity).entity] : null,
        findUsingOtherFiles: (structure, addonFile) => {
            const result: { [type in FileType]?: { [key: string]: AddonFile[] } } = {};
            const entity = addonFile as AddonFileClientEntity;
            // 动画
            if (entity.animations && entity.animations.length > 0) {
                for (const animId of entity.animations) {
                    if (!result[FileType.ANIMATION]) result[FileType.ANIMATION] = {};
                    if (!result[FileType.ANIMATION]![animId]) result[FileType.ANIMATION]![animId] = [];
                    if (structure.index.animation[animId]) {
                        result[FileType.ANIMATION]![animId].push(...structure.index.animation[animId]);
                    }
                }
            }
            // 模型
            if (entity.geometries && entity.geometries.length > 0) {
                for (const geoId of entity.geometries) {
                    if (!result[FileType.MODEL]) result[FileType.MODEL] = {};
                    if (!result[FileType.MODEL]![geoId]) result[FileType.MODEL]![geoId] = [];
                    if (structure.index.model[geoId]) {
                        result[FileType.MODEL]![geoId].push(...structure.index.model[geoId]);
                    }
                }
            }
            // 纹理
            if (entity.textures && entity.textures.length > 0) {
                for (const texId of entity.textures) {
                    if (!result[FileType.TEXTURE]) result[FileType.TEXTURE] = {};
                    if (!result[FileType.TEXTURE]![texId]) result[FileType.TEXTURE]![texId] = [];
                    if (structure.index.texture[texId]) {
                        result[FileType.TEXTURE]![texId].push(...structure.index.texture[texId]);
                    }
                }
            }
            // 粒子
            if (entity.particles && entity.particles.length > 0) {
                for (const pid of entity.particles) {
                    if (!result[FileType.PARTICLE]) result[FileType.PARTICLE] = {};
                    if (!result[FileType.PARTICLE]![pid]) result[FileType.PARTICLE]![pid] = [];
                    if (structure.index.particle[pid]) {
                        result[FileType.PARTICLE]![pid].push(...structure.index.particle[pid]);
                    }
                }
            }
            // 音效
            if (entity.sounds && entity.sounds.length > 0) {
                for (const sid of entity.sounds) {
                    if (!result[FileType.SOUND]) result[FileType.SOUND] = {};
                    if (!result[FileType.SOUND]![sid]) result[FileType.SOUND]![sid] = [];
                    if (structure.index.sound[sid]) {
                        result[FileType.SOUND]![sid].push(...structure.index.sound[sid]);
                    }
                }
            }
            // 渲染控制器
            if (entity.renderControllers && entity.renderControllers.length > 0) {
                for (const rcid of entity.renderControllers) {
                    if (!result[FileType.RENDER_CONTROLLER]) result[FileType.RENDER_CONTROLLER] = {};
                    if (!result[FileType.RENDER_CONTROLLER]![rcid]) result[FileType.RENDER_CONTROLLER]![rcid] = [];
                    if (structure.index.render_controller[rcid]) {
                        result[FileType.RENDER_CONTROLLER]![rcid].push(...structure.index.render_controller[rcid]);
                    }
                }
            }
            return result;
        }
    },
    {
        type: FileType.ANIMATION,
        label: '动画',
        icon: new vscode.ThemeIcon('symbol-event'),
        getIdentifiers: (file) => (file as AddonFileAnimation).animations ?? null,
        findUsingOtherFiles: () => ({}),
    },
    {
        type: FileType.MODEL,
        label: '模型',
        icon: new vscode.ThemeIcon('symbol-structure'),
        getIdentifiers: (file) => (file as AddonFileModel).geometries ?? null,
        findUsingOtherFiles: () => ({}),
    },
    {
        type: FileType.TEXTURE,
        label: '材质',
        icon: new vscode.ThemeIcon('symbol-color'),
        getIdentifiers: (file) => (file as AddonFileTexture).texture ? [(file as AddonFileTexture).texture] : null,
        findUsingOtherFiles: () => ({}),
    },
    {
        type: FileType.PARTICLE,
        label: '粒子',
        icon: new vscode.ThemeIcon('flame'),
        getIdentifiers: (file) => (file as AddonFileParticle).particle ? [(file as AddonFileParticle).particle] : null,
        findUsingOtherFiles: (structure, addonFile) => {
            const result: { [type in FileType]?: { [key: string]: AddonFile[] } } = {};
            const particle = addonFile as AddonFileParticle;
            if (particle.texture) {
                if (!result[FileType.TEXTURE]) result[FileType.TEXTURE] = {};
                if (!result[FileType.TEXTURE]![particle.texture]) result[FileType.TEXTURE]![particle.texture] = [];
                if (structure.index.texture[particle.texture]) {
                    result[FileType.TEXTURE]![particle.texture].push(...structure.index.texture[particle.texture]);
                }
            }
            return result;
        },
    },
    {
        type: FileType.SOUND,
        label: '音效',
        icon: new vscode.ThemeIcon('unmute'),
        getIdentifiers: (file) => (file as AddonFileSound).sounds ?? null,
        findUsingOtherFiles: () => ({}),
    },
    {
        type: FileType.RENDER_CONTROLLER,
        label: '渲染控制器',
        icon: new vscode.ThemeIcon('settings-gear'),
        getIdentifiers: (file) => (file as AddonFileRenderController).controllers ?? null,
        findUsingOtherFiles: () => ({}),
    },
];

export const FILE_TYPE_META_MAP = Object.fromEntries(
    FILE_TYPE_META_LIST.map(meta => [meta.type, meta])
) as Record<FileType, FileTypeMeta | undefined>;

export function getFileTypeMeta(type: FileType): FileTypeMeta | undefined {
    return FILE_TYPE_META_MAP[type];
} 