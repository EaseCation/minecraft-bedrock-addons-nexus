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

export type AddonFile = AddonFileServerBlock | AddonFileClientBlock | AddonFileServerEntity | AddonFileClientEntity | AddonFileItem | AddonFileUI | AddonFileAttachable | AddonFileAnimation | AddonFileAnimationController | AddonFileModel | AddonFileTexture | AddonFileParticle | AddonFileSound | AddonFileRenderController | AddonFileFog;

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

export interface AddonFileItem extends AddonFileBase {
    type: FileType.ITEM;
    item: string;
}

export interface AddonFileUI extends AddonFileBase {
    type: FileType.UI;
    ui: string;
}

export interface AddonFileAttachable extends AddonFileBase {
    type: FileType.ATTACHABLE;
    attachable: string;
}

export interface AddonFileAnimation extends AddonFileBase {
    type: FileType.ANIMATION;
    animations: string[];
}

export interface AddonFileAnimationController extends AddonFileBase {
    type: FileType.ANIMATION_CONTROLLER;
    controllers: string[];
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
    particle: string;
    texture: string;
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

export interface AddonFileFog extends AddonFileBase {
    type: FileType.FOG;
    fog: string[];
}

export interface AddonStructure {
    resourcePacks: string[];
    behaviorPacks: string[];
    index: {
        [FileType.MANIFEST]: {
            [manifestIdentifier: string]: AddonFile[];
        };
        [FileType.SERVER_BLOCK]: {
            [blockIdentifier: string]: AddonFileServerBlock[];
        };
        [FileType.CLIENT_BLOCK]: {
            [blockIdentifier: string]: AddonFileClientBlock[];
        };
        [FileType.SERVER_ENTITY]: {
            [entityIdentifier: string]: AddonFileServerEntity[];
        };
        [FileType.CLIENT_ENTITY]: {
            [entityIdentifier: string]: AddonFileClientEntity[];
        };
        [FileType.ITEM]: {
            [itemIdentifier: string]: AddonFileItem[];
        };
        [FileType.UI]: {
            [uiIdentifier: string]: AddonFileUI[];
        };
        [FileType.ATTACHABLE]: {
            [attachableIdentifier: string]: AddonFileAttachable[];
        };
        [FileType.ANIMATION]: {
            [animationIdentifier: string]: AddonFileAnimation[];
        };
        [FileType.ANIMATION_CONTROLLER]: {
            [animationControllerIdentifier: string]: AddonFileAnimationController[];
        };
        [FileType.MODEL]: {
            [modelIdentifier: string]: AddonFileModel[];
        };
        [FileType.TEXTURE]: {
            [textureIdentifier: string]: AddonFileTexture[];
        };
        [FileType.PARTICLE]: {
            [particleIdentifier: string]: AddonFileParticle[];
        };
        [FileType.SOUND]: {
            [soundIdentifier: string]: AddonFileSound[];
        };
        [FileType.RENDER_CONTROLLER]: {
            [controllerIdentifier: string]: AddonFileRenderController[];
        };
        [FileType.FOG]: {
            [fogIdentifier: string]: AddonFileFog[];
        };
        [FileType.UNKNOWN]: {
            [unknownIdentifier: string]: AddonFile[];
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