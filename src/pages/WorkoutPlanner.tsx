import { useState } from 'react'
import { Loader2, Sparkles, Dumbbell, Clock, Target, CheckCircle2, Play } from 'lucide-react'
import { generateWorkoutPlan, WorkoutPlan } from '../services/ai'
import { saveWorkoutPlan, setActivePlan } from '../services/storage'

const GOALS = [
  { value: 'lose_fat', label: '减脂瘦身', emoji: '🔥' },
  { value: 'build_muscle', label: '增肌塑形', emoji: '💪' },
  { value: 'strength', label: '提升力量', emoji: '🏋️' },
  { value: 'endurance', label: '增强耐力', emoji: '🏃' },
  { value: 'general', label: '综合健康', emoji: '❤️' },
]

const LEVELS = [
  { value: 'beginner', label: '新手入门' },
  { value: 'intermediate', label: '有一定基础' },
  { value: 'advanced', label: '健身老手' },
]

const EQUIPMENT = ['哑铃', '杠铃', '弹力带', '瑜伽垫', '单杠', '跑步机', '划船机', '壶铃']

export default function WorkoutPlanner() {
  const [goal, setGoal] = useState('build_muscle')
  const [level, setLevel] = useState('intermediate')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [selectedEquip, setSelectedEquip] = useState<string[]>(['哑铃', '瑜伽垫'])
  const [limitations, setLimitations] = useState('')
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [error, setError] = useState('')

  const toggleEquip = (item: string) => {
    setSelectedEquip(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    )
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const result = await generateWorkoutPlan({
        goal: GOALS.find(g => g.value === goal)?.label || goal,
        level: LEVELS.find(l => l.value === level)?.label || level,
        daysPerWeek,
        equipment: selectedEquip,
        limitations,
      })
      setPlan(result)
      const saved = saveWorkoutPlan({
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        plan: result,
        active: true,
      })
      setActivePlan(saved.id)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">AI 训练计划</h1>
        <p className="text-dark-400 mt-1">告诉 AI 你的目标，生成个性化训练方案</p>
      </div>

      {/* 参数设置 */}
      <div className="card space-y-4">
        {/* 目标 */}
        <div>
          <label className="text-sm font-medium text-dark-300 mb-2 block">训练目标</label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`px-3 py-2 rounded-xl text-sm transition-all ${
                  goal === g.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-900 text-dark-400 hover:text-white'
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 水平 */}
        <div>
          <label className="text-sm font-medium text-dark-300 mb-2 block">训练水平</label>
          <div className="flex gap-2">
            {LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`flex-1 py-2 rounded-xl text-sm transition-all ${
                  level === l.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-900 text-dark-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* 每周天数 */}
        <div>
          <label className="text-sm font-medium text-dark-300 mb-2 block">
            每周训练天数：<span className="text-primary-400 font-bold">{daysPerWeek}</span> 天
          </label>
          <input
            type="range"
            min={1}
            max={7}
            value={daysPerWeek}
            onChange={e => setDaysPerWeek(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-dark-500 mt-1">
            <span>1天</span><span>7天</span>
          </div>
        </div>

        {/* 器械 */}
        <div>
          <label className="text-sm font-medium text-dark-300 mb-2 block">可用器械（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map(item => (
              <button
                key={item}
                onClick={() => toggleEquip(item)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  selectedEquip.includes(item)
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-900 text-dark-400 border border-dark-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 限制 */}
        <div>
          <label className="text-sm font-medium text-dark-300 mb-2 block">身体限制/伤病（可选）</label>
          <input
            value={limitations}
            onChange={e => setLimitations(e.target.value)}
            placeholder="如：膝盖不适、腰椎问题..."
            className="input-field"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AI 生成中...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> 生成训练计划</>
          )}
        </button>
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 训练计划展示 */}
      {plan && (
        <div className="space-y-4 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-dark-400 text-sm mt-1">{plan.description}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-dark-400">
                <Target className="w-4 h-4 text-primary-400" />
                {plan.goal}
              </div>
              <div className="flex items-center gap-1 text-dark-400">
                <Clock className="w-4 h-4 text-primary-400" />
                {plan.daysPerWeek}天/周 · {plan.durationWeeks}周
              </div>
            </div>
          </div>

          {plan.days.map((day, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{day.dayName}</h3>
                  <p className="text-xs text-primary-400">{day.focus}</p>
                </div>
              </div>

              <div className="text-sm text-dark-400 mb-3">
                <span className="text-green-400">热身：</span>{day.warmup}
              </div>

              <div className="space-y-2">
                {day.exercises.map((ex, j) => (
                  <div key={j} className="bg-dark-900 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-dark-400 mt-0.5">{ex.targetMuscles}</div>
                    </div>
                    <div className="text-right text-xs text-dark-400">
                      <div>{ex.sets}组 × {ex.reps}</div>
                      <div>休息{ex.rest}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-dark-400 mt-3">
                <span className="text-blue-400">拉伸：</span>{day.cooldown}
              </div>
            </div>
          ))}

          {plan.tips.length > 0 && (
            <div className="card border-primary-500/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-400" />
                AI 训练建议
              </h3>
              <ul className="space-y-1">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-dark-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
