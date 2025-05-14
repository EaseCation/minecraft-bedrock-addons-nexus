// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FileIndexManager } from './core/indexer/FileIndexManager';
import { RelatedFilesView } from './ui/views/RelatedFilesView';
import { RelatedFilesController } from './ui/controller/RelatedFilesController';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('Minecraft Bedrock Addons Nexus 已激活');

	// 创建文件索引管理器
	const fileIndexManager = new FileIndexManager();

	// 创建相关文件视图
	const relatedFilesView = new RelatedFilesView();
	const treeView = vscode.window.createTreeView('relatedFilesView', {
		treeDataProvider: relatedFilesView
	});
	context.subscriptions.push(treeView);

	// 创建相关文件控制器
	const relatedFilesController = new RelatedFilesController(relatedFilesView, fileIndexManager);
	context.subscriptions.push(relatedFilesController);

	// 显示加载提示
	const loadingMessage = vscode.window.setStatusBarMessage('正在初始化文件索引...');

	try {
		// 初始化工作区
		await fileIndexManager.initialize();
		
		// 初始化完成后，刷新当前文件
		await relatedFilesController.refreshCurrentFile();
	} finally {
		// 清除加载提示
		loadingMessage.dispose();
	}

	// 注册命令
	let disposable = vscode.commands.registerCommand('minecraft-bedrock-addons-nexus.refresh', async () => {
		const loadingMessage = vscode.window.setStatusBarMessage('正在刷新文件索引...');
		try {
			await fileIndexManager.initialize();
			await relatedFilesController.refreshCurrentFile();
		} finally {
			loadingMessage.dispose();
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Minecraft Bedrock Addons Nexus 已停用');
}
