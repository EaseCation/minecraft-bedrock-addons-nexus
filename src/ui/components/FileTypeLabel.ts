import { FileType } from '../../core/types';

export class FileTypeLabel {
    public static getLabel(type: FileType): string {
        switch (type) {
            case FileType.SERVER_BLOCK:
                return 'Server Block Files';
            case FileType.CLIENT_BLOCK:
                return 'Client Block Files';
            case FileType.SERVER_ENTITY:
                return 'Server Entity Files';
            case FileType.CLIENT_ENTITY:
                return 'Client Entity Files';
            case FileType.ANIMATION:
                return 'Animations';
            case FileType.MODEL:
                return 'Models';
            case FileType.TEXTURE:
                return 'Textures';
            case FileType.PARTICLE:
                return 'Particles';
            case FileType.SOUND:
                return 'Sounds';
            case FileType.RENDER_CONTROLLER:
                return 'Render Controllers';
            default:
                return 'Other Files';
        }
    }
} 