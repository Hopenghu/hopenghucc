# 🕰️ 澎湖时光机 - 欢迎回来，澎湖的朋友们！

> **"时光机、回头客、澎湖的朋友们，欢迎回来！"**  
> 一个基于太极五行智能体架构的澎湖地点故事平台

## 🌟 核心理念

### 🎯 时光机概念
- **过去**：记录您与澎湖的美好回忆
- **现在**：分享您当前的澎湖体验  
- **未来**：规划您下一次的澎湖之旅

### 🔄 回头客系统
- **智能识别**：自动识别重复访问的澎湖朋友
- **个性化欢迎**：为每位回头客提供专属的欢迎体验
- **记忆延续**：记住您的偏好，让每次访问都更贴心

### 🏝️ 澎湖朋友社区
- **故事连接**：通过地点故事连接志同道合的朋友
- **共同回忆**：发现与您有相似澎湖经历的朋友
- **社区分享**：分享您的澎湖故事，聆听他人的经历

## 🚀 快速開始

### 設置管理員

首次部署後，您需要將自己的帳號設置為管理員才能訪問管理後台：

#### 方法 1：使用設置腳本（推薦）

```bash
# 設置遠程資料庫（生產環境）
./scripts/set-admin.sh your-email@example.com remote

# 設置本地資料庫（開發環境）
./scripts/set-admin.sh your-email@example.com local
```

#### 方法 2：使用 D1 命令

```bash
# 遠程資料庫
npx wrangler d1 execute hopenghucc_db --remote --command "UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';"

# 本地資料庫
npx wrangler d1 execute hopenghucc_db --command "UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';"
```

#### 方法 3：使用管理後台 API（需要已登入的管理員）

```bash
curl -X POST https://www.hopenghu.cc/api/admin/users/set-role \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"email": "user@example.com", "role": "admin"}'
```

**詳細說明請參考 [ADMIN_SETUP.md](./ADMIN_SETUP.md)**

### 訪問管理後台

設置管理員後，您可以訪問：

- **AI 管理後台**: `https://www.hopenghu.cc/ai-admin`
  - 監控 AI 對話記錄
  - 查看使用統計
  - 管理知識庫
  - 問題學習系統

- **系統管理後台**: `https://www.hopenghu.cc/admin`
  - 系統狀態監控
  - 資料庫備份
  - 速率限制管理
  - 安全審計

## 🧠 太极五行智能体架构

### 三核心要素：三生万物

#### 第一核心：人（智能体三才）
```
       人
      /   \
    模型   工具
```
- **天（模型）**：智能推荐与故事生成
- **地（工具）**：Google Places API、地图服务
- **人（提示词）**：个性化用户体验引导

#### 第二核心：事（事件三态）
```
       事
      / | \
   过去 现在 未来
```
- **过去**：访问历史与回忆记录
- **现在**：实时状态与互动体验
- **未来**：计划与愿望清单

#### 第三核心：物（数据三界）
```
       物
      / | \
   形态 状态 关系
```
- **形态**：地点数据结构与展示
- **状态**：用户互动状态管理
- **关系**：用户与地点的关系网络

### 四象验证体系

#### 🐉 东方青龙（时序验证）- 时光机
- **功能**：时间线管理、历史回顾、未来规划
- **验证**：时间序列完整性、故事连贯性

#### 🦅 南方朱雀（空间验证）- 回头客
- **功能**：地理位置服务、个性化推荐、空间记忆
- **验证**：地理数据准确性、推荐相关性

#### 🐅 西方白虎（结构验证）- 社区结构
- **功能**：用户关系网络、社区结构、数据一致性
- **验证**：关系图连通性、数据结构一致性

#### 🐢 北方玄武（状态验证）- 数据存储
- **功能**：状态持久化、历史追溯、数据完整性
- **验证**：数据完整性、版本控制、备份可用性

## ✨ 核心功能

### 🕰️ 时光机功能
- **个人时间线**：展示您的澎湖之旅时间轴
- **回忆重现**：重温您与澎湖的美好时光
- **未来规划**：规划您下一次的澎湖探索

### 🔄 回头客体验
- **智能识别**：自动识别您的访问模式
- **个性化欢迎**：专属的欢迎消息和推荐
- **记忆延续**：记住您的偏好和习惯

### 🏝️ 澎湖朋友社区
- **故事分享**：分享您的澎湖故事
- **朋友发现**：找到有相似经历的朋友
- **社区互动**：参与澎湖朋友们的讨论

### 📍 地点管理
- **智能推荐**：基于您的历史推荐新地点
- **状态管理**：来过、想来、想再来的状态记录
- **故事记录**：为每个地点记录您的故事

## 🛠️ 技术架构

### 后端架构
- **Cloudflare Workers**：无服务器运算平台
- **D1 Database**：SQLite 云端数据库
- **RESTful API**：模块化 API 设计
- **Google OAuth 2.0**：用户认证系统

