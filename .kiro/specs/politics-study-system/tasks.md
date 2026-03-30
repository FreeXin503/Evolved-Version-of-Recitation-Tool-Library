# Implementation Plan: 智能政治背诵系统

## Overview

基于 React + TypeScript + Vite 构建智能政治背诵系统，采用增量开发方式，从核心功能开始逐步扩展。

## Tasks

- [x] 1. 项目初始化与基础架构
  - [x] 1.1 使用 Vite 创建 React + TypeScript 项目
    - 配置 Vite、TypeScript、ESLint、Prettier
    - 安装核心依赖：zustand、tailwindcss、@supabase/supabase-js
    - _Requirements: 11.1_
  - [x] 1.2 配置 Tailwind CSS 和深色模式
    - 设置 Tailwind 配置文件
    - 实现深色模式 CSS 变量
    - _Requirements: 13.1, 13.2_
  - [x] 1.3 创建目录结构和类型定义
    - 创建 src/types/index.ts 定义核心类型
    - 创建目录结构：components、services、stores、hooks、utils
    - _Requirements: 1.2, 1.3_

- [x] 2. 状态管理与主题系统
  - [x] 2.1 实现 Zustand 状态管理
    - 创建 useThemeStore 管理主题状态
    - 创建 useUserStore 管理用户状态
    - 创建 useContentStore 管理学习内容
    - _Requirements: 13.1, 13.3_
  - [x] 2.2 编写主题切换属性测试
    - **Property 14: 主题切换幂等性**
    - **Validates: Requirements 13.1**
  - [x] 2.3 编写主题持久化属性测试
    - **Property 15: 主题设置持久化**
    - **Validates: Requirements 13.3**

- [x] 3. SM-2 间隔重复算法
  - [x] 3.1 实现 SM-2 算法核心逻辑
    - 创建 src/services/sm2/scheduler.ts
    - 实现 calculateSM2 函数
    - 实现 getDueCards 和 updateCardProgress 函数
    - _Requirements: 7.1, 7.4, 7.5_
  - [x] 3.2 编写 SM-2 算法属性测试
    - **Property 7: SM-2 算法正确性**
    - **Validates: Requirements 7.1, 7.4, 7.5**
  - [x] 3.3 编写待复习卡片属性测试
    - **Property 8: 待复习卡片提醒**
    - **Validates: Requirements 7.2**

- [x] 4. Checkpoint - 核心算法验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. DeepSeek API 集成
  - [x] 5.1 实现 AI 服务封装
    - 创建 src/services/ai/deepseek.ts
    - 实现 API 调用、重试逻辑和错误处理
    - 定义解析、生成选择题、生成口诀的 Prompt
    - _Requirements: 1.1, 1.5, 5.1_
  - [x] 5.2 实现内容解析器
    - 创建 src/services/ai/parser.ts
    - 实现 parseContent 解析文本为章节、关键词、概念
    - 实现 generateLearningMaterials 生成学习材料
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 5.3 编写内容解析属性测试
    - **Property 1: 内容解析完整性**
    - **Validates: Requirements 1.2, 1.3**
  - [x] 5.4 编写学习材料生成属性测试
    - **Property 2: 学习材料生成完整性**
    - **Validates: Requirements 1.4**

- [x] 6. 学习模式 - 挖空填词
  - [x] 6.1 实现挖空填词逻辑
    - 创建 src/services/learning/fillBlank.ts
    - 实现关键词提取和遮盖逻辑
    - 实现答案验证函数
    - _Requirements: 2.1, 2.3_
  - [x] 6.2 创建挖空填词组件
    - 创建 src/components/learning/FillBlank.tsx
    - 实现遮盖显示、输入框、反馈动画
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [x] 6.3 编写答案验证属性测试
    - **Property 3: 答案验证正确性**
    - **Validates: Requirements 2.3**

- [x] 7. 学习模式 - 选择题
  - [x] 7.1 实现选择题生成逻辑
    - 创建 src/services/learning/quiz.ts
    - 实现从 AI 响应解析选择题
    - 实现答案验证和解析显示
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.2 创建选择题组件
    - 创建 src/components/learning/Quiz.tsx
    - 实现四选一界面、答案反馈、解析显示
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.3 编写选择题结构属性测试
    - **Property 6: 选择题结构正确性**
    - **Validates: Requirements 3.1, 3.3**

- [x] 8. 学习模式 - 术语配对
  - [x] 8.1 实现术语配对逻辑
    - 创建 src/services/learning/matching.ts
    - 实现配对验证逻辑
    - _Requirements: 4.1, 4.3_
  - [x] 8.2 创建术语配对组件
    - 创建 src/components/learning/Matching.tsx
    - 实现拖拽/点击配对交互
    - 实现正确/错误反馈
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 9. 学习模式 - 记忆口诀与语音朗读
  - [x] 9.1 实现记忆口诀功能
    - 创建 src/services/learning/mnemonic.ts
    - 调用 DeepSeek API 生成口诀
    - _Requirements: 5.1, 5.2, 1.6_
  - [x] 9.2 实现语音朗读功能
    - 创建 src/services/learning/speech.ts
    - 封装 Web Speech API
    - 实现播放、暂停、语速控制
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 9.3 创建口诀和朗读组件
    - 创建 src/components/learning/Mnemonic.tsx
    - 创建 src/components/learning/SpeechReader.tsx
    - _Requirements: 5.2, 5.3, 6.1_

- [x] 10. Checkpoint - 学习模式验证
  - 确保所有学习模式功能正常，如有问题请询问用户

