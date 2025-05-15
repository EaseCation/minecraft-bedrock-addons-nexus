# Minecraft Bedrock Addons Nexus

一个用于管理 Minecraft Bedrock Addons 文件的 VSCode 插件。该插件提供了一个侧边栏界面，实时展示当前打开文件的所有相关文件。

## 功能特点

- 自动扫描工作目录下的所有资源包和行为包
- 自动解析 Addons 文件结构，建立多级索引
- 实时监听文件更改，自动更新索引
- 提供直观的侧边栏界面，展示相关文件
- 支持快速跳转到相关文件
- 使用不同图标区分不同类型的文件

## 安装

1. 在 VSCode 中打开扩展面板 (Ctrl+Shift+X)
2. 搜索 "Minecraft Bedrock Addons Nexus"
3. 点击安装

## 使用方法

1. 打开一个 Minecraft Bedrock Addon 项目
2. 在侧边栏中找到 "Minecraft Bedrock Addons" 图标
3. 打开任意实体文件，侧边栏将自动显示所有相关文件
4. 点击相关文件可以快速跳转

## 支持的文件类型

- 服务端实体定义
- 客户端实体定义
- 动画文件
- 模型文件
- 贴图文件
- 粒子效果
- 音效文件

## 开发

### 环境要求

- Node.js 20.x
- VSCode 1.100.0 或更高版本

### 构建步骤

1. 克隆仓库
```bash
git clone https://github.com/EaseCation/minecraft-bedrock-addons-nexus.git
```

2. 安装依赖
```bash
npm install
```

3. 编译
```bash
npm run compile
```

4. 运行测试
```bash
npm test
```

### 项目结构

```
minecraft-bedrock-addons-nexus/
├── src/
│   ├── core/           # 核心功能实现
│   ├── ui/            # 用户界面相关
│   ├── types/         # TypeScript 类型定义
│   └── utils/         # 工具函数
├── resources/         # 资源文件
├── intellij/         # IntelliJ IDEA 插件代码
└── .github/          # GitHub Actions 配置
```

## 贡献

欢迎提交 Pull Request 或创建 Issue！

## 许可证

MIT License
