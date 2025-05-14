export enum FileType {
    MANIFEST = 'manifest',
    SERVER_BLOCK = 'server_block',
    CLIENT_BLOCK = 'client_block',
    SERVER_ENTITY = 'server_entity',
    CLIENT_ENTITY = 'client_entity',
    ITEM = 'item',
    UI = 'ui',
    ATTACHABLE = 'attachable',
    ANIMATION = 'animation',
    ANIMATION_CONTROLLER = 'animation_controller',
    MODEL = 'model',
    TEXTURE = 'texture',
    PARTICLE = 'particle',
    SOUND = 'sound',
    RENDER_CONTROLLER = 'render_controller',
    FOG = 'fog',
    UNKNOWN = 'unknown'
}

export type AddonFile = AddonFileServerBlock | AddonFileClientBlock | AddonFileServerEntity | AddonFileClientEntity | AddonFileAnimation | AddonFileModel | AddonFileTexture | AddonFileParticle | AddonFileSound | AddonFileRenderController;

export interface AddonFileBase {
    path: string;
    type: FileType;
    updatedAt: number;
}

export interface AddonFileServerBlock extends AddonFileBase {
    type: FileType.SERVER_BLOCK;
    block: string;
}

export interface AddonFileClientBlock extends AddonFileBase {
    type: FileType.CLIENT_BLOCK;
    blocks: string[];
}

export interface AddonFileServerEntity extends AddonFileBase {
    type: FileType.SERVER_ENTITY;
    entity: string;
}

export interface AddonFileClientEntity extends AddonFileBase {
    type: FileType.CLIENT_ENTITY;
    entity: string;
    animations: string[];
    geometries: string[];
    textures: string[];
    particles: string[];
    sounds: string[];
    renderControllers: string[];
}

export interface AddonFileAnimation extends AddonFileBase {
    type: FileType.ANIMATION;
    animations: string[];
}

export interface AddonFileModel extends AddonFileBase {
    type: FileType.MODEL;
    geometries: string[];
}

export interface AddonFileTexture extends AddonFileBase {
    type: FileType.TEXTURE;
    texture: string;
}

export interface AddonFileParticle extends AddonFileBase {
    type: FileType.PARTICLE;
    particles: string[];
    textures: string[];
}

export interface AddonFileSound extends AddonFileBase {
    type: FileType.SOUND;
    sounds: string[];
}

export interface AddonFileRenderController extends AddonFileBase {
    type: FileType.RENDER_CONTROLLER;
    controllers: string[];
    geometries: string[];
    textures: string[];
    materials: string[];
}

export interface AddonStructure {
    resourcePacks: string[];
    behaviorPacks: string[];
    index: {
        serverBlock: {
            [blockIdentifier: string]: AddonFileServerBlock[];
        };
        clientBlock: {
            [blockIdentifier: string]: AddonFileClientBlock[];
        };
        serverEntity: {
            [entityIdentifier: string]: AddonFileServerEntity[];
        };
        clientEntity: {
            [entityIdentifier: string]: AddonFileClientEntity[];
        };
        animation: {
            [animationIdentifier: string]: AddonFileAnimation[];
        };
        model: {
            [modelIdentifier: string]: AddonFileModel[];
        };
        texture: {
            [textureIdentifier: string]: AddonFileTexture[];
        };
        particle: {
            [particleIdentifier: string]: AddonFileParticle[];
        };
        sound: {
            [soundIdentifier: string]: AddonFileSound[];
        };
        renderController: {
            [controllerIdentifier: string]: AddonFileRenderController[];
        };
    }
}

export interface FileRelationship {
    type: FileType;
    items: {
        identifier: string;
        file?: AddonFile;
    }[]
} 