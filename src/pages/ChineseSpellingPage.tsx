/**
 * 中文拼写练习页面
 * 功能：看英文拼写中文，支持Alt键提示，空格键跳转
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { useToast } from '../components/ui';
import type { ChineseSpellingItem, ChineseSpellingGameState, FavoriteItem } from '../types';
import { 
  initializeChineseSpellingGame, 
  parseChineseSpellingText, 
  checkChineseSpellingAnswer,
  nextChineseSpellingItem,
  generateChineseSpellingHint,
  generateChineseSpellingSessionResult
} from '../services/learning/chineseSpelling';

const CHINESE_SPELLING_DATA_KEY = 'chinese_spelling_data';
const CHINESE_SPELLING_FAVORITES_KEY = 'chinese_spelling_favorites';

export default function ChineseSpellingPage() {
  const toast = useToast();
  
  // 数据管理
  const [items, setItems] = useState<ChineseSpellingItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHINESE_SPELLING_DATA_KEY) || '[]');
    } catch {
      return [];
    }
  });
  
  // 导入相关
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  
  // 游戏状态
  const [gameState, setGameState] = useState<ChineseSpellingGameState | null>(null);
  const [remainingItems, setRemainingItems] = useState<ChineseSpellingItem[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [mode, setMode] = useState<'practice' | 'challenge'>('practice');
  const [maxHealth, setMaxHealth] = useState(5);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [shuffleMode, setShuffleMode] = useState<'shuffle' | 'sequential'>('shuffle');
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHINESE_SPELLING_FAVORITES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [showReviewMode, setShowReviewMode] = useState(false);

  // 输入框引用，用于自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem(CHINESE_SPELLING_DATA_KEY, JSON.stringify(items));
  }, [items]);

  // 保存收藏夹到localStorage
  useEffect(() => {
    localStorage.setItem(CHINESE_SPELLING_FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // 导入数据
  const handleImport = () => {
    try {
      const parsedItems = parseChineseSpellingText(importText);
      if (parsedItems.length === 0) {
        toast.error('未找到有效的数据，请检查格式');
        return;
      }
      
      setItems([...items, ...parsedItems]);
      setImportText('');
      setShowImport(false);
      toast.success(`成功导入 ${parsedItems.length} 个词汇`);
    } catch (error) {
      toast.error('导入失败，请检查格式：' + (error as Error).message);
    }
  };

  // 开始练习
  const startPractice = (practiceMode: 'practice' | 'challenge' = 'practice') => {
    if (items.length === 0) {
      toast.error('请先导入词汇数据');
      return;
    }
    
    setMode(practiceMode);
    const itemsToUse = shuffleMode === 'shuffle'
      ? [...items].sort(() => Math.random() - 0.5)
      : [...items];
    setRemainingItems(itemsToUse);
    
    const newGameState = initializeChineseSpellingGame(itemsToUse, practiceMode, maxHealth);
    setGameState(newGameState);
    setUserAnswer('');
    setShowHint(false);
    setHintLevel(0);
    setShowResult(false);
    setSessionResult(null);
  };

  // 检查答案
  const checkAnswer = useCallback(() => {
    if (!gameState || !gameState.currentItem || showResult) return;
    
    const newGameState = checkChineseSpellingAnswer(gameState, userAnswer);
    setGameState(newGameState);
    setShowResult(true);
    
    if (newGameState.isCorrect) {
      toast.success('正确！');
    } else {
      toast.error('错误');
    }
  }, [gameState, userAnswer, showResult, toast]);

  // 重新尝试当前题目
  const retryQuestion = useCallback(() => {
    if (!gameState || !gameState.currentItem) return;
    
    // 清空答案，重置状态，但不计为新题目
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
    setHintLevel(0);
    
    // 聚焦到输入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [gameState]);

  // 下一题
  const nextQuestion = useCallback(() => {
    if (!gameState) return;
    
    const result = nextChineseSpellingItem(gameState, remainingItems);
    
    if (result.isCompleted) {
      // 会话结束
      const sessionResultData = generateChineseSpellingSessionResult(
        gameState,
        items.length - result.remainingItems.length,
        'general'
      );
      setSessionResult(sessionResultData);
      setGameState(null);
    } else {
      setGameState(result.gameState);
      setRemainingItems(result.remainingItems);
      setUserAnswer('');
      setShowHint(false);
      setHintLevel(0);
      setShowResult(false);
    }
  }, [gameState, remainingItems, items.length]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState || sessionResult) return;

      // Alt键提示
      if (e.altKey && !showHint && !showResult) {
        setShowHint(true);
        setHintLevel(1);
      }

      // 空格键：答对后下一题，答错后再来一次
      if (e.code === 'Space' && showResult) {
        e.preventDefault();
        if (gameState.isCorrect) {
          nextQuestion();
        } else {
          retryQuestion();
        }
      }

      // 回车键检查答案
      if (e.code === 'Enter' && !showResult) {
        e.preventDefault();
        checkAnswer();
      }

      // Ctrl键收藏当前单词
      if (e.ctrlKey && gameState && gameState.currentItem) {
        e.preventDefault();
        toggleFavorite(gameState.currentItem);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) {
        setShowHint(false);
        setHintLevel(0);
        // Alt键释放后，自动聚焦到输入框（使用setTimeout确保状态更新后聚焦）
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, showHint, showResult, sessionResult, nextQuestion, checkAnswer]);

  // 删除词汇
  const deleteItem = (id: string) => {
    if (!confirm('确定删除这个词汇吗？')) return;
    setItems(items.filter(item => item.id !== id));
  };

  // 清空所有数据
  const clearAllData = () => {
    if (!confirm('确定清空所有数据吗？')) return;
    setItems([]);
    toast.success('数据已清空');
  };

  // 切换收藏状态
  const toggleFavorite = (item: ChineseSpellingItem) => {
    const exists = favorites.some(fav => fav.id === item.id);
    if (exists) {
      setFavorites(favorites.filter(fav => fav.id !== item.id));
      toast.success('已取消收藏');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const favoriteItem: FavoriteItem = { 
        ...item, 
        favoriteDate: today 
      };
      setFavorites([...favorites, favoriteItem]);
      toast.success('已添加到收藏夹');
    }
  };

  // 从收藏夹删除
  const deleteFavorite = (id: string) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
    toast.success('已从收藏夹移除');
  };

  // 清空收藏夹
  const clearFavorites = () => {
    if (!confirm('确定清空收藏夹吗？')) return;
    setFavorites([]);
    toast.success('收藏夹已清空');
  };

  // 开始复习
  const startReview = (date: string) => {
    const itemsToReview = favorites.filter(fav => fav.favoriteDate === date);
    if (itemsToReview.length === 0) {
      toast.error('该日期没有收藏的单词');
      return;
    }

    const itemsToUse = shuffleMode === 'shuffle'
      ? [...itemsToReview].sort(() => Math.random() - 0.5)
      : [...itemsToReview];

    setMode('practice');
    setRemainingItems(itemsToReview);
    const newGameState = initializeChineseSpellingGame(itemsToUse, 'practice', 5);
    setGameState(newGameState);
    setUserAnswer('');
    setShowHint(false);
    setHintLevel(0);
    setShowResult(false);
    setSessionResult(null);
    setShowReviewMode(false);
  };

  // 渲染导入界面
  if (showImport) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">导入词汇</h1>
            <p className="text-gray-600">格式：英文,中文（一行一个）</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                粘贴词汇数据
              </label>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="apple,苹果&#10;computer,电脑&#10;whale listen,鲸听"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                导入数据
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 渲染会话结果
  if (sessionResult) {
    return (
      <div className="min-h-screen bg-[rgb(198,238,206)] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">练习完成！</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <div className="text-2xl font-bold text-indigo-600">{sessionResult.totalItems}</div>
                <div className="text-sm text-gray-600">总题数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{sessionResult.correctAnswers}</div>
                <div className="text-sm text-gray-600">正确数</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{sessionResult.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">正确率</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">
                  {(sessionResult.totalTime / 1000).toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">总用时</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSessionResult(null)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                返回
              </button>
              <button
                onClick={() => startPractice(mode)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                再练一次
              </button>
            </div>
          </div>
        </div>
      );
  }

  // 渲染游戏界面
  if (gameState && gameState.currentItem) {
    return (
      <div className="min-h-screen bg-[rgb(198,238,206)] flex flex-col items-center pt-0 pb-8 px-4">
        <div className="w-full max-w-4xl">
          <div className="mb-4 text-center">
            <button
              onClick={() => setGameState(null)}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>
            
            {/* 状态栏 - 隐藏
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                进度: {items.length - remainingItems.length}/{items.length}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  得分: <span className="font-bold text-green-600">{gameState.score}</span>
                </div>
                {mode === 'challenge' && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">血量:</span>
                    <div className="flex space-x-1">
                      {[...Array(maxHealth)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full ${
                            i < (gameState.health || 0) ? 'bg-rose-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            */}
          </div>

          <div className="bg-white/90 backdrop-blur rounded-3xl p-14 shadow-2xl border border-emerald-100 relative">
            {/* 收藏状态指示器 - 右上角 */}
            <div className="absolute top-4 right-4 z-10">
              {gameState.currentItem && favorites.some(fav => fav.id === gameState.currentItem.id) ? (
                <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ) : (
                <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              )}
            </div>

            {/* 题目 */}
            <div className="text-center mb-12">
              <h2 className="text-7xl font-bold text-emerald-700 mb-6 tracking-wide">
                {gameState.currentItem.english}
              </h2>
              <p className="text-emerald-500 text-2xl">请输入中文释义</p>
            </div>

            {/* 提示 */}
            {showHint && (
              <div className="bg-amber-50 rounded-2xl p-5 mb-8 border border-amber-200 shadow-sm">
                <div className="text-amber-800 text-xl font-medium flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  提示: {generateChineseSpellingHint(gameState, hintLevel)}
                </div>
              </div>
            )}

            {/* 输入框 */}
            <div className="mb-10">
              <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                disabled={showResult}
                ref={inputRef}
                onKeyPress={e => e.key === 'Enter' && !showResult && checkAnswer()}
                className="w-full px-8 py-6 text-3xl text-white border-2 border-emerald-400 rounded-2xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-400 bg-slate-800 shadow-lg transition-all placeholder:text-slate-400"
                placeholder="输入中文答案..."
                autoFocus
              />
            </div>

            {/* 结果显示 */}
            {showResult && (
              <div className={`rounded-2xl p-6 mb-8 shadow-md ${
                gameState.isCorrect 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-rose-50 border border-rose-200'
              }`}>
                <div className={`font-bold text-xl mb-3 flex items-center ${
                  gameState.isCorrect ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  {gameState.isCorrect ? (
                    <><svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 正确！</>
                  ) : (
                    <><svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> 错误</>
                  )}
                </div>
                {!gameState.isCorrect && (
                  <>
                    <div className="text-rose-700 text-lg font-medium">
                      正确答案: <span className="text-xl font-bold">{gameState.currentItem.chinese}</span>
                    </div>
                    <div className="text-rose-600 text-base mt-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      按空格键再来一次
                    </div>
                  </>
                )}
                {gameState.isCorrect && (
                  <div className="text-emerald-700 text-base mt-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    按空格键进入下一题
                  </div>
                )}
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-5">
              {!showResult ? (
                <button
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim()}
                  className="flex-1 px-8 py-5 text-xl bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none font-medium"
                >
                  检查答案
                </button>
              ) : gameState.isCorrect ? (
                <button
                  onClick={nextQuestion}
                  className="flex-1 px-8 py-5 text-xl bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  下一题
                </button>
              ) : (
                <button
                  onClick={retryQuestion}
                  className="flex-1 px-8 py-5 text-xl bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  再来一次
                </button>
              )}
              <button
                onClick={() => {
                  setShowHint(true);
                  setHintLevel(prev => prev + 1);
                }}
                disabled={showHint || hintLevel >= 3}
                className="px-8 py-5 text-xl bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-medium whitespace-nowrap"
              >
                提示 (Alt)
              </button>
            </div>

            {/* 操作说明 */}
            <div className="mt-10 text-base text-emerald-600/70 text-center">
              <div className="inline-flex items-center gap-4 bg-white/60 backdrop-blur px-5 py-3 rounded-full shadow-sm">
                <span className="bg-emerald-100 px-3 py-1.5 rounded-lg font-medium text-emerald-700">Alt</span>
                <span>显示提示</span>
                <span className="text-emerald-400">|</span>
                <span className="bg-emerald-100 px-3 py-1.5 rounded-lg font-medium text-emerald-700">空格</span>
                <span>下一题 / 再来一次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 渲染主界面
  return (
    <div className="min-h-screen bg-[rgb(198,238,206)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-emerald-700 hover:text-emerald-800 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
          <h1 className="text-4xl font-bold text-emerald-800 mb-2">中文拼写练习</h1>
          <p className="text-emerald-600 text-lg">看英文拼写中文，支持 Alt 键提示</p>
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{items.length}</div>
              <div className="text-sm text-gray-500 mt-1">词汇总数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">
                {items.reduce((sum, item) => sum + item.chinese.length, 0)}
              </div>
              <div className="text-sm text-gray-500 mt-1">汉字总数</div>
            </div>
          </div>
        </div>

        {/* 练习模式选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => startPractice('practice')}
            disabled={items.length === 0}
            className="bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="ml-4 text-lg font-bold text-gray-800">练习模式</h2>
            </div>
            <p className="text-gray-600 mb-4">无限错误次数，适合初学者</p>
            <div className="flex items-center text-emerald-600 text-sm font-medium">
              <span>推荐</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => startPractice('challenge')}
            disabled={items.length === 0}
            className="bg-gradient-to-br from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-600 text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="ml-4 text-lg font-bold text-gray-800">挑战模式</h2>
            </div>
            <p className="text-gray-600 mb-4">血量系统，错一题扣一格</p>
            <div className="flex items-center text-rose-600 text-sm font-medium">
              <span>高难度</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* 挑战模式设置 */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100 mb-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            挑战模式设置
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-600">初始血量:</label>
            <select
              value={maxHealth}
              onChange={e => setMaxHealth(Number(e.target.value))}
              className="px-3 py-2 border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {[1, 2, 3, 5, 10].map(hp => (
                <option key={hp} value={hp}>{hp} 格</option>
              ))}
            </select>
          </div>
        </div>

        {/* 顺序设置 */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100 mb-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            顺序设置
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setShuffleMode('shuffle')}
              className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium ${
                shuffleMode === 'shuffle'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              🔀 乱序
            </button>
            <button
              onClick={() => setShuffleMode('sequential')}
              className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium ${
                shuffleMode === 'sequential'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              📋 顺序
            </button>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100 mb-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            数据管理
          </h3>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowImport(true)}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
            >
              导入词汇
            </button>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md"
            >
              清空数据
            </button>
          </div>

          {/* 词汇列表 */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无词汇，请先导入数据
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div>
                      <div className="font-medium text-emerald-900">{item.english}</div>
                      <div className="text-sm text-emerald-600">{item.chinese}</div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 收藏夹 */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-emerald-100 mb-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              收藏夹
              <span className="ml-2 text-sm font-normal text-emerald-600">({favorites.length})</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => favorites.length > 0 && setShowReviewMode(true)}
                disabled={favorites.length === 0}
                className={`text-sm ${favorites.length > 0 ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 cursor-not-allowed'}`}
              >
                复习
              </button>
              {favorites.length > 0 && (
                <button
                  onClick={clearFavorites}
                  className="text-sm text-rose-600 hover:text-rose-700"
                >
                  清空
                </button>
              )}
            </div>
          </h3>
          <div className="max-h-96 overflow-y-auto">
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无收藏，按 Ctrl 键收藏单词
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  // 按日期分组
                  const grouped = favorites.reduce((acc, item) => {
                    const date = item.favoriteDate || '未分类';
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(item);
                    return acc;
                  }, {} as Record<string, FavoriteItem[]>);
                  
                  // 按日期降序排序
                  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
                  
                  return sortedDates.map(date => (
                    <div key={date} className="bg-pink-50/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-pink-800">{date}</span>
                        <span className="text-xs text-pink-600">({grouped[date].length})</span>
                      </div>
                      <div className="space-y-2">
                        {grouped[date].map(item => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-white/50 rounded-lg border border-pink-100 hover:bg-white transition-colors">
                            <div>
                              <div className="font-medium text-pink-900">{item.english}</div>
                              <div className="text-sm text-pink-600">{item.chinese}</div>
                            </div>
                            <button
                              onClick={() => deleteFavorite(item.id)}
                              className="px-2 py-1 bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors text-xs"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 复习模式选择弹窗 */}
        {showReviewMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                选择复习日期
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                {(() => {
                  const grouped = favorites.reduce((acc, item) => {
                    const date = item.favoriteDate || '未分类';
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(item);
                    return acc;
                  }, {} as Record<string, FavoriteItem[]>);
                  
                  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
                  
                  return sortedDates.map(date => (
                    <button
                      key={date}
                      onClick={() => startReview(date)}
                      className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all text-left border border-emerald-200 hover:border-emerald-300"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-emerald-800">{date}</div>
                          <div className="text-sm text-emerald-600">{grouped[date].length} 个单词</div>
                        </div>
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ));
                })()}
              </div>
              <button
                onClick={() => setShowReviewMode(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-emerald-50/80 backdrop-blur rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            使用说明
          </h3>
          <ul className="space-y-2 text-emerald-700">
            <li>• 导入格式：英文,中文（一行一个）</li>
            <li>• 按住 Alt 键显示提示（首字→拼音→完整答案）</li>
            <li>• 答对后按空格键进入下一题，答错后按空格键再来一次</li>
            <li>• 按 Ctrl 键收藏当前单词</li>
            <li>• 练习模式：无限错误次数</li>
            <li>• 挑战模式：血量系统，错一题扣一格</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
