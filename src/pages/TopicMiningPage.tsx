import { useState } from 'react'
import {
  Sparkles, TrendingUp, TrendingDown, RefreshCw, LayoutGrid,
  Briefcase, DollarSign, Code, Heart, Brain, Home, GraduationCap, HeartPulse,
  ChevronDown, Check,
} from 'lucide-react'

type Domain = { id: string; label: string; icon: typeof LayoutGrid; color: string }
type Topic = {
  id: number
  title: string
  tags: { text: string; cls: string }[]
  desc: string
  score: number
  trend: number
  interaction: number
  competition: number
  recency: number
  prediction: string
}

const domains: Domain[] = [
  { id: 'all', label: '全部領域', icon: LayoutGrid, color: 'text-violet-500' },
  { id: 'career', label: '職場成長', icon: Briefcase, color: 'text-emerald-500' },
  { id: 'finance', label: '商業財經', icon: DollarSign, color: 'text-blue-500' },
  { id: 'tech', label: '科技數碼', icon: Code, color: 'text-cyan-500' },
  { id: 'startup', label: '創業賺錢', icon: DollarSign, color: 'text-amber-500' },
  { id: 'emotion', label: '情感心理', icon: Heart, color: 'text-pink-500' },
  { id: 'knowledge', label: '知識科普', icon: Brain, color: 'text-indigo-500' },
  { id: 'life', label: '生活方式', icon: Home, color: 'text-teal-500' },
  { id: 'edu', label: '教育學習', icon: GraduationCap, color: 'text-purple-500' },
  { id: 'health', label: '健康養生', icon: HeartPulse, color: 'text-red-400' },
]

const wordCloud: { text: string; cls: string }[] = [
  { text: '短視頻', cls: 'text-[12px] text-indigo-400 opacity-55' },
  { text: '個人品牌', cls: 'text-[14.5px] text-blue-400 opacity-65' },
  { text: 'AI工具', cls: 'text-[24px] font-bold text-violet-500 opacity-90' },
  { text: 'ChatGPT', cls: 'text-[18px] text-fuchsia-400 opacity-75' },
  { text: '效率提升', cls: 'text-[14.5px] text-emerald-400 opacity-65' },
  { text: '職場', cls: 'text-[24px] font-bold text-amber-500 opacity-90' },
  { text: '就業提升', cls: 'text-[18px] text-rose-400 opacity-75' },
  { text: '副業', cls: 'text-[14.5px] text-cyan-400 opacity-65' },
  { text: '降本增效', cls: 'text-[12px] text-gray-400 opacity-55' },
  { text: 'AI寫作', cls: 'text-[18px] text-blue-500 opacity-75' },
  { text: '賺錢', cls: 'text-[24px] font-bold text-violet-600 opacity-90' },
  { text: '情緒管理', cls: 'text-[14.5px] text-pink-400 opacity-65' },
  { text: '健康生活', cls: 'text-[12px] text-teal-400 opacity-55' },
  { text: '時間管理', cls: 'text-[18px] text-indigo-500 opacity-75' },
  { text: '投資理財', cls: 'text-[14.5px] text-orange-400 opacity-65' },
  { text: '爆款公式', cls: 'text-[24px] font-bold text-red-400 opacity-90' },
  { text: '自媒體', cls: 'text-[12px] text-gray-400 opacity-55' },
  { text: '知識付費', cls: 'text-[14.5px] text-green-500 opacity-65' },
]

