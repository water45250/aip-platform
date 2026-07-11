import { useState } from 'react'
import {
  Lightbulb, FileText, Mic, MonitorPlay, Video, Scissors, Send,
  FolderPlus, LayoutGrid, Download, TrendingUp, TrendingDown,
  Clapperboard, ShieldCheck, BarChart, Image, Type, Play, Clock, MoreHorizontal,
  ChevronUp, CheckCircle2, ChevronRight, ChevronDown
} from 'lucide-react'

export default function DashboardPage() {
  const [collapsedFlow, setCollapsedFlow] = useState(false)

  const flowSteps = [
    { icon: Lightbulb, label: '選題挖掘', color: 'bg-amber-50 text-amber-600' },
    { icon: FileText, label: '腳本創作', color: 'bg-blue-50 text-blue-600' },
    { icon: Mic, label: '聲音克隆', color: 'bg-emerald-50 text-emerald-600' },
    { icon: MonitorPlay, label: '數字人視頻', color: 'bg-purple-50 text-purple-600' },
    { icon: Video, label: '動畫生成', color: 'bg-amber-50 text-amber-600' },
    { icon: Scissors, label: '智能剪輯', color: 'bg-rose-50 text-rose-600' },
    { icon: Send, label: '一鍵發布', color: 'bg-sky-50 text-sky-600' },
  ]

  const quickStart = [
    { icon: FolderPlus, title: '新建空白項目', desc: '從頭開始創建全新視頻', btn: '立即創建', btnColor: 'bg-violet-600 hover:bg-violet-700 text-white' },
    { icon: LayoutGrid, title: '使用模板創作', desc: '從熱門模板快速生成視頻', btn: '選擇模板', btnColor: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700' },
    { icon: Download, title: '導入素材創作', desc: '導入已有素材進行創作', btn: '導入素材', btnColor: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700' },
  ]

  const stats = [
    { label: '累計創作', value: '128', sub: '個', change: '12%', up: true },
    { label: '視頻發布', value: '96', sub: '個', change: '8%', up: true },
    { label: '播放總量', value: '286.6', sub: '萬', change: '15%', up: true },
    { label: '點贊總量', value: '12.8', sub: '萬', change: '7%', up: true },
  ]

  const tools = [
    { icon: Clapperboard, title: 'AI 導演', desc: '智能分鏡與腳本優化', color: 'bg-blue-50 text-blue-600' },
    { icon: ShieldCheck, title: 'AI 審核官', desc: '內容安全檢測與合規', color: 'bg-amber-50 text-amber-600' },
    { icon: BarChart, title: 'AI 運營官', desc: '數據分析與優化建議', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Image, title: '封面生成', desc: 'AI 智能生成視頻封面', color: 'bg-purple-50 text-purple-600' },
    { icon: Type, title: '文案助手', desc: '生成發布文案與標籤', color: 'bg-pink-50 text-pink-600' },
  ]

  const recent = [
    { title: 'AI 如何改變未來工作方式', date: '2024-05-12 14:30', steps: [1, 1, 1, 0, 0, 0, 0, 0] },
    { title: '3 個提升效率的時間管理技巧', date: '2024-05-11 09:15', steps: [1, 1, 1, 1, 1, 1, 0, 0] },
    { title: '理財小白必看的 5 個入門知識', date: '2024-05-10 16:45', steps: [1, 1, 1, 1, 1, 1, 1, 1] },
  ]

  const stepIcons = [
    { icon: Lightbulb, color: 'bg-amber-50 text-amber-500' },
    { icon: FileText, color: 'bg-blue-50 text-blue-500' },
    { icon: Mic, color: 'bg-emerald-50 text-emerald-500' },
    { icon: MonitorPlay, color: 'bg-purple-50 text-purple-500' },
    { icon: Video, color: 'bg-amber-50 text-amber-500' },
    { icon: Scissors, color: 'bg-rose-50 text-rose-500' },
    { icon: Image, color: 'bg-sky-50 text-sky-500' },
    { icon: Send, color: 'bg-violet-50 text-violet-500' },
  ]

  const stepTitles = ['選題', '腳本', '聲音', '數字人', '動畫', '剪輯', '畫面', '發布']

  const tips = [
    '選擇熱門話題更容易獲得流量',
    '腳本前 3 秒是吸引觀眾的關鍵',
    '善用 AI 導演讓視頻更有節奏感',
    '定期分析數據，持續優化內容',
  ]

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 創作流程 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">創作流程</h2>
            <button
              onClick={() => setCollapsedFlow(!collapsedFlow)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-all"
            >
              {collapsedFlow ? '展開流程' : '收起流程'}
              {collapsedFlow ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
          {!collapsedFlow && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {flowSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={i} className="flex items-center gap-2 flex-shrink-0">
                    <div className={'flex items-center gap-2 px-3 py-2.5 rounded-xl ' + step.color + ' border border-current/10'}>
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                    </div>
                    {i < flowSteps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 中部區域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 快速開始 */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">快速開始</h3>
            <p className="text-xs text-gray-500 mb-4">選擇一種方式開始你的創作</p>
            <div className="space-y-3">
              {quickStart.map((card, i) => {
                const Icon = card.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-all">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{card.title}</div>
                      <div className="text-[11px] text-gray-500">{card.desc}</div>
                    </div>
                    <button className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + card.btnColor}>{card.btn}</button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 創作數據概覽 */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">創作數據概覽</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold text-gray-900">{s.value}</span>
                    <span className="text-xs text-gray-500">{s.sub}</span>
                  </div>
                  <div className={'flex items-center gap-1 mt-1 text-[10px] ' + (s.up ? 'text-emerald-600' : 'text-red-500')}>
                    {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>較上週 {s.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷工具 */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">快捷工具</h3>
            <div className="space-y-2">
              {tools.map((t, i) => {
                const Icon = t.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group">
                    <div className={'w-9 h-9 rounded-xl ' + t.color + ' flex items-center justify-center flex-shrink-0'}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{t.title}</div>
                      <div className="text-[11px] text-gray-500">{t.desc}</div>
                    </div>
                    <button className="px-3 py-1 text-[11px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-all">去使用</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 底部區域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 最近創作 */}
          <div className="col-span-12 lg:col-span-9 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">最近創作</h3>
              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-all">全部項目 <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-3">
              {recent.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-1">{item.title}</div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>更新於 {item.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      {item.steps.map((done, j) => {
                        const s = stepIcons[j]
                        const Si = s.icon
                        return (
                          <div key={j} className={'w-6 h-6 rounded-md flex items-center justify-center ' + (done ? s.color : 'bg-gray-100 text-gray-300')} title={stepTitles[j]}>
                            <Si className="w-3 h-3" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">預覽</button>
                    <button className="px-3 py-1.5 text-xs text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all">繼續編輯</button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側列 */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* 新手教程 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">新手教程</h3>
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-violet-900 mb-1">3 分鐘快速上手 AIP</div>
                    <div className="text-[11px] text-violet-700/70">從零開始掌握 AI 創作全流程</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" />
                  </div>
                  <span className="text-[10px] text-violet-700/60">0/8</span>
                </div>
              </div>
            </div>

            {/* 創作小貼士 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">創作小貼士</h3>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-amber-500" />
                    </div>
                    <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-1 mt-4 text-xs text-violet-600 hover:text-violet-700 font-medium transition-all">查看更多技巧 <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
