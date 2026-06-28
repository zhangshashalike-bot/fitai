import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, User, Bot } from 'lucide-react'
import { chatWithCoach } from '../services/ai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '你好！我是 FitAI Coach 🏋️ 你的专属 AI 健身教练。\n\n我可以帮你：\n• 制定和调整训练计划\n• 分析动作姿势问题\n• 提供饮食营养建议\n• 解答健身相关问题\n\n今天想聊什么？',
}

const QUICK_QUESTIONS = [
  '如何正确做深蹲？',
  '减脂期怎么吃？',
  '新手一周练几次合适？',
  '如何突破平台期？',
]

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await chatWithCoach([...messages, userMsg])
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我暂时无法回复。请检查 AI API 配置后重试。'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI 健身教练</h1>
        <p className="text-dark-400 text-sm mt-1">随时咨询你的专属 AI 教练</p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'assistant' ? 'bg-primary-500/20' : 'bg-dark-700'
            }`}>
              {msg.role === 'assistant' ? (
                <Bot className="w-4 h-4 text-primary-400" />
              ) : (
                <User className="w-4 h-4 text-dark-300" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-dark-800 text-dark-200 rounded-tl-sm'
                : 'bg-primary-600 text-white rounded-tr-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-400" />
            </div>
            <div className="bg-dark-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 快捷问题 */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded-full text-xs text-dark-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
