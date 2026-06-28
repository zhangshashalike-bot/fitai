import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Flame, Activity, Target, ArrowRight, Plus } from 'lucide-react'
import { getTodayNutrition, getBodyStats, getWorkoutLogs } from '../services/storage'

export default function Dashboard() {
  const navigate = useNavigate()
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 })
  const [stats, setStats] = useState<any>(null)
  const [recentWorkouts, setRecentWorkouts] = useState(0)

  useEffect(() => {
    setNutrition(getTodayNutrition())
    const bodyData = getBodyStats()
    setStats(bodyData[0] || null)
    const logs = getWorkoutLogs()
    setRecentWorkouts(logs.filter(l => {
      const d = new Date(l.date)
      const now = new Date()
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
    }).length)
  }, [])

  const calorieGoal = 2200
  const caloriePercent = Math.min(Math.round((nutrition.calories / calorieGoal) * 100), 100)

  const quickActions = [
    { label: '拍照记录饮食', icon: '📸', path: '/meals', color: 'from-orange-500 to-red-500' },
    { label: '开始今日训练', icon: '🏋️', path: '/workout', color: 'from-green-500 to-emerald-500' },
    { label: '检查动作姿势', icon: '🎯', path: '/pose', color: 'from-blue-500 to-cyan-500' },
    { label: '咨询AI教练', icon: '💬', path: '/chat', color: 'from-purple-500 to-pink-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 欢迎 */}
      <div>
        <h1 className="text-2xl font-bold">下午好 👋</h1>
        <p className="text-dark-400 mt-1">今天也要加油训练！</p>
      </div>

      {/* 今日概览卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{nutrition.calories}</div>
            <div className="text-xs text-dark-400">今日摄入/kcal</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{recentWorkouts}</div>
            <div className="text-xs text-dark-400">本周训练/次</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{nutrition.protein}g</div>
            <div className="text-xs text-dark-400">今日蛋白质</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.weight || '--'}</div>
            <div className="text-xs text-dark-400">体重/kg</div>
          </div>
        </div>
      </div>

      {/* 热量进度条 */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">今日热量目标</h3>
          <span className="text-sm text-dark-400">{nutrition.calories} / {calorieGoal} kcal</span>
        </div>
        <div className="w-full h-3 bg-dark-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${caloriePercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-dark-400">
          <span>蛋白质 {nutrition.protein}g</span>
          <span>碳水 {nutrition.carbs}g</span>
          <span>脂肪 {nutrition.fat}g</span>
        </div>
      </div>

      {/* 快捷操作 */}
      <div>
        <h3 className="font-semibold mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`card bg-gradient-to-br ${action.color} bg-opacity-10 border-0 flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-white">{action.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-white/60" />
            </button>
          ))}
        </div>
      </div>

      {/* 身体数据录入 */}
      <div className="card">
        <h3 className="font-semibold mb-3">身体数据</h3>
        {stats ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-primary-400">{stats.weight}</div>
              <div className="text-xs text-dark-400">体重/kg</div>
            </div>
            <div>
              <div className="text-xl font-bold text-primary-400">{stats.bodyFat || '--'}%</div>
              <div className="text-xs text-dark-400">体脂率</div>
            </div>
            <div>
              <div className="text-xl font-bold text-primary-400">{stats.waist || '--'}</div>
              <div className="text-xs text-dark-400">腰围/cm</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              const w = prompt('请输入体重(kg)：')
              if (w) {
                const { addBodyStats } = require('../services/storage')
                addBodyStats({
                  id: Date.now().toString(),
                  date: new Date().toISOString().split('T')[0],
                  weight: parseFloat(w),
                })
                setStats({ weight: parseFloat(w) })
              }
            }}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            录入今日数据
          </button>
        )}
      </div>
    </div>
  )
}
