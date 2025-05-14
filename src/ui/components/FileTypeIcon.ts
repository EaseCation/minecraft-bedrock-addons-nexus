import * as vscode from 'vscode';
import { FileType } from '../../core/types';

export class FileTypeIcon {
    public static getIcon(type: FileType): vscode.ThemeIcon {
        switch (type) {
            case FileType.SERVER_BLOCK:
            case FileType.CLIENT_BLOCK:
                return new vscode.ThemeIcon('symbol-class');
            case FileType.SERVER_ENTITY:
            case FileType.CLIENT_ENTITY:
                return new vscode.ThemeIcon('symbol-class');
            case FileType.ANIMATION:
                return new vscode.ThemeIcon('symbol-method');
            case FileType.MODEL:
                return new vscode.ThemeIcon('symbol-structure');
            case FileType.TEXTURE:
                return new vscode.ThemeIcon('symbol-color');
            case FileType.PARTICLE:
                return new vscode.ThemeIcon('symbol-operator');
            case FileType.SOUND:
                return new vscode.ThemeIcon('symbol-event');
            case FileType.RENDER_CONTROLLER:
                return new vscode.ThemeIcon('symbol-property');
            default:
                return new vscode.ThemeIcon('symbol-file');
        }
    }
} 