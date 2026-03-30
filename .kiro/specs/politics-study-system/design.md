# Design Document: 智能政治背诵系统

## Overview

智能政治背诵系统是一个基于 React + TypeScript + Vite 构建的单页应用（SPA），采用组件化架构设计。系统通过 DeepSeek API 实现 AI 内容解析，使用 Supabase 作为后端服务（认证 + 数据库），并实现 SM-2 间隔重复算法来优化学习效果。

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **样式方案**: Tailwind CSS
- **后端服务**: Supabase (Auth + PostgreSQL)
- **AI 服务**: DeepSeek API
- **语音合成**: Web Speech API
- **离线支持**: Service Worker + IndexedDB

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Pages   │ │Components│ │  Hooks   │ │ Contexts │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                        Application Layer                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ AI Service   │ │ SM2 Scheduler│ │ Auth Service │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                         Data Layer                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Supabase   │ │  IndexedDB   │ │ LocalStorage │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 目录结构

```
src/
├── components/          # 可复用 UI 组件
│   ├── common/          # 通用组件 (Button, Input, Modal)
│   ├── learning/        # 学习模式组件
│   └── layout/          # 布局组件
├── pages/               # 页面组件
├── services/            # 业务服务
│   ├── ai/              # DeepSeek API 封装
│   ├── auth/            # Supabase 认证
│   ├── sm2/             # SM-2 算法实现
│   └── storage/         # 数据存储抽象
├── stores/              # Zustand 状态管理
├── hooks/               # 自定义 Hooks
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
└── styles/              # 全局样式
```

## Components and Interfaces

### 核心服务接口

```typescript
// AI 解析服务
interface AIParserService {
  parseContent(text: string): Promise<ParsedContent>;
  generateMnemonic(content: string): Promise<string>;
  generateQuestions(content: ParsedContent): Promise<Question[]>;
}

interface ParsedContent {
  id: string;
  title: string;
  chapters: Chapter[];
  keywords: Keyword[];
  concepts: Concept[];
  createdAt: Date;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  order: number;
}

interface Keyword {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
}

interface Concept {
  name: string;
  definition: string;
  relatedTerms: string[];
}
```

```typescript
// SM-2 调度器接口
interface SM2Scheduler {
  calculateNextReview(card: ReviewCard, quality: number): ReviewSchedule;
  getDueCards(userId: string): Promise<ReviewCard[]>;
  updateCardProgress(cardId: string, result: ReviewResult): Promise<void>;
}

interface ReviewCard {
  id: string;
  contentId: string;
  userId: string;
  easeFactor: number;      // 难度系数 (默认 2.5)
  interval: number;        // 复习间隔（天）
  repetitions: number;     // 重复次数
  nextReviewDate: Date;
  lastReviewDate: Date;
}

interface ReviewSchedule {
  nextReviewDate: Date;
  newInterval: number;
  newEaseFactor: number;
}

interface ReviewResult {
  cardId: string;
  quality: number;         // 0-5 评分
  responseTime: number;    // 响应时间（毫秒）
  timestamp: Date;
}
```

```typescript
// 用户服务接口
interface UserService {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  syncProgress(progress: LearningProgress): Promise<void>;
  getProgress(): Promise<LearningProgress>;
}

interface User {
  id: string;
  email: string;
  isGuest: boolean;
  createdAt: Date;
}

interface LearningProgress {
  userId: string;
  totalStudyTime: number;
  contentProgress: ContentProgress[];
  reviewCards: ReviewCard[];
  lastSyncAt: Date;
}
```

```typescript
// 学习模式接口
interface LearningMode {
  type: 'fill-blank' | 'quiz' | 'matching' | 'mnemonic' | 'speech';
  start(content: ParsedContent): void;
  submit(answer: Answer): ValidationResult;
  getProgress(): ModeProgress;
}

interface ValidationResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  score: number;
}

interface ModeProgress {
  total: number;
  completed: number;
  correct: number;
  timeSpent: number;
}
```

### 学习模式组件

```typescript
// 挖空填词组件
interface FillBlankProps {
  content: Chapter;
  blanks: BlankItem[];
  onComplete: (result: ModeProgress) => void;
}

interface BlankItem {
  id: string;
  position: number;
  answer: string;
  hint?: string;
}

// 选择题组件
interface QuizProps {
  questions: Question[];
  onAnswer: (questionId: string, answer: string) => void;
  onComplete: (result: ModeProgress) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// 术语配对组件
interface MatchingProps {
  terms: MatchPair[];
  onComplete: (result: ModeProgress) => void;
}

interface MatchPair {
  id: string;
  term: string;
  definition: string;
}

// 语音朗读组件
interface SpeechReaderProps {
  content: string;
  rate?: number;
  onProgress: (position: number) => void;
}
```

## Data Models

### Supabase 数据库表结构

```sql
-- 用户表 (由 Supabase Auth 管理)
-- auth.users

-- 学习内容表
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 复习卡片表
CREATE TABLE review_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_id UUID REFERENCES contents(id),
  card_type TEXT NOT NULL,
  card_data JSONB NOT NULL,
  ease_factor DECIMAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMPTZ,
  last_review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学习记录表
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_id UUID REFERENCES contents(id),
  mode TEXT NOT NULL,
  duration INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 用户设置表
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  theme TEXT DEFAULT 'light',
  speech_rate DECIMAL DEFAULT 1.0,
  daily_goal INTEGER DEFAULT 30,
  notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 本地存储结构 (IndexedDB)

```typescript
// 游客模式本地数据结构
interface LocalDatabase {
  contents: ParsedContent[];
  reviewCards: ReviewCard[];
  studySessions: StudySession[];
  settings: UserSettings;
  pendingSync: SyncItem[];  // 待同步队列
}

interface SyncItem {
  id: string;
  type: 'content' | 'card' | 'session';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: Date;
}
```

## SM-2 Algorithm Implementation

```typescript
/**
 * SM-2 算法实现
 * quality: 用户对记忆质量的评分 (0-5)
 * 0 - 完全忘记
 * 1 - 错误，但看到答案后想起
 * 2 - 错误，但答案感觉熟悉
 * 3 - 正确，但很困难
 * 4 - 正确，有些犹豫
 * 5 - 正确，非常轻松
 */
