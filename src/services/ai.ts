// AI Service - 统一的 AI 调用层
// 支持 OpenAI 兼容 API（可切换为本地模型或其他 provider）

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'https://api.openai.com/v1'
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || ''
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'gpt-4o'

interface AICallOptions {
  systemPrompt: string
  userMessage: string
  imageBase64?: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

async function callAI(options: AICallOptions): Promise<string> {
  const messages: any[] = [
    { role: 'system', content: options.systemPrompt },
  ]

  if (options.imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: options.userMessage },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${options.imageBase64}` },
        },
      ],
    })
  } else {
    messages.push({ role: 'user', content: options.userMessage })
  }

  const body: any = {
    model: AI_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
  }

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API 错误 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ========== 模块 1: 饮食热量估算 ==========

export interface MealAnalysis {
  foods: { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  suggestions: string
}

export async function analyzeMealPhoto(imageBase64: string): Promise<MealAnalysis> {
  const systemPrompt = `你是一个营养师。用户拍照食物，你告诉ta这顿饭有多少热量、营养怎么样。

规则：
- 用简单的大白话，不要专业术语
- 建议要简短实用，1-2句话就行
- 严格返回 JSON 格式`

  const userMessage = `看看这顿饭有什么食物，估算热量和营养。

返回 JSON（用大白话，建议1-2句就好）：
{
  "foods": [{ "name": "食物名", "portion": "大概多少", "calories": 热量数字, "protein": 蛋白质克数, "carbs": 碳水克数, "fat": 脂肪克数 }],
  "totalCalories": 总热量,
  "totalProtein": 总蛋白质,
  "totalCarbs": 总碳水,
  "totalFat": 总脂肪,
  "suggestions": "简单建议，1-2句大白话"
}`

  const result = await callAI({
    systemPrompt,
    userMessage,
    imageBase64,
    temperature: 0.3,
    maxTokens: 1000,
    jsonMode: true,
  })

  return JSON.parse(result) as MealAnalysis
}

// ========== 模块 2: 训练计划生成 ==========

export interface WorkoutPlan {
  name: string
  description: string
  daysPerWeek: number
  durationWeeks: number
  goal: string
  days: {
    dayName: string
    focus: string
    warmup: string
    exercises: {
      name: string
      sets: number
      reps: string
      rest: string
      notes: string
      targetMuscles: string
    }[]
    cooldown: string
  }[]
  tips: string[]
}

export async function generateWorkoutPlan(params: {
  goal: string
  level: string
  daysPerWeek: number
  equipment: string[]
  limitations: string
}): Promise<WorkoutPlan> {
  const systemPrompt = `你是一个专业的健身教练 AI，拥有运动科学学位和多年执教经验。根据用户的需求生成个性化的训练计划。`

  const userMessage = `请为我生成一份训练计划：
- 目标：${params.goal}
- 水平：${params.level}
- 每周训练天数：${params.daysPerWeek}
- 可用器械：${params.equipment.join('、') || '无器械'}
- 特殊限制：${params.limitations || '无'}

返回 JSON 格式的训练计划：
{
  "name": "计划名称",
  "description": "简短描述",
  "daysPerWeek": 数字,
  "durationWeeks": 建议周数,
  "goal": "目标",
  "days": [{
    "dayName": "周一/周二等",
    "focus": "训练重点（如胸+三头）",
    "warmup": "热身内容",
    "exercises": [{
      "name": "动作名",
      "sets": 组数,
      "reps": "次数（如8-12）",
      "rest": "组间休息",
      "notes": "动作要点",
      "targetMuscles": "目标肌群"
    }],
    "cooldown": "拉伸放松内容"
  }],
  "tips": ["训练建议1", "训练建议2"]
}`

  const result = await callAI({
    systemPrompt,
    userMessage,
    temperature: 0.7,
    maxTokens: 3000,
    jsonMode: true,
  })

  return JSON.parse(result) as WorkoutPlan
}

// ========== 模块 3: 动作分析 ==========

export interface PoseAnalysis {
  exercise: string
  overallScore: number
  issues: {
    bodyPart: string
    issue: string
    correction: string
    severity: 'low' | 'medium' | 'high'
  }[]
  feedback: string
}

export async function analyzePose(params: {
  exercise: string
  description: string
  imageBase64?: string
}): Promise<PoseAnalysis> {
  const systemPrompt = `你是一个健身教练。用简单的大白话分析用户的训练动作，像朋友聊天一样给出建议。

规则：
- 用口语化语言，不要专业术语，像在跟朋友说话
- 每条问题描述不超过15个字
- 每条纠正建议不超过20个字
- 总体反馈不超过2句话
- 用比喻帮助理解（比如"背要像木板一样直"）`

  const userMessage = params.imageBase64
    ? `分析这个${params.exercise}动作。用户描述：${params.description || '无额外描述'}。

返回 JSON（一定要用大白话，不要术语）：
{
  "exercise": "${params.exercise}",
  "overallScore": 0-100打分,
  "issues": [{ "bodyPart": "部位", "issue": "哪里不对（大白话，≤15字）", "correction": "怎么改（大白话，≤20字）", "severity": "low/medium/high" }],
  "feedback": "总结（2句大白话，像朋友鼓励你）"
}`
    : `分析${params.exercise}这个动作的常见错误。用户描述：${params.description || '无额外描述'}。

返回 JSON（一定要用大白话，不要术语）：
{
  "exercise": "${params.exercise}",
  "overallScore": 0-100打分,
  "issues": [{ "bodyPart": "部位", "issue": "哪里不对（大白话，≤15字）", "correction": "怎么改（大白话，≤20字）", "severity": "low/medium/high" }],
  "feedback": "总结（2句大白话，像朋友鼓励你）"
}`

  const result = await callAI({
    systemPrompt,
    userMessage,
    imageBase64: params.imageBase64,
    temperature: 0.5,
    maxTokens: 1500,
    jsonMode: true,
  })

  return JSON.parse(result) as PoseAnalysis
}

// ========== AI 聊天助手 ==========

export async function chatWithCoach(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const systemPrompt = `你是 FitAI Coach，一个热情又实在的健身教练。

说话规则：
- 像朋友聊天一样，用大白话
- 不要堆专业术语，说人话
- 每次回答2-4句话，别啰嗦
- 多鼓励，但要讲实话
- 用比喻帮用户理解（比如"收紧核心就像有人要打你肚子"）`

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API 错误 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}
