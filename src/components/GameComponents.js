/**
 * 澎湖時光島主遊戲組件
 * 實現遊戲化UI元素
 */

import React, { useState, useEffect } from 'react';

// 記憶膠囊組件
export function MemoryCapsule({ capsule, onReply, showReplies = true }) {
    const [replies, setReplies] = useState([]);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        if (showReplies && capsule.replies) {
            setReplies(capsule.replies);
        }
    }, [capsule.replies, showReplies]);

    const handleReply = async () => {
        if (!replyContent.trim()) return;

        try {
            const response = await fetch(`/api/game/memory-capsules/${capsule.id}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reply_content: replyContent,
                    reply_type: 'greeting'
                })
            });

            if (response.ok) {
                const result = await response.json();
                setReplies([...replies, result.reply]);
                setReplyContent('');
                setShowReplyForm(false);
                if (onReply) onReply(result.reply);
            }
        } catch (error) {
            console.error('回覆失敗:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 border-blue-500">
            {/* 膠囊頭部 */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                            {capsule.user_name?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{capsule.title}</h3>
                        <p className="text-sm text-gray-500">
                            {capsule.user_name} • {new Date(capsule.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        capsule.user_game_role === 'visitor' ? 'bg-green-100 text-green-800' :
                        capsule.user_game_role === 'merchant' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                    }`}>
                        {capsule.user_game_role === 'visitor' ? '遊客' :
                         capsule.user_game_role === 'merchant' ? '店家' : '在地人'}
                    </span>
                </div>
            </div>

            {/* 膠囊內容 */}
            <div className="mb-4">
                <p className="text-gray-700 mb-3">{capsule.content}</p>
                {capsule.photo_url && (
                    <img 
                        src={capsule.photo_url} 
                        alt={capsule.title}
                        className="w-full h-48 object-cover rounded-lg"
                    />
                )}
            </div>

            {/* 地點信息 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📍</span>
                    <div>
                        <p className="font-medium text-gray-900">{capsule.location_name}</p>
                        <p className="text-sm text-gray-600">{capsule.address}</p>
                    </div>
                </div>
            </div>

            {/* 回覆區域 */}
            {showReplies && (
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">回覆 ({replies.length})</h4>
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            {showReplyForm ? '取消回覆' : '回覆'}
                        </button>
                    </div>

                    {/* 回覆表單 */}
                    {showReplyForm && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="分享你的故事或歡迎這位朋友..."
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                            />
                            <div className="flex justify-end space-x-2 mt-3">
                                <button
                                    onClick={() => setShowReplyForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleReply}
                                    disabled={!replyContent.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    回覆
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 回覆列表 */}
                    <div className="space-y-3">
                        {replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-xs font-bold">
                                            {reply.merchant_name?.charAt(0) || 'M'}
                                        </span>
                                    </div>
                                    <span className="font-medium text-sm text-gray-900">
                                        {reply.merchant_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(reply.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm">{reply.reply_content}</p>
                                {reply.special_offer && (
                                    <div className="mt-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-400">
                                        <p className="text-sm text-yellow-800">
                                            <span className="font-medium">特別優惠：</span>
                                            {reply.special_offer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// 用戶遊戲統計組件
export function UserGameStats({ userId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserStats();
    }, [userId]);

    const fetchUserStats = async () => {
        try {
            const response = await fetch(`/api/game/users/${userId}/stats`);
            if (response.ok) {
                const result = await response.json();
                setStats(result.stats);
            }
        } catch (error) {
            console.error('獲取用戶統計失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500">無法載入遊戲統計</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">遊戲統計</h3>
            
            {/* 基本統計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.game_level}</div>
                    <div className="text-sm text-gray-500">等級</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.game_points}</div>
                    <div className="text-sm text-gray-500">點數</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.memory_count}</div>
                    <div className="text-sm text-gray-500">記憶膠囊</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.visit_count}</div>
                    <div className="text-sm text-gray-500">訪問次數</div>
                </div>
            </div>

            {/* 角色信息 */}
            <div className="mb-4">
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                        stats.game_role === 'visitor' ? 'bg-green-100 text-green-800' :
                        stats.game_role === 'merchant' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                    }`}>
                        {stats.game_role === 'visitor' ? '遊客' :
                         stats.game_role === 'merchant' ? '店家' : '在地人'}
                    </span>
                </div>
            </div>

            {/* 勳章展示 */}
            {stats.badges && stats.badges.length > 0 && (
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">獲得的勳章</h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.badges.map((badge) => (
                            <div key={badge.id} className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                <span className="text-yellow-600">🏆</span>
                                <span className="text-sm font-medium text-yellow-800">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// 遊戲排行榜組件
export function GameLeaderboard({ type = 'points' }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [type]);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`/api/game/leaderboard?type=${type}&limit=10`);
            if (response.ok) {
                const result = await response.json();
                setLeaderboard(result.leaderboard);
            }
        } catch (error) {
            console.error('獲取排行榜失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">排行榜</h3>
            
            <div className="space-y-3">
                {leaderboard.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0">
                            {index < 3 ? (
                                <span className="text-2xl">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                            ) : (
                                <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                    {index + 1}
                                </span>
                            )}
                        </div>
                        
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                                {user.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">
                                {type === 'level' ? `等級 ${user.game_level}` :
                                 type === 'memories' ? `${user.memory_count} 個記憶` :
                                 `${user.game_points} 點數`}
                            </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                                user.game_role === 'visitor' ? 'bg-green-100 text-green-800' :
                                user.game_role === 'merchant' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                            }`}>
                                {user.game_role === 'visitor' ? '遊客' :
                                 user.game_role === 'merchant' ? '店家' : '在地人'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 任務列表組件
export function TaskList({ userId }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, [userId]);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`/api/game/users/${userId}/tasks`);
            if (response.ok) {
                const result = await response.json();
                setTasks(result.tasks);
            }
        } catch (error) {
            console.error('獲取任務列表失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">任務列表</h3>
            
            <div className="space-y-3">
                {tasks.map((task) => (
                    <div key={task.id} className={`p-4 rounded-lg border ${
                        task.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                                    {task.is_completed && (
                                        <span className="text-green-600">✓</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>獎勵: {task.points_reward} 點數</span>
                                    {task.badge_reward && (
                                        <span>🏆 勳章</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-shrink-0 ml-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    task.target_role === 'visitor' ? 'bg-green-100 text-green-800' :
                                    task.target_role === 'merchant' ? 'bg-blue-100 text-blue-800' :
                                    task.target_role === 'local' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {task.target_role === 'visitor' ? '遊客' :
                                     task.target_role === 'merchant' ? '店家' :
                                     task.target_role === 'local' ? '在地人' : '全部'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
