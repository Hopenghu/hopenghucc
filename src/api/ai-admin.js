/**
 * AI 管理後台 API
 */
import { QuestionAnalysisService } from '../services/QuestionAnalysisService.js';
import { withCache, CACHE_TTL } from '../utils/cacheHelper.js';

export async function handleAIAdminRequest(request, env, user) {
  // 檢查是否為管理員
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // 統計資料 - 使用緩存（5分鐘）
    if (path === '/api/ai/admin/statistics' && request.method === 'GET') {
      const cachedHandler = withCache(handleStatistics, {
        cacheKey: 'ai-admin',
        ttl: CACHE_TTL.MEDIUM, // 5 分鐘
        keyGenerator: () => 'statistics'
      });
      return await cachedHandler(request, env);
    }

    // 對話記錄
    if (path === '/api/ai/admin/conversations' && request.method === 'GET') {
      return await handleConversations(request, env);
    }

    // 知識庫
    if (path === '/api/ai/admin/knowledge' && request.method === 'GET') {
      return await handleGetKnowledge(request, env);
    }
    if (path === '/api/ai/admin/knowledge' && request.method === 'POST') {
      return await handleAddKnowledge(request, env);
    }
    if (path.startsWith('/api/ai/admin/knowledge/') && request.method === 'DELETE') {
      return await handleDeleteKnowledge(request, env);
    }

    // 反饋
    if (path === '/api/ai/admin/feedback' && request.method === 'GET') {
      return await handleFeedback(request, env);
    }

    // 分析
    if (path === '/api/ai/admin/analytics' && request.method === 'GET') {
      return await handleAnalytics(request, env);
    }

    // 問題學習記錄
    if (path === '/api/ai/admin/question-learning' && request.method === 'GET') {
      return await handleQuestionLearning(request, env);
    }

    // 問題模板
    if (path === '/api/ai/admin/question-templates' && request.method === 'GET') {
      return await handleQuestionTemplates(request, env);
    }
    if (path === '/api/ai/admin/question-templates/extract' && request.method === 'POST') {
      return await handleExtractTemplates(request, env);
    }

    // 問題改進記錄
    if (path === '/api/ai/admin/question-improvements' && request.method === 'GET') {
      return await handleQuestionImprovements(request, env);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin API] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 統計資料
async function handleStatistics(request, env) {
  try {
    // 總對話數
    const totalResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM ai_conversations WHERE message_type = ?'
    ).bind('user').first();
    const totalConversations = totalResult?.count || 0;

    // 今日對話數
    const todayResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM ai_conversations 
       WHERE message_type = ? AND DATE(created_at) = DATE('now')`
    ).bind('user').first();
    const todayConversations = todayResult?.count || 0;

    // 知識庫項目數
    const kbResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM ai_knowledge_base'
    ).first();
    const knowledgeBaseCount = kbResult?.count || 0;

    // 反饋數
    const feedbackResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM ai_feedback'
    ).first();
    const feedbackCount = feedbackResult?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      totalConversations,
      todayConversations,
      knowledgeBaseCount,
      feedbackCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting statistics:', error);
    throw error;
  }
}

// 對話記錄
async function handleConversations(request, env) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const search = url.searchParams.get('search') || '';
    const filter = url.searchParams.get('filter') || '';

    let query = 'SELECT * FROM ai_conversations WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND message_content LIKE ?';
      params.push(`%${search}%`);
    }

    if (filter === 'logged-in') {
      query += ' AND user_id IS NOT NULL';
    } else if (filter === 'anonymous') {
      query += ' AND user_id IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const result = await env.DB.prepare(query).bind(...params).all();

    // 總數
    let countQuery = 'SELECT COUNT(*) as count FROM ai_conversations WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND message_content LIKE ?';
      countParams.push(`%${search}%`);
    }
    if (filter === 'logged-in') {
      countQuery += ' AND user_id IS NOT NULL';
    } else if (filter === 'anonymous') {
      countQuery += ' AND user_id IS NULL';
    }
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      conversations: result.results || [],
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting conversations:', error);
    throw error;
  }
}

// 知識庫
async function handleGetKnowledge(request, env) {
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM ai_knowledge_base ORDER BY usage_count DESC, created_at DESC'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      knowledge: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting knowledge:', error);
    throw error;
  }
}

async function handleAddKnowledge(request, env) {
  try {
    const body = await request.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'Question and answer are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(
      `INSERT INTO ai_knowledge_base (question, answer, source_type, source_user_id)
       VALUES (?, ?, 'admin', NULL)`
    ).bind(question, answer).run();

    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error adding knowledge:', error);
    throw error;
  }
}

async function handleDeleteKnowledge(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    await env.DB.prepare(
      'DELETE FROM ai_knowledge_base WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error deleting knowledge:', error);
    throw error;
  }
}

// 反饋
async function handleFeedback(request, env) {
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM ai_feedback ORDER BY created_at DESC LIMIT 100'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      feedback: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting feedback:', error);
    throw error;
  }
}

// 分析
async function handleAnalytics(request, env) {
  try {
    // 熱門問題（簡化版，實際可以更複雜）
    const popularQuestions = await env.DB.prepare(
      `SELECT message_content as question, COUNT(*) as count
       FROM ai_conversations
       WHERE message_type = 'user'
       GROUP BY message_content
       ORDER BY count DESC
       LIMIT 10`
    ).all();

    return new Response(JSON.stringify({
      success: true,
      popularQuestions: popularQuestions.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting analytics:', error);
    throw error;
  }
}

// 問題學習記錄
async function handleQuestionLearning(request, env) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const category = url.searchParams.get('category') || '';
    const questionType = url.searchParams.get('questionType') || '';

    let query = 'SELECT * FROM ai_question_learning WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND question_category = ?';
      params.push(category);
    }

    if (questionType) {
      query += ' AND question_type = ?';
      params.push(questionType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const result = await env.DB.prepare(query).bind(...params).all();

    // 總數
    let countQuery = 'SELECT COUNT(*) as count FROM ai_question_learning WHERE 1=1';
    const countParams = [];
    if (category) {
      countQuery += ' AND question_category = ?';
      countParams.push(category);
    }
    if (questionType) {
      countQuery += ' AND question_type = ?';
      countParams.push(questionType);
    }
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      learning: result.results || [],
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting question learning:', error);
    throw error;
  }
}

// 問題模板
async function handleQuestionTemplates(request, env) {
  try {
    const url = new URL(request.url);
    const templateType = url.searchParams.get('templateType') || '';
    const contextType = url.searchParams.get('contextType') || '';

    let query = 'SELECT * FROM ai_question_templates WHERE is_active = true';
    const params = [];

    if (templateType) {
      query += ' AND template_type = ?';
      params.push(templateType);
    }

    if (contextType) {
      query += ' AND (context_type = ? OR context_type IS NULL)';
      params.push(contextType);
    }

    query += ' ORDER BY success_rate DESC, usage_count DESC';

    const result = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      success: true,
      templates: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting question templates:', error);
    throw error;
  }
}

// 提取問題模板
async function handleExtractTemplates(request, env) {
  try {
    const body = await request.json();
    const minSuccessRate = parseFloat(body.minSuccessRate || '0.7');
    const minQualityScore = parseFloat(body.minQualityScore || '0.7');

    const questionAnalysisService = new QuestionAnalysisService(env.DB);
    const templates = await questionAnalysisService.extractQuestionTemplates(minSuccessRate, minQualityScore);

    return new Response(JSON.stringify({
      success: true,
      templates: templates,
      count: templates.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error extracting templates:', error);
    throw error;
  }
}

// 問題改進記錄
async function handleQuestionImprovements(request, env) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const result = await env.DB.prepare(
      `SELECT * FROM ai_question_improvements 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(pageSize, (page - 1) * pageSize).all();

    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM ai_question_improvements'
    ).first();
    const total = countResult?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      improvements: result.results || [],
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI Admin] Error getting question improvements:', error);
    throw error;
  }
}
