# 🧹 项目清理计划

## 📋 清理目标

只保留：
1. ✅ Google/Cloudflare 连接配置
2. ✅ Google login 和地图相关功能
3. ✅ 相关开发文档记录
4. ✅ 核心代码和必要文件

---

## ✅ 需要保留的文件

### 1. 核心代码（全部保留）
```
src/
├── api/              # API 路由（包含 Google auth）
├── modules/          # 模块（包含 Google auth）
├── services/         # 服务（包含 GoogleAuthService, LocationService）
├── pages/            # 页面组件
├── components/       # UI 组件
├── routes/           # 路由
├── templates/        # 模板
├── styles/           # 样式
├── utils/            # 工具函数
└── worker.js         # Worker 主文件
```

### 2. 配置文件（全部保留）
```
wrangler.toml          # Cloudflare Workers 配置（包含 Google/Cloudflare 配置）
package.json           # 依赖配置
package-lock.json      # 锁定文件
tsconfig.json          # TypeScript 配置
postcss.config.js      # PostCSS 配置
tailwind.config.js     # Tailwind 配置
vitest.config.js       # 测试配置
```

### 3. 数据库相关（全部保留）
```
migrations/            # 数据库迁移文件（29 个文件）
init.sql               # 初始化脚本
schema.sql             # 数据库架构
```

### 4. 开发文档（保留核心文档）
```
README.md                          # 主 README
QUICK_START_GUIDE.md              # 快速开始指南
DEVELOPMENT_ROADMAP.md            # 开发路线图
DEVELOPMENT_MEETING_TEMPLATE.md   # 会议模板
DEVELOPMENT_MEETING_2025-01-*.md  # 会议记录（3 个文件）
API_KEY_ERROR_DIAGNOSIS.md        # Google API 错误诊断
CLOUDFLARE_CONNECTION_REPORT.md   # Cloudflare 连接报告
CLOUDFLARE_SETUP_ANALYSIS.md      # Cloudflare 设置分析
```

### 5. Google/地图相关文件（全部保留）
```
maps-google.html                  # Google Maps 测试文件
src/modules/auth/google.js        # Google OAuth 模块
src/services/GoogleAuthService.js # Google 认证服务
src/services/locationService.js   # 地点服务（使用 Google Maps API）
src/api/auth.js                   # 认证 API（包含 Google login）
```

### 6. 脚本文件（保留必要脚本）
```
scripts/
├── check-cloudflare-connection.js  # Cloudflare 连接检查
└── migrate.js                       # 数据库迁移脚本
```

### 7. 静态网站（建议保留作为参考）
```
static-site/                       # 保留作为 UI 设计参考
```

### 8. 其他必要文件
```
public/                            # 公共资源
.gitignore                         # Git 忽略文件（如果有）
```

---

## ❌ 可以删除的文件

### 1. 测试和调试文档（删除）
```
BROWSER_TEST_*.md                 # 浏览器测试报告（4 个文件）
LOGIN_FIX_REPORT.md               # 登录修复报告
LOGIN_ISSUE_DIAGNOSIS.md          # 登录问题诊断
QUICK_FIX_SUMMARY.md               # 快速修复总结
TESTING_CHECKLIST.md               # 测试清单
MANUAL_TESTING_GUIDE.md            # 手动测试指南
DEPLOYMENT_TEST_REPORT.md          # 部署测试报告
FINAL_DEPLOYMENT_VERIFICATION.md   # 最终部署验证
```

### 2. 部署相关文档（删除）
```
DEPLOYMENT_CONFLICT_ANALYSIS.md    # 部署冲突分析
DYNAMIC_DEPLOYMENT_REPORT.md      # 动态部署报告
UNIFICATION_COMPLETE_REPORT.md    # 统一完成报告
CLOUDFLARE_PAGES_DISABLE_GUIDE.md # Pages 停用指南
PAGES_ROUTING_CONFLICT_ANALYSIS.md # Pages 路由冲突分析
ROUTING_CONFLICT_RESOLUTION.md    # 路由冲突解决
NEXT_STEPS_COMPLETE.md            # 下一步完成报告
```