const allTopics: Topic[] = [
  {
    id: 1, title: '用 AI 工具月入過萬的 5 個真實案例',
    tags: [
      { text: 'AI工具', cls: 'bg-violet-50 text-violet-600 border-violet-100' },
      { text: '副業賺錢', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      { text: '職場成長', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    ],
    desc: '拆解 5 個普通人利用 AI 工具實現的真實案例和方法',
    score: 95, trend: 125.6, interaction: 8.7, competition: 60, recency: 5,
    prediction: '用戶對「AI 變現方式」滿好感，渴望找到可複製的爆紅路徑',
  },
  {
    id: 2, title: '普通人如何抓住 2024 年的職業風口？',
    tags: [
      { text: '職場轉型', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
      { text: '職場成長', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      { text: '商業財經', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    ],
    desc: '盤點 2024 年最值得入場的 6 大創業方向',
    score: 92, trend: 98.3, interaction: 6.3, competition: 45, recency: 9,
    prediction: '用戶處於收入增長期，希望找到低風險高回報的創業機會',
  },
  {
    id: 3, title: 'ChatGPT 提升工作效率的 10 個神技巧',
    tags: [
      { text: 'AI工具', cls: 'bg-violet-50 text-violet-600 border-violet-100' },
      { text: '效率提升', cls: 'bg-pink-50 text-pink-600 border-pink-100' },
      { text: '數碼技能', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    ],
    desc: '從寫郵件到做 PPT，讓你一天多出 3 小時的 AI 技巧',
    score: 90, trend: 85.7, interaction: 5.2, competition: 35, recency: 8,
    prediction: '職場人希望通過 AI 提升效率，減輕工作壓力',
  },
  {
    id: 4, title: '存款 10 萬和 100 萬的人，差別在哪裡？',
    tags: [
      { text: '商業財經', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
      { text: '理財投資', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
      { text: '認知升維', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    ],
    desc: '從思維模式、消費習慣到投資方式的全面對比',
    score: 88, trend: 76.4, interaction: 4.8, competition: 50, recency: 3,
    prediction: '用戶對財富羨慕但困惑興趣，尋求提升財富的方法',
  },
  {
    id: 5, title: '30 歲前一定要養成的 6 個好習慣',
    tags: [
      { text: '個人成長', cls: 'bg-teal-50 text-teal-600 border-teal-100' },
      { text: '職場成長', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
      { text: '生活方式', cls: 'bg-pink-50 text-pink-600 border-pink-100' },
    ],
    desc: '受益一生的習慣養成指南，改變命運從今天開始',
    score: 85, trend: 69.2, interaction: 4.1, competition: 25, recency: 6,
    prediction: '年輕人渴望自我提升，希望建立健康長效的方法和建議',
  },
]

const stats = [
  { label: '全網熱點指數', value: '85.6', change: '較昨日 ↑ 3.2%', up: true, icon: TrendingUp, tone: 'text-violet-500' },
  { label: '內容衝突指數', value: '78.3', change: '較昨日 ↑ 7.3%', up: true, icon: TrendingUp, tone: 'text-blue-500' },
  { label: '創作質量指數', value: '62.1', change: '較昨日 ↑ 4.2%', up: true, icon: TrendingUp, tone: 'text-emerald-500' },
  { label: '粉絲增長指數', value: '+3.2%', change: '較昨日 ↑ 1.3%', up: true, icon: TrendingUp, tone: 'text-pink-500' },
  { label: '競爭度指數', value: '中', change: '較昨日 ↓ 15.7%', up: false, icon: TrendingDown, tone: 'text-amber-500' },
  { label: '爆款概率', value: '高', change: '較昨日 ↑ 18.5%', up: true, icon: TrendingUp, tone: 'text-red-500' },
]

const tabs = [
  { id: 'score', label: '推薦指數排序' },
  { id: 'newest', label: '最新熱點' },
  { id: 'interact', label: '互動量最高' },
  { id: 'competition', label: '競爭度最低' },
]

function renderStars(score: number) {
  const full = Math.round(score / 20)
  return '★★★★★'.split('').map((s, i) => (
    <span key={i} className={i < full ? 'text-amber-400' : 'text-gray-300'}>{s}</span>
  ))
}

export default function TopicMiningPage() {
  const [keyword, setKeyword] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['all'])
  const [isMining, setIsMining] = useState(false)
  const [activeTab, setActiveTab] = useState('score')
  const [platform, setPlatform] = useState('全部平台')
  const [period, setPeriod] = useState('近7天')
  const [appliedTopic, setAppliedTopic] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleDomain = (id: string) => {
    setSelectedDomains((prev) => {
      if (id === 'all') {
        return prev.includes('all') ? [] : ['all']
      }
      const without = prev.filter((d) => d !== 'all')
      if (without.includes(id)) return without.filter((d) => d !== id)
      return [...without, id]
    })
  }

  const startMining = () => {
    if (isMining) return
    setIsMining(true)
    setTimeout(() => setIsMining(false), 2200)
  }

  const sortedTopics = [...allTopics].sort((a, b) => {
    switch (activeTab) {
      case 'newest': return b.recency - a.recency
      case 'interact': return b.interaction - a.interaction
      case 'competition': return a.competition - b.competition
      default: return b.score - a.score
    }
  })

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">選題挖掘</h1>
          <p className="text-[13.5px] text-gray-500 mt-1">基於全網熱點數據，為你挖掘高潛力爆款選題</p>
        </div>

        {/* Search + Domains */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <label className="text-[12.5px] font-semibold text-gray-700 block mb-1.5">輸入你的創作方向或關鍵詞</label>
          <div className="relative mb-4">
            <input
              type="text"
              maxLength={60}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="例如：職場成長、AI工具、理財投資、情感關係..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11.5px] text-gray-400 font-mono">
              {keyword.length} / 60
            </span>
          </div>

          <div className="mb-4">
            <div className="text-[12px] text-gray-500 mb-2">選擇你的內容領域（可多選）</div>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => {
                const Icon = d.icon
                const active = selectedDomains.includes(d.id)
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDomain(d.id)}
                    className={
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-white cursor-pointer border transition-all ' +
                      (active
                        ? 'border-violet-500 bg-violet-50 text-violet-600 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50')
                    }
                  >
                    <Icon className={'w-3.5 h-3.5 ' + d.color} />
                    {d.label}
                  </button>
                )
              })}
              <button className="px-3 py-1.5 rounded-full text-[12px] text-gray-500 hover:text-violet-600 transition-all">更多 →</button>
            </div>
          </div>

          <button
            onClick={startMining}
            disabled={isMining}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 shadow-md shadow-violet-200/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isMining ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" /> 正在挖掘中...
              </>
            ) : (
              <>
                開始挖掘選題 <Sparkles className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </div>

        {/* Row 1: 趨勢概覽 + 關鍵詞云 */}
        <div className="grid grid-cols-12 gap-5">
          {/* 熱點趨勢概覽 */}
          <div className="col-span-12 lg:col-span-8">
            <h2 className="text-[14.5px] font-bold text-gray-900 mb-3">熱點趨勢概覽</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="text-[11.5px] text-gray-400 mb-1">{s.label}</div>
                    <div className="text-[24px] font-bold text-gray-900 leading-none">{s.value}</div>
                    <div className={'flex items-center gap-1 mt-1.5 text-[11px] font-medium ' + (s.up ? 'text-emerald-600' : 'text-amber-600')}>
                      <Icon className="w-3 h-3" />
                      <span>{s.change}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 熱點關鍵詞云 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14.5px] font-bold text-gray-900">熱點關鍵詞云</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span>實時更新：</span>
                <span className="text-gray-600 font-mono">2024-05-21 14:30</span>
                <button className="p-1 rounded hover:bg-gray-100 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 min-h-[260px] flex flex-wrap content-start items-center justify-center gap-x-4 gap-y-3">
              {wordCloud.map((w, i) => (
                <span key={i} className={w.cls}>{w.text}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: 推薦選題 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-[14.5px] font-bold text-gray-900 mb-3">為你推薦的爆款選題</h2>

            {/* Tabs + Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-3">
              <div className="flex border-b border-gray-100">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={
                      'py-2.5 mr-5 text-[13px] -mb-px border-b-2 transition-all ' +
                      (activeTab === t.id
                        ? 'text-violet-600 border-violet-600 font-semibold'
                        : 'text-gray-400 border-transparent hover:text-gray-600')
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="appearance-none text-[11.5px] border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                  >
                    <option>全部平台</option><option>YouTube</option><option>抖音</option><option>B站</option><option>小紅書</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="appearance-none text-[11.5px] border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                  >
                    <option>近7天</option><option>近30天</option><option>近90天</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-3 text-[11px] text-gray-400 px-1 mb-1">
              <div className="col-span-5">數據表現</div>
              <div className="col-span-1 text-center">推薦指數</div>
              <div className="col-span-1 text-center">熱度趨勢</div>
              <div className="col-span-1 text-center">互動量</div>
              <div className="col-span-4 pl-6">受眾心理預測</div>
            </div>
          </div>

          {/* Topic rows */}
          <div className="divide-y divide-gray-100">
            {sortedTopics.map((t, idx) => {
              const isApplied = appliedTopic === t.id
              const isExpanded = expandedId === t.id
              return (
                <div
                  key={t.id}
                  className={
                    'px-5 py-4 transition-colors group ' +
                    (isApplied ? 'bg-violet-50/60 ring-1 ring-inset ring-violet-200' : 'hover:bg-violet-50/30')
                  }
                >
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Rank + title */}
                    <div className="col-span-5 flex items-start gap-3">
                      <span className={
                        'w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0 mt-0.5 ' +
                        (idx === 0 ? 'bg-amber-100 text-amber-600' : idx < 3 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500')
                      }>{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-gray-800 leading-snug">{t.title}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {t.tags.map((tag, ti) => (
                            <span key={ti} className={'text-[10.5px] px-1.5 py-0.5 rounded border ' + tag.cls}>{tag.text}</span>
                          ))}
                        </div>
                        <div className={'text-[11.5px] text-gray-400 mt-1 ' + (isExpanded ? '' : 'line-clamp-1')}>{t.desc}</div>
                      </div>
                    </div>
                    {/* Score */}
                    <div className="col-span-1 text-center">
                      <div className="text-[13px] font-bold text-gray-800">{t.score}</div>
                      <div className="flex justify-center mt-0.5 text-[10px]">{renderStars(t.score)}</div>
                    </div>
                    {/* Trend */}
                    <div className="col-span-1 text-center">
                      <div className="text-[13px] font-semibold text-emerald-600">{t.trend}w</div>
                      <TrendingUp className="w-3 h-3 text-emerald-500 mx-auto mt-0.5" />
                    </div>
                    {/* Interaction */}
                    <div className="col-span-1 text-center">
                      <div className="text-[13px] font-semibold text-gray-800">{t.interaction}w</div>
                      <TrendingUp className="w-3 h-3 text-emerald-500 mx-auto mt-0.5" />
                    </div>
                    {/* Prediction + actions */}
                    <div className="col-span-4 flex items-center gap-2">
                      <div className={'min-w-0 flex-1 text-[11.5px] text-gray-500 leading-relaxed ' + (isExpanded ? '' : 'line-clamp-2')}>{t.prediction}</div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors whitespace-nowrap"
                      >
                        {isExpanded ? '收起' : '查看詳情'}
                      </button>
                      <button
                        onClick={() => setAppliedTopic(isApplied ? null : t.id)}
                        className={
                          'shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap shadow-sm shadow-violet-200/40 transition-all ' +
                          (isApplied
                            ? 'bg-violet-100 text-violet-700 flex items-center gap-1'
                            : 'text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110')
                        }
                      >
                        {isApplied ? (<><Check className="w-3.5 h-3.5" /> 已適用</>) : '適用此題'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-4 text-center text-[12px] text-gray-400 border-t border-gray-50">沒有更多數據了 ~</div>
        </div>
      </div>
    </div>
  )
}
