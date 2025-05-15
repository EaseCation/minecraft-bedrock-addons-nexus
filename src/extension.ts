// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FileIndexManager } from './core/indexer/FileIndexManager';
import { RelatedFilesView } from './ui/views/RelatedFilesView';
import { StructureView } from './ui/views/StructureView';
import { RelatedFilesController } from './ui/controller/RelatedFilesController';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log(vscode.l10n.t('status.activated'));

	// 创建文件索引管理器
	const fileIndexManager = new FileIndexManager();

	// 创建相关文件视图
	const relatedFilesView = new RelatedFilesView(fileIndexManager.fileIndexer);
	const treeView = vscode.window.createTreeView('relatedFilesView', {
		treeDataProvider: relatedFilesView
	});
	context.subscriptions.push(treeView);

	// 创建完整结构视图
	const structureView = new StructureView();
	const structureTreeView = vscode.window.createTreeView('structureView', {
		treeDataProvider: structureView
	});
	context.subscriptions.push(structureTreeView);

	// 创建相关文件控制器
	const relatedFilesController = new RelatedFilesController(relatedFilesView, fileIndexManager);
	context.subscriptions.push(relatedFilesController);

	// 显示加载提示
	const loadingMessage = vscode.window.setStatusBarMessage(vscode.l10n.t('status.initializing'));

	try {
		// 初始化工作区
		await fileIndexManager.initialize();
		
		// 初始化完成后，刷新当前文件
		await relatedFilesController.refreshCurrentFile();
		// 同步索引到完整结构树
		structureView.updateAddonStructure(fileIndexManager.getAddonStructure());

		// 注册文件变更回调，自动刷新UI
		fileIndexManager.fileWatcher.setOnIndexChanged(async () => {
			await relatedFilesController.refreshCurrentFile();
			structureView.updateAddonStructure(fileIndexManager.getAddonStructure());
		});
	} finally {
		// 清除加载提示
		loadingMessage.dispose();
	}

	// 注册命令
	let disposable = vscode.commands.registerCommand('minecraft-bedrock-addons-nexus.refresh', async () => {
		const loadingMessage = vscode.window.setStatusBarMessage(vscode.l10n.t('status.refreshing'));
		try {
			await fileIndexManager.initialize();
			await relatedFilesController.refreshCurrentFile();
			structureView.updateAddonStructure(fileIndexManager.getAddonStructure());
		} finally {
			loadingMessage.dispose();
		}
	});
	context.subscriptions.push(disposable);

	// 新增：注册切换仅展示最近的命令
	let toggleRecentDisposable = vscode.commands.registerCommand('minecraft-bedrock-addons-nexus.toggleShowRecentOnly', () => {
		structureView.toggleShowRecentOnly();
	});
	context.subscriptions.push(toggleRecentDisposable);

	// 新增：注册复制标识符命令
	let copyIdentifierDisposable = vscode.commands.registerCommand('minecraft-bedrock-addons-nexus.copyIdentifier', (args) => {
		if (args.label) {
			vscode.env.clipboard.writeText(args.label);
		}
	});
	context.subscriptions.push(copyIdentifierDisposable);

	// 新增：注册添加文件命令
	let addFileDisposable = vscode.commands.registerCommand('minecraft-bedrock-addons-nexus.addFile', () => {
		// TODO relatedFilesController.addFile();
		vscode.window.showInformationMessage('这个功能还没做呢');
	});
	context.subscriptions.push(addFileDisposable);
	
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Minecraft Bedrock Addons Nexus 已停用');
}