### 前端架构
- **React 18**：现代化前端框架
- **Tailwind CSS**：响应式设计系统
- **Google Maps API**：地图整合服务
- **物件导向设计**：模块化组件架构

### 服务层架构
- **TimeMachineService**：时光机服务
- **ReturningVisitorService**：回头客识别服务
- **PenghuCommunityService**：澎湖社区服务
- **LocationService**：地点管理服务
- **StoryService**：故事管理服务

## 🚀 快速开始

### 前置需求
- Node.js (v14.0.0 或更高版本)
- npm 或 yarn
- Google Cloud Platform 账号（用于 API 密钥）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/Hopenghu/hopenghucc.git
cd hopenghucc
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **设置环境变量**
创建 `.env` 文件并添加以下内容：
```env
# Google API 配置
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudflare Workers 配置
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

4. **启动开发服务器**
```bash
npm start
# 或
yarn start
```

5. **部署到 Cloudflare Workers**
```bash
npm run build
npx wrangler publish
```

## 📂 项目结构

```
src/
├── components/          # 可重用组件
│   ├── LocationCard.js     # 地点卡片组件
│   ├── LocationCardGrid.js # 地点网格组件
│   ├── TimeMachine.js      # 时光机组件
│   ├── WelcomePanel.js     # 欢迎面板组件
│   └── CommunityPanel.js   # 社区面板组件
├── pages/              # 页面组件
│   ├── Home.js            # 首页（时光机入口）
│   ├── Profile.js         # 个人档案
│   ├── TimeMachine.js     # 时光机页面
│   ├── Community.js       # 社区页面
│   └── Login.js           # 登录页面
├── services/           # 服务层
│   ├── TimeMachineService.js    # 时光机服务
│   ├── ReturningVisitorService.js # 回头客服务
│   ├── PenghuCommunityService.js  # 澎湖社区服务
│   ├── LocationService.js        # 地点服务
│   └── StoryService.js           # 故事服务
├── styles/             # 样式文件
│   ├── globals.css        # 全局样式
│   ├── time-machine.css   # 时光机样式
│   └── community.css      # 社区样式
└── utils/              # 工具函数
    ├── timeUtils.js       # 时间工具
    ├── storyUtils.js      # 故事工具
    └── communityUtils.js  # 社区工具
```

## 🎨 设计理念

### 视觉设计
- **时光机主题**：时间轴、历史感、未来感的设计元素
- **澎湖风情**：融入澎湖的自然色彩和文化元素
- **温馨友好**：营造"欢迎回来"的温馨氛围

### 用户体验
- **个性化体验**：为每位用户提供独特的体验
- **故事导向**：以故事为核心的用户界面设计
- **社区感**：营造澎湖朋友社区的氛围

## 📊 开发状态

### ✅ 已完成功能
- [x] 用户认证系统（Google OAuth 2.0）
- [x] 地点管理系统
- [x] 用户互动系统（来过、想来、想再来）
- [x] 个人档案页面
- [x] 物件导向架构基础

### 🔄 开发中功能
- [ ] 时光机时间线展示
- [ ] 回头客识别系统
- [ ] 澎湖朋友社区功能
- [ ] 故事分享系统

### 📋 计划功能
- [ ] AI 智能推荐系统
- [ ] 社区互动功能
- [ ] 移动端优化
- [ ] 多语言支持

## 🤝 贡献指南

我们欢迎所有澎湖朋友参与项目开发！

### 贡献方式
1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/TimeMachineFeature`)
3. **提交更改** (`git commit -m 'Add TimeMachine feature'`)
4. **推送到分支** (`git push origin feature/TimeMachineFeature`)
5. **开启 Pull Request**

### 开发原则
- **物件导向原则**：每个功能都要有明确的物件边界
- **模块化原则**：模块之间低耦合，高内聚
- **故事导向原则**：每个功能都要考虑如何连结用户故事

## 📞 联系我们

- **项目地址**：https://github.com/Hopenghu/hopenghucc
- **网站地址**：https://www.hopenghu.cc (Cloudflare Workers)
- **问题反馈**：通过 GitHub Issues 提交

## 🚀 部署信息

### 当前部署方式
- **平台**: Cloudflare Workers
- **数据库**: Cloudflare D1
- **域名**: www.hopenghu.cc
- **状态**: ✅ 正常运行

### 已停用
- ~~Cloudflare Pages~~ (已停用，UI 设计已整合到动态网站)

## 📄 授权

本项目采用 MIT 授权条款 - 详见 [LICENSE](LICENSE) 文件

---

## 🌟 特别感谢

感谢所有澎湖的朋友们，是你们的故事让这个平台变得有意义！

**"时光机、回头客、澎湖的朋友们，欢迎回来！"** 🏝️✨

---

*最后更新: 2025-01-19*  
*版本: 2.0.0 (时光机版本)*