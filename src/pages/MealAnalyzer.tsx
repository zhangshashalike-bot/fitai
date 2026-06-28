import { useState, useRef } from 'react'
import { Camera, Loader2, Sparkles, ChevronDown } from 'lucide-react'
import { analyzeMealPhoto, MealAnalysis } from '../services/ai'
import { addMeal } from '../services/storage'

export default function MealAnalyzer() {
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setImage(dataUrl)
      setImageBase64(dataUrl.split(',')[1])
      setResult(null)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!imageBase64) return
    setAnalyzing(true)
    setError('')
    try {
      const analysis = await analyzeMealPhoto(imageBase64)
      setResult(analysis)
      addMeal({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        mealType,
        imageBase64,
        analysis,
      })
    } catch (err: any) {
      setError(err.message || '分析失败，请重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const mealTypeLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">饮食热量估算</h1>
        <p className="text-dark-400 mt-1">拍照识别食物，AI 自动计算热量和营养成分</p>
      </div>

      {/* 餐食类型选择 */}
      <div className="flex gap-2">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              mealType === type
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            {mealTypeLabels[type]}
          </button>
        ))}
      </div>

      {/* 图片上传 */}
      <div className="card">
        {image ? (
          <div className="space-y-4">
            <img src={image} alt="食物照片" className="w-full rounded-xl max-h-64 object-cover" />
            <div className="flex gap-2">
              <button onClick={() => { setImage(null); setImageBase64(null); setResult(null) }} className="btn-secondary flex-1">
                重新拍照
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 分析中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> AI 分析</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 border-2 border-dashed border-dark-600 rounded-xl hover:border-primary-500 transition-colors flex flex-col items-center gap-3"
          >
            <Camera className="w-10 h-10 text-dark-500" />
            <span className="text-dark-400">点击拍照或选择食物照片</span>
            <span className="text-xs text-dark-500">支持 JPG、PNG 格式</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="card border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* 总热量 */}
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-400">{result.totalCalories}</div>
            <div className="text-dark-400 text-sm mt-1">总热量 (kcal)</div>
            <div className="flex justify-center gap-6 mt-3 text-sm">
              <div><span className="text-orange-400 font-semibold">{result.totalProtein}g</span> <span className="text-dark-500">蛋白质</span></div>
              <div><span className="text-yellow-400 font-semibold">{result.totalCarbs}g</span> <span className="text-dark-500">碳水</span></div>
              <div><span className="text-red-400 font-semibold">{result.totalFat}g</span> <span className="text-dark-500">脂肪</span></div>
            </div>
          </div>

          {/* 食物明细 */}
          <div className="card">
            <h3 className="font-semibold mb-3">食物明细</h3>
            <div className="space-y-2">
              {result.foods.map((food, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700/50 last:border-0">
                  <div>
                    <div className="font-medium">{food.name}</div>
                    <div className="text-xs text-dark-400">{food.portion}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary-400">{food.calories} kcal</div>
                    <div className="text-xs text-dark-400">
                      P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 建议 */}
          {result.suggestions && (
            <div className="card border-primary-500/20 bg-primary-500/5">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                <p className="text-sm text-dark-300">{result.suggestions}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