function calculateSM2(
  card: ReviewCard,
  quality: number
): ReviewSchedule {
  let { easeFactor, interval, repetitions } = card;
  
  if (quality >= 3) {
    // 正确回答
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // 错误回答，重置
    repetitions = 0;
    interval = 1;
  }
  
  // 更新难度系数
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);  // 最小值 1.3
  
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    nextReviewDate,
    newInterval: interval,
    newEaseFactor: easeFactor
  };
}
```

## DeepSeek API Integration

```typescript
interface DeepSeekRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// API 调用封装
async function callDeepSeek(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// 内容解析 Prompt
const PARSE_CONTENT_PROMPT = `
你是一个政治学习内容解析助手。请分析以下政治文本，提取：
1. 章节结构（标题和内容）
2. 关键词及其定义
3. 核心概念及其解释
4. 重要知识点

请以 JSON 格式返回结果。
`;

// 生成选择题 Prompt
const GENERATE_QUIZ_PROMPT = `
基于以下内容生成选择题：
1. 每题4个选项，只有1个正确答案
2. 提供详细的答案解析
3. 难度适中，考察理解而非死记硬背

请以 JSON 格式返回题目数组。
`;

// 生成记忆口诀 Prompt
const GENERATE_MNEMONIC_PROMPT = `
请为以下政治知识点创建记忆口诀：
1. 押韵且朗朗上口
2. 涵盖核心要点
3. 易于记忆和复述
`;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 内容解析完整性

*For any* 有效的政治文本输入，解析后的 ParsedContent 对象应包含非空的 chapters 数组、keywords 数组和 concepts 数组。

**Validates: Requirements 1.2, 1.3**

### Property 2: 学习材料生成完整性

*For any* 有效的 ParsedContent 对象，系统应能生成至少一个挖空填词项、一道选择题和一组术语配对。

**Validates: Requirements 1.4**

### Property 3: 答案验证正确性

*For any* 学习模式中的问题和用户答案，当用户答案与正确答案完全匹配时 isCorrect 应为 true，否则应为 false。

**Validates: Requirements 2.3, 3.2, 4.3**

### Property 4: 学习进度更新一致性

*For any* 答题结果，正确答案应导致掌握度增加或保持，错误答案应导致该项被标记为需要复习。

**Validates: Requirements 2.4, 2.5, 4.5**

### Property 5: 统计记录正确性

*For any* 完成的学习会话，Statistics_Tracker 记录的 correct_count 应等于该会话中正确答案的数量，total_count 应等于总题目数量。

**Validates: Requirements 2.6, 3.5**

### Property 6: 选择题结构正确性

*For any* 生成的选择题，options 数组长度应为 4，correctAnswer 应存在于 options 中，explanation 应为非空字符串。

**Validates: Requirements 3.1, 3.3**

### Property 7: SM-2 算法正确性

*For any* ReviewCard 和 quality 评分 (0-5)：
- 当 quality >= 3 时，interval 应增加（首次为1，第二次为6，之后乘以 easeFactor）
- 当 quality < 3 时，interval 应重置为 1，repetitions 应重置为 0
- easeFactor 应始终 >= 1.3

**Validates: Requirements 7.1, 7.4, 7.5**

### Property 8: 待复习卡片提醒

*For any* 用户，当存在 nextReviewDate <= 当前时间 的 ReviewCard 时，getDueCards 应返回非空数组。

**Validates: Requirements 7.2**

### Property 9: 游客模式本地存储

*For any* 游客用户的学习数据，数据应存储在 IndexedDB 中，且重新加载页面后数据应保持不变。

**Validates: Requirements 8.4**

### Property 10: 数据迁移一致性

*For any* 游客用户转为注册用户时，本地存储的所有 contents、reviewCards 和 studySessions 应完整迁移到云端，迁移后本地数据与云端数据应一致。

**Validates: Requirements 8.5**

### Property 11: 离线数据持久化与同步

*For any* 离线状态下完成的学习活动，数据应保存到 pendingSync 队列，网络恢复后应自动同步到云端。

**Validates: Requirements 9.3, 12.3**

### Property 12: 数据冲突解决

*For any* 数据冲突场景，系统应保留 timestamp 较新的数据版本。

**Validates: Requirements 9.4**

### Property 13: 统计计算正确性

*For any* 用户的学习记录集合：
- totalStudyTime 应等于所有 studySessions 的 duration 之和
- 正确率应等于 sum(correct_count) / sum(total_count)
- 章节掌握度应基于该章节相关卡片的平均 easeFactor 计算

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 14: 主题切换幂等性

*For any* 初始主题状态，连续切换主题两次应回到原始状态。

**Validates: Requirements 13.1**

### Property 15: 主题设置持久化

*For any* 主题切换操作，刷新页面后主题应保持为切换后的状态。

**Validates: Requirements 13.3**

## Error Handling

### API 错误处理

```typescript
// DeepSeek API 错误处理
class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'RATE_LIMIT',
    public retryable: boolean
  ) {
    super(message);
  }
}

async function callDeepSeekWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callDeepSeek(prompt);
    } catch (error) {
      if (i === maxRetries - 1 || !isRetryable(error)) {
        throw error;
      }
      await delay(Math.pow(2, i) * 1000); // 指数退避
    }
  }
  throw new AIServiceError('Max retries exceeded', 'API_ERROR', false);
}
```

### 离线错误处理

```typescript
// 网络状态监听
window.addEventListener('online', () => {
  syncPendingData();
});

window.addEventListener('offline', () => {
  showOfflineNotification();
});

// 同步失败处理
async function syncWithRetry(data: SyncItem[]): Promise<void> {
  const failed: SyncItem[] = [];
  
  for (const item of data) {
    try {
      await syncItem(item);
    } catch (error) {
      failed.push(item);
    }
  }
  
  if (failed.length > 0) {
    // 保留失败项待下次同步
    await savePendingSync(failed);
  }
}
```

### 用户输入验证

```typescript
// 内容输入验证
function validateContentInput(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: '请输入学习内容' };
  }
  
  if (text.length > 50000) {
    return { valid: false, error: '内容过长，请分批输入' };
  }
  
  return { valid: true };
}
```

## Testing Strategy

### 测试框架

- **单元测试**: Vitest
- **属性测试**: fast-check
- **组件测试**: React Testing Library
- **E2E 测试**: Playwright

### 单元测试

单元测试用于验证具体示例和边界情况：

```typescript
// SM-2 算法单元测试示例
describe('SM2 Scheduler', () => {
  it('should set interval to 1 for first correct answer', () => {
    const card = createNewCard();
    const result = calculateSM2(card, 4);
    expect(result.newInterval).toBe(1);
  });
  
  it('should reset interval when quality < 3', () => {
    const card = { ...createNewCard(), interval: 10, repetitions: 5 };
    const result = calculateSM2(card, 2);
    expect(result.newInterval).toBe(1);
  });
  
  it('should never let easeFactor go below 1.3', () => {
    const card = { ...createNewCard(), easeFactor: 1.4 };
    const result = calculateSM2(card, 0);
    expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3);
  });
});
```

### 属性测试

属性测试用于验证普遍性质，每个属性测试至少运行 100 次迭代：

```typescript
import { fc } from 'fast-check';

// Feature: politics-study-system, Property 7: SM-2 算法正确性
describe('SM2 Algorithm Properties', () => {
  it('should always keep easeFactor >= 1.3', () => {
    fc.assert(
      fc.property(
        fc.record({
          easeFactor: fc.float({ min: 1.3, max: 5.0 }),
          interval: fc.integer({ min: 0, max: 365 }),
          repetitions: fc.integer({ min: 0, max: 100 })
        }),
        fc.integer({ min: 0, max: 5 }),
        (card, quality) => {
          const result = calculateSM2(card as ReviewCard, quality);
          return result.newEaseFactor >= 1.3;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should reset interval when quality < 3', () => {
    fc.assert(
      fc.property(
        fc.record({
          easeFactor: fc.float({ min: 1.3, max: 5.0 }),
          interval: fc.integer({ min: 1, max: 365 }),
          repetitions: fc.integer({ min: 1, max: 100 })
        }),
        fc.integer({ min: 0, max: 2 }),
        (card, quality) => {
          const result = calculateSM2(card as ReviewCard, quality);
          return result.newInterval === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: politics-study-system, Property 14: 主题切换幂等性
describe('Theme Toggle Properties', () => {
  it('should return to original state after two toggles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (initialTheme) => {
          setTheme(initialTheme);
          toggleTheme();
          toggleTheme();
          return getTheme() === initialTheme;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: politics-study-system, Property 5: 统计记录正确性
describe('Statistics Tracker Properties', () => {
  it('should correctly calculate totals', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            correct_count: fc.integer({ min: 0, max: 100 }),
            total_count: fc.integer({ min: 1, max: 100 })
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (sessions) => {
          const stats = calculateStatistics(sessions);
          const expectedCorrect = sessions.reduce((sum, s) => sum + s.correct_count, 0);
          const expectedTotal = sessions.reduce((sum, s) => sum + s.total_count, 0);
          return stats.totalCorrect === expectedCorrect && 
                 stats.totalQuestions === expectedTotal;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 测试覆盖要求

- 核心业务逻辑（SM-2 算法、统计计算）: 100% 覆盖
- 服务层: 80% 覆盖
- UI 组件: 关键交互路径覆盖
