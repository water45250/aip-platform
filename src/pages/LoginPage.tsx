import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Zap, Shield, Globe, ChevronRight, Eye, EyeOff, Mail, Lock, User, ArrowRight
} from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex">
      {/* 左側品牌區 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* 動態裝飾圓 */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-400/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">AIP</span>
            </div>
            <p className="text-purple-200/80 text-sm ml-1">超級個體 AI 創作平臺</p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                釋放創作無限可能
              </h1>
              <p className="text-purple-200/90 text-lg leading-relaxed max-w-md">
                AI 驅動的全流程創作工具，從選題挖掘到一鍵發布，讓每一位創作者都能打造超級個體品牌
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Zap, label: 'AI 智能創作引擎', desc: '選題→腳本→數字人→發布' },
                { icon: Shield, label: '多維度內容審核', desc: '安全合規與智能優化' },
                { icon: Globe, label: '多平臺一鍵分發', desc: '抖音/快手/B站/小紅書' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <item.icon className="w-5 h-5 text-purple-200" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{item.label}</div>
                    <div className="text-purple-200/60 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-purple-300/50 text-xs">
            © 2026 AIP 超級個體 AI 創作平臺
          </div>
        </div>
      </div>

      {/* 右側表單區 */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* 行動端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">AIP</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegister ? '註冊 AIP 帳號' : '歡迎回來'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isRegister ? '開始您的超級個體創作之旅' : '登入以繼續您的創作工作'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">用戶名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="請輸入用戶名"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">郵箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="請輸入郵箱地址"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="請輸入密碼"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">確認密碼</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="請再次輸入密碼"
                    value={form.confirm}
                    onChange={e => update('confirm', e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-gray-600">記住我</span>
                </label>
                <a href="#" className="text-violet-600 hover:text-violet-700 font-medium">忘記密碼？</a>
              </div>
            )}

            {isRegister && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 mt-0.5"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  我已閱讀並同意 <a href="#" className="text-violet-600 hover:text-violet-700">服務協議</a> 和 <a href="#" className="text-violet-600 hover:text-violet-700">隱私政策</a>
                </span>
              </label>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-violet-700 hover:to-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              {isRegister ? '立即註冊' : '登入'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 社交登入 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-3 text-gray-400">或使用以下方式</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              {['微信', 'QQ', 'GitHub'].map(name => (
                <button
                  key={name}
                  type="button"
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 切換登入/註冊 */}
          <div className="mt-8 text-center text-sm text-gray-600">
            {isRegister ? '已有帳號？' : '還沒有帳號？'}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="ml-1 text-violet-600 font-medium hover:text-violet-700 inline-flex items-center gap-1"
            >
              {isRegister ? '立即登入' : '免費註冊'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
