// 本地存储工具 - 替代后端数据库

const STORAGE_KEYS = {
  MEALS: 'fitai_meals',
  WORKOUT_PLANS: 'fitai_workout_plans',
  WORKOUT_LOGS: 'fitai_workout_logs',
  BODY_STATS: 'fitai_body_stats',
  SETTINGS: 'fitai_settings',
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ===== 饮食记录 =====

export interface MealRecord {
  id: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  imageBase64?: string
  analysis: import('./ai').MealAnalysis
}

export function getMeals(): MealRecord[] {
  return getItem<MealRecord[]>(STORAGE_KEYS.MEALS, [])
}

export function addMeal(meal: MealRecord) {
  const meals = getMeals()
  meals.unshift(meal)
  setItem(STORAGE_KEYS.MEALS, meals)
}

// ===== 训练计划 =====

export interface SavedWorkoutPlan {
  id: string
  createdAt: string
  plan: import('./ai').WorkoutPlan
  active: boolean
}

export function getWorkoutPlans(): SavedWorkoutPlan[] {
  return getItem<SavedWorkoutPlan[]>(STORAGE_KEYS.WORKOUT_PLANS, [])
}

export function saveWorkoutPlan(plan: SavedWorkoutPlan) {
  const plans = getWorkoutPlans()
  plans.unshift(plan)
  setItem(STORAGE_KEYS.WORKOUT_PLANS, plans)
}

export function setActivePlan(planId: string) {
  const plans = getWorkoutPlans()
  plans.forEach(p => p.active = p.id === planId)
  setItem(STORAGE_KEYS.WORKOUT_PLANS, plans)
}

export function getActivePlan(): SavedWorkoutPlan | null {
  return getWorkoutPlans().find(p => p.active) || null
}

// ===== 训练日志 =====

export interface WorkoutLog {
  id: string
  date: string
  planId: string
  dayName: string
  exercises: {
    name: string
    sets: { reps: number; weight: number; completed: boolean }[]
  }[]
  duration: number
  notes: string
}

export function getWorkoutLogs(): WorkoutLog[] {
  return getItem<WorkoutLog[]>(STORAGE_KEYS.WORKOUT_LOGS, [])
}

export function addWorkoutLog(log: WorkoutLog) {
  const logs = getWorkoutLogs()
  logs.unshift(log)
  setItem(STORAGE_KEYS.WORKOUT_LOGS, logs)
}

// ===== 身体数据 =====

export interface BodyStats {
  id: string
  date: string
  weight: number
  bodyFat?: number
  chest?: number
  waist?: number
  arm?: number
  thigh?: number
}

export function getBodyStats(): BodyStats[] {
  return getItem<BodyStats[]>(STORAGE_KEYS.BODY_STATS, [])
}

export function addBodyStats(stats: BodyStats) {
  const data = getBodyStats()
  data.unshift(stats)
  setItem(STORAGE_KEYS.BODY_STATS, data)
}

// ===== 今日营养汇总 =====

export function getTodayNutrition() {
  const today = new Date().toISOString().split('T')[0]
  const meals = getMeals().filter(m => m.date === today)

  return {
    calories: meals.reduce((sum, m) => sum + m.analysis.totalCalories, 0),
    protein: meals.reduce((sum, m) => sum + m.analysis.totalProtein, 0),
    carbs: meals.reduce((sum, m) => sum + m.analysis.totalCarbs, 0),
    fat: meals.reduce((sum, m) => sum + m.analysis.totalFat, 0),
    mealCount: meals.length,
  }
}
