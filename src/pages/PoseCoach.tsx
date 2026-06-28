import { useState, useRef, useEffect } from 'react'
import { Camera, Loader2, Sparkles, AlertTriangle, CheckCircle, Info, Video, StopCircle, Play, RefreshCw } from 'lucide-react'
import { analyzePose, PoseAnalysis } from '../services/ai'

const COMMON_EXERCISES = [
  '深蹲', '硬拉', '卧推', '引体向上', '俯卧撑',
  '划船', '肩推', '弯举', '臀桥', '平板支撑',
]

export default function PoseCoach() {
  const [exercise, setExercise] = useState('深蹲')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<PoseAnalysis | null>(null)
  const [error, setError] = useState('')

  // 视频录制
  const [recording, setRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number>(0)

  // 初始化摄像头
  const startCamera = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraReady(true)
    } catch (err) {
      setError('无法打开摄像头，请检查权限设置')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // 开始录制
  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8',
    })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)

    // 10 秒自动停止
    let sec = 10
    setCountdown(sec)
    timerRef.current = setInterval(() => {
      sec--
      setCountdown(sec)
      if (sec <= 0) {
        clearInterval(timerRef.current)
        stopRecording()
      }
    }, 1000) as unknown as number
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    setCountdown(0)
  }

  // 提取视频帧作为截图发给 AI
  const captureFrame = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve('')
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(videoRef.current, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1])
    })
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      // 从视频中截取一帧
      const frame = await captureFrame()
      const analysis = await analyzePose({
        exercise,
        description: '用户录制了一段训练视频，请根据视频帧分析动作是否标准',
        imageBase64: frame || undefined,
      })
      setResult(analysis)
    } catch (err: any) {
      setError(err.message || '分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setVideoUrl(null)
    setRecordedBlob(null)
    setError('')
  }

  const severityConfig = {
    low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: '小问题' },
    medium: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: '需注意' },
    high: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: '要改正' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">AI 动作纠正</h1>
        <p className="text-dark-400 mt-1">用摄像头录制训练动作，AI 帮你纠正姿势</p>
      </div>

      {/* 动作选择 */}
      <div className="card">
        <label className="text-sm font-medium text-dark-300 mb-2 block">你在练什么动作？</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_EXERCISES.map(ex => (
            <button
              key={ex}
              onClick={() => { setExercise(ex); handleReset() }}
              className={`px-3 py-2 rounded-xl text-sm transition-all ${
                exercise === ex
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-900 text-dark-400 hover:text-white'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* 摄像头预览 */}
      <div className="card overflow-hidden p-0">
        <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '480px' }}>
          {/* 摄像头画面 */}
          {!videoUrl && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* 录制后的视频回放 */}
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-cover"
            />
          )}

          {/* 录制倒计时 */}
          {recording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              {countdown}秒
            </div>
          )}

          {/* 录制按钮 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {!videoUrl && !recording && cameraReady && (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-90"
              >
                <Video className="w-6 h-6 text-white" />
              </button>
            )}
            {recording && (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg transition-all active:scale-90"
              >
                <StopCircle className="w-7 h-7 text-red-500" />
              </button>
            )}
            {videoUrl && (
              <button
                onClick={handleReset}
                className="w-14 h-14 rounded-full bg-dark-800/80 backdrop-blur flex items-center justify-center shadow-lg transition-all active:scale-90"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* 提示文字 */}
        <div className="p-4 text-center">
          {!videoUrl && !recording && cameraReady && (
            <p className="text-dark-400 text-sm">点击红色按钮，录制 10 秒训练动作</p>
          )}
          {recording && (
            <p className="text-red-400 text-sm font-medium">正在录制...保持动作标准！</p>
          )}
          {videoUrl && !result && (
            <p className="text-primary-400 text-sm">录制完成，点击下方按钮让 AI 分析</p>
          )}
        </div>
      </div>

      {/* 分析按钮 */}
      {videoUrl && !result && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn-primary w-full flex items-center justify-center gap-2 animate-pulse-glow"
        >
          {analyzing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> AI 正在分析你的动作...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> AI 分析动作</>
          )}
        </button>
      )}

      {error && (
        <div className="card border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* 评分 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary-500 mb-3">
              <span className="text-3xl font-bold text-primary-400">{result.overallScore}</span>
            </div>
            <div className="text-dark-400 text-sm">动作评分（满分100）</div>
            <div className="mt-2 text-lg font-semibold">
              {result.overallScore >= 80 ? (
                <span className="text-green-400">👍 做得很标准！</span>
              ) : result.overallScore >= 60 ? (
                <span className="text-yellow-400">🤔 还不错，有小问题</span>
              ) : (
                <span className="text-red-400">⚠️ 需要调整姿势</span>
              )}
            </div>
          </div>

          {/* 问题列表 - 简单易懂 */}
          {result.issues.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">需要注意的地方</h3>
              <div className="space-y-3">
                {result.issues.map((issue, i) => {
                  const sev = severityConfig[issue.severity]
                  const Icon = sev.icon
                  return (
                    <div key={i} className={`${sev.bg} ${sev.border} border rounded-xl p-3`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${sev.color}`} />
                        <span className={`text-sm font-medium ${sev.color}`}>{issue.bodyPart}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300 mb-1">{issue.issue}</p>
                      <p className="text-sm text-primary-400 font-medium">💡 {issue.correction}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 总体反馈 - 简单口语化 */}
          <div className="card border-primary-500/20 bg-primary-500/5">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
              <p className="text-sm text-dark-300">{result.feedback}</p>
            </div>
          </div>

          {/* 再来一次 */}
          <button onClick={handleReset} className="btn-secondary w-full flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            重新录制
          </button>
        </div>
      )}
    </div>
  )
}
