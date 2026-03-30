# Requirements Document

## Introduction

智能政治背诵系统是一个基于 React + TypeScript + Vite 的政治学习背诵网页应用。该系统通过 AI 内容解析、多种学习模式和间隔重复算法，帮助用户高效记忆政治学习内容。

## Glossary

- **Study_System**: 智能政治背诵系统主应用
- **AI_Parser**: DeepSeek API 驱动的内容解析模块
- **Learning_Module**: 学习模式组件（挖空、选择题、配对等）
- **SM2_Scheduler**: 基于 SM-2 算法的间隔重复调度器
- **User_Service**: 用户认证与数据同步服务
- **Statistics_Tracker**: 学习数据统计与分析模块
- **Content_Item**: 用户输入的政治文本内容单元
- **Review_Card**: 待复习的学习卡片
- **Mastery_Level**: 章节掌握程度（0-100%）

## Requirements

### Requirement 1: AI 内容解析

**User Story:** As a 学习者, I want to 输入政治文本并让 AI 自动解析, so that 我可以快速生成多种学习材料。

#### Acceptance Criteria

1. WHEN 用户输入政治文本并提交 THEN THE AI_Parser SHALL 调用 DeepSeek API 解析文本内容
2. WHEN AI 解析完成 THEN THE AI_Parser SHALL 自动识别并拆分章节结构
3. WHEN 章节拆分完成 THEN THE AI_Parser SHALL 提取关键词、概念和定义
4. WHEN 内容提取完成 THEN THE Study_System SHALL 生成挖空填词、选择题、术语配对等学习材料
5. IF DeepSeek API 调用失败 THEN THE Study_System SHALL 显示错误提示并允许重试
6. WHEN 生成记忆口诀 THEN THE AI_Parser SHALL 创建押韵且易记的助记内容

### Requirement 2: 挖空填词学习模式

**User Story:** As a 学习者, I want to 通过挖空填词练习, so that 我可以强化主动回忆能力。

#### Acceptance Criteria

1. WHEN 用户进入挖空填词模式 THEN THE Learning_Module SHALL 显示带有关键词遮盖的文本
2. WHEN 用户点击遮盖区域 THEN THE Learning_Module SHALL 显示输入框供用户填写
3. WHEN 用户提交答案 THEN THE Learning_Module SHALL 验证答案正确性并显示反馈
4. IF 答案正确 THEN THE Learning_Module SHALL 显示正确提示并更新掌握度
5. IF 答案错误 THEN THE Learning_Module SHALL 显示正确答案并标记为需要复习
6. WHEN 完成一组挖空练习 THEN THE Statistics_Tracker SHALL 记录正确率和用时

### Requirement 3: 选择题测验模式

**User Story:** As a 学习者, I want to 通过选择题测验, so that 我可以检验对知识点的理解。

#### Acceptance Criteria

1. WHEN 用户进入选择题模式 THEN THE Learning_Module SHALL 显示四选一的选择题
2. WHEN 用户选择答案 THEN THE Learning_Module SHALL 立即显示正确与否
3. WHEN 显示答案结果 THEN THE Learning_Module SHALL 提供详细的答案解析
4. WHEN 完成一道选择题 THEN THE SM2_Scheduler SHALL 根据答题结果更新复习计划
5. WHEN 完成一组选择题 THEN THE Statistics_Tracker SHALL 记录正确率统计

### Requirement 4: 术语配对学习模式

**User Story:** As a 学习者, I want to 通过术语配对练习, so that 我可以建立概念与定义的关联。

#### Acceptance Criteria

1. WHEN 用户进入术语配对模式 THEN THE Learning_Module SHALL 显示概念列表和定义列表
2. WHEN 用户拖拽或点击进行配对 THEN THE Learning_Module SHALL 记录配对选择
3. WHEN 用户完成所有配对 THEN THE Learning_Module SHALL 验证配对正确性
4. IF 配对正确 THEN THE Learning_Module SHALL 显示成功动画
5. IF 配对错误 THEN THE Learning_Module SHALL 高亮显示错误项并提供正确答案

### Requirement 5: 记忆口诀生成

**User Story:** As a 学习者, I want to 获取 AI 生成的记忆口诀, so that 我可以更容易记住复杂内容。

#### Acceptance Criteria

1. WHEN 用户请求生成记忆口诀 THEN THE AI_Parser SHALL 调用 DeepSeek API 生成押韵助记
2. WHEN 口诀生成完成 THEN THE Learning_Module SHALL 显示口诀内容
3. WHEN 用户查看口诀 THEN THE Learning_Module SHALL 提供收藏功能
4. WHEN 用户收藏口诀 THEN THE User_Service SHALL 保存到用户数据中

### Requirement 6: 语音朗读功能