### 3. 错误诊断文档（删除）
```
ERROR_DIAGNOSIS_REPORT.md         # 错误诊断报告
FINAL_ERROR_ANALYSIS.md           # 最终错误分析
BACKUP_FIX_REPORT.md              # 备份修复报告
LOCATION_CARDS_FIX_REPORT.md      # 地点卡片修复报告
LOCATION_CARDS_UPDATE_REPORT.md   # 地点卡片更新报告
```

### 4. 架构和设计文档（删除）
```
OBJECT_ORIENTED_ARCHITECTURE_REPORT.md  # 面向对象架构报告
GRADUAL_REFACTORING_PLAN.md             # 渐进式重构计划
MINIMAL_DEVELOPMENT_PLAN.md              # 最小开发计划
UI_UX_DESIGN_PLAN.md                     # UI/UX 设计计划
0414-CSS.md                              # CSS 文档
0415-物件導向架構-0.md                   # 架构文档
0415-物件導向架構.md                     # 架构文档
PHILOSOPHICAL_DISCUSSION_2025-01-17.md   # 哲学讨论
```

### 5. 项目状态文档（删除）
```
PROJECT_STATUS_REPORT.md           # 项目状态报告
TODO_BACKUP_NEXT_STEPS.md          # TODO 备份
IMAGE_HANDLING.md                  # 图片处理文档
```

### 6. 测试和临时文件（删除）
```
test-server.js                     # 测试服务器
test.html                          # 测试 HTML
maps-google.html                   # ⚠️ 保留（Google Maps 测试）
20250412-newplace_page.png         # 临时图片
table_info_users_old.txt           # 旧表信息
twilio_2FA_recovery_code.txt       # Twilio 恢复代码（敏感信息）
performance-monitor.log             # 性能监控日志
```

### 7. 旧构建文件（清理）
```
dist/
├── worker-*.js                    # 删除所有旧版本 worker 文件
├── worker.css                      # 保留（当前构建）
└── worker.js                       # 保留（当前构建）
└── images/                        # 保留
```

### 8. 旧 Worker 文件（删除）
```
src/
├── worker-*.js                    # 删除所有旧版本 worker 文件
├── worker-*.ts                    # 删除所有旧版本 worker 文件
├── App.js                         # 删除（React 应用，不使用）
├── index.js                       # 删除（React 入口，不使用）
└── reportWebVitals.js             # 删除（React 相关）
```

### 9. 测试脚本（删除）
```
scripts/
├── test-backup.js                 # 测试备份脚本
├── test-deployment.js              # 测试部署脚本
├── verify-deployment.sh            # 验证部署脚本
├── monitor-performance.sh          # 性能监控脚本
└── quick-test.sh                   # 快速测试脚本
```

### 10. 其他配置文件（删除）
```
wrangler-v2.toml                   # 旧配置文件（已注释）
README_0.md                        # 旧 README
```

---

## 📊 清理统计

### 预计删除
- **文档文件**: ~35 个
- **测试文件**: ~10 个
- **旧构建文件**: ~10 个
- **脚本文件**: ~5 个
- **总计**: ~60 个文件

### 保留
- **核心代码**: src/ 目录（全部）
- **配置文件**: 7 个
- **数据库文件**: 31 个
- **开发文档**: 11 个
- **静态网站**: static-site/（作为参考）

---

## 🎯 执行步骤

1. **备份重要文件**（可选）
2. **删除文档文件**
3. **删除测试文件**
4. **清理旧构建文件**
5. **删除旧 Worker 文件**
6. **删除测试脚本**
7. **验证核心功能**

---

**创建时间**: 2025-01-19  
**状态**: 待执行