- [x] 11. 统计追踪系统
  - [x] 11.1 实现统计服务
    - 创建 src/services/statistics/tracker.ts
    - 实现学习时长、正确率、掌握度计算
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 11.2 创建统计组件
    - 创建 src/components/statistics/Dashboard.tsx
    - 实现遗忘曲线图表（使用 recharts）
    - 实现日历视图
    - _Requirements: 7.3, 10.4_
  - [x] 11.3 编写统计记录属性测试
    - **Property 5: 统计记录正确性**
    - **Validates: Requirements 2.6, 3.5**
  - [x] 11.4 编写统计计算属性测试
    - **Property 13: 统计计算正确性**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 12. 学习进度更新
  - [x] 12.1 实现进度更新逻辑
    - 创建 src/services/progress/updater.ts
    - 实现正确答案增加掌握度
    - 实现错误答案标记复习
    - _Requirements: 2.4, 2.5, 3.4_
  - [x] 12.2 编写学习进度更新属性测试
    - **Property 4: 学习进度更新一致性**
    - **Validates: Requirements 2.4, 2.5, 4.5**


- [x] 13. Supabase 用户认证
  - [x] 13.1 配置 Supabase 客户端
    - 创建 src/services/auth/supabase.ts
    - 配置 Supabase 客户端连接
    - _Requirements: 8.1_
  - [x] 13.2 实现认证服务
    - 创建 src/services/auth/authService.ts
    - 实现 signUp、signIn、signOut、getCurrentUser
    - 实现错误处理和会话管理
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 13.3 创建认证组件
    - 创建 src/components/auth/LoginForm.tsx
    - 创建 src/components/auth/RegisterForm.tsx
    - 实现表单验证和错误显示
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 14. 游客模式与本地存储
  - [x] 14.1 实现 IndexedDB 存储服务
    - 创建 src/services/storage/indexedDB.ts
    - 实现 contents、reviewCards、studySessions 的 CRUD
    - _Requirements: 8.4_
  - [x] 14.2 实现游客模式逻辑
    - 创建 src/services/storage/guestMode.ts
    - 实现本地数据存储和读取
    - _Requirements: 8.4_
  - [x] 14.3 编写游客模式存储属性测试
    - **Property 9: 游客模式本地存储**
    - **Validates: Requirements 8.4**

- [x] 15. 数据同步与迁移
  - [x] 15.1 实现云端同步服务
    - 创建 src/services/sync/syncService.ts
    - 实现自动同步和手动同步
    - 实现同步队列管理
    - _Requirements: 9.1, 9.2_
  - [x] 15.2 实现数据迁移功能
    - 创建 src/services/sync/migration.ts
    - 实现游客数据迁移到云端
    - _Requirements: 8.5_
  - [x] 15.3 实现冲突解决逻辑
    - 实现基于时间戳的冲突解决
    - _Requirements: 9.4_
  - [x] 15.4 编写数据迁移属性测试
    - **Property 10: 数据迁移一致性**
    - **Validates: Requirements 8.5**
  - [x] 15.5 编写冲突解决属性测试
    - **Property 12: 数据冲突解决**
    - **Validates: Requirements 9.4**

- [x] 16. 离线支持
  - [x] 16.1 配置 Service Worker
    - 创建 src/sw.ts
    - 配置 Vite PWA 插件
    - 实现资源缓存策略
    - _Requirements: 12.1, 12.2_
  - [x] 16.2 实现离线数据持久化
    - 实现离线学习数据保存
    - 实现网络恢复后自动同步
    - _Requirements: 9.3, 12.3_
  - [x] 16.3 编写离线同步属性测试
    - **Property 11: 离线数据持久化与同步**
    - **Validates: Requirements 9.3, 12.3**

- [x] 17. Checkpoint - 用户系统验证
  - 确保认证、存储、同步功能正常，如有问题请询问用户

- [x] 18. 页面与路由
  - [x] 18.1 配置路由
    - 安装 react-router-dom
    - 创建 src/router/index.tsx
    - 定义路由结构
    - _Requirements: 11.1_
  - [x] 18.2 创建页面组件
    - 创建 HomePage（首页/复习提醒）
    - 创建 ContentPage（内容输入）
    - 创建 LearningPage（学习模式选择）
    - 创建 StatisticsPage（统计仪表盘）
    - 创建 SettingsPage（设置页面）
    - _Requirements: 7.2, 10.4_

- [x] 19. 响应式布局
  - [x] 19.1 创建布局组件
    - 创建 src/components/layout/AppLayout.tsx
    - 创建 src/components/layout/MobileNav.tsx
    - 实现响应式导航
    - _Requirements: 11.1, 11.2_
  - [x] 19.2 实现移动端适配
    - 配置 Tailwind 响应式断点
    - 实现触摸手势支持
    - _Requirements: 11.2, 11.3_

- [x] 20. 通用 UI 组件
  - [x] 20.1 创建基础组件
    - 创建 Button、Input、Modal、Card 组件
    - 创建 Loading、Toast、ErrorBoundary 组件
    - _Requirements: 11.1_

- [x] 21. 最终集成与测试
  - [x] 21.1 集成所有模块
    - 连接所有服务和组件
    - 实现完整用户流程
    - _Requirements: All_
  - [x] 21.2 编写集成测试
    - 测试完整学习流程
    - 测试认证和同步流程
    - _Requirements: All_

- [x] 22. Final Checkpoint - 完整功能验证
  - 确保所有功能正常工作，如有问题请询问用户

## Notes

- 所有任务都是必须完成的
- 每个任务引用具体需求以确保可追溯性
- Checkpoint 任务用于阶段性验证
- 属性测试验证普遍正确性属性
- 单元测试验证具体示例和边界情况