**User Story:** As a 学习者, I want to 听取内容的语音朗读, so that 我可以通过听觉通道强化记忆。

#### Acceptance Criteria

1. WHEN 用户点击朗读按钮 THEN THE Learning_Module SHALL 使用 Web Speech API 朗读内容
2. WHILE 朗读进行中 THEN THE Learning_Module SHALL 高亮当前朗读的文本
3. WHEN 用户点击暂停 THEN THE Learning_Module SHALL 暂停朗读并保持位置
4. WHEN 用户调整语速 THEN THE Learning_Module SHALL 按新语速继续朗读

### Requirement 7: 间隔重复系统

**User Story:** As a 学习者, I want to 使用间隔重复系统复习, so that 我可以在最佳时间点复习以对抗遗忘。

#### Acceptance Criteria

1. WHEN 用户完成学习卡片 THEN THE SM2_Scheduler SHALL 使用 SM-2 算法计算下次复习时间
2. WHEN 存在待复习内容 THEN THE Study_System SHALL 在首页显示复习提醒
3. WHEN 用户查看复习计划 THEN THE Study_System SHALL 显示遗忘曲线可视化图表
4. WHEN 用户完成复习 THEN THE SM2_Scheduler SHALL 更新卡片的复习间隔和难度系数
5. IF 用户评价记忆困难 THEN THE SM2_Scheduler SHALL 缩短复习间隔

### Requirement 8: 用户注册与登录

**User Story:** As a 用户, I want to 注册和登录账户, so that 我可以保存学习进度。

#### Acceptance Criteria

1. WHEN 用户选择邮箱注册 THEN THE User_Service SHALL 通过 Supabase 创建账户
2. WHEN 用户输入登录凭证 THEN THE User_Service SHALL 验证并建立会话
3. IF 登录失败 THEN THE User_Service SHALL 显示具体错误信息
4. WHEN 用户选择游客模式 THEN THE Study_System SHALL 使用本地存储保存数据
5. WHEN 游客用户注册账户 THEN THE User_Service SHALL 迁移本地数据到云端

### Requirement 9: 学习进度同步

**User Story:** As a 登录用户, I want to 同步学习进度, so that 我可以在多设备间无缝学习。

#### Acceptance Criteria

1. WHEN 用户完成学习活动 THEN THE User_Service SHALL 自动同步进度到 Supabase
2. WHEN 用户在新设备登录 THEN THE User_Service SHALL 拉取最新学习数据
3. IF 网络断开 THEN THE Study_System SHALL 缓存数据并在恢复后同步
4. WHEN 发生数据冲突 THEN THE User_Service SHALL 以最新时间戳为准合并数据

### Requirement 10: 学习数据统计

**User Story:** As a 学习者, I want to 查看学习统计数据, so that 我可以了解学习效果和进度。

#### Acceptance Criteria

1. WHEN 用户访问统计页面 THEN THE Statistics_Tracker SHALL 显示总学习时长
2. WHEN 用户查看统计 THEN THE Statistics_Tracker SHALL 显示各模式的正确率
3. WHEN 用户查看章节分析 THEN THE Statistics_Tracker SHALL 显示各章节掌握度百分比
4. WHEN 用户查看日历视图 THEN THE Statistics_Tracker SHALL 显示复习计划和学习记录

### Requirement 11: 响应式设计与移动端支持

**User Story:** As a 移动端用户, I want to 在手机上流畅使用应用, so that 我可以随时随地学习。

#### Acceptance Criteria

1. WHEN 用户在移动设备访问 THEN THE Study_System SHALL 自适应屏幕尺寸
2. WHEN 屏幕宽度小于 768px THEN THE Study_System SHALL 切换为移动端布局
3. WHEN 用户使用触摸操作 THEN THE Learning_Module SHALL 支持触摸手势交互

### Requirement 12: 离线缓存支持

**User Story:** As a 学习者, I want to 在离线时继续学习, so that 我不受网络限制。

#### Acceptance Criteria

1. WHEN 应用首次加载 THEN THE Study_System SHALL 注册 Service Worker 缓存资源
2. WHEN 网络断开 THEN THE Study_System SHALL 从缓存加载已下载的学习内容
3. WHEN 用户在离线时完成学习 THEN THE Study_System SHALL 本地保存进度待同步

### Requirement 13: 深色模式

**User Story:** As a 用户, I want to 切换深色模式, so that 我可以在低光环境下舒适学习。

#### Acceptance Criteria

1. WHEN 用户点击主题切换 THEN THE Study_System SHALL 切换深色/浅色主题
2. WHEN 系统偏好为深色模式 THEN THE Study_System SHALL 默认使用深色主题
3. WHEN 主题切换 THEN THE Study_System SHALL 保存用户偏好设置
