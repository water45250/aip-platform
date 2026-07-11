import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Send, ChevronLeft, ChevronRight, Search, CheckCircle2,
  Clock, FileVideo, Plus, AlertCircle, Info, Upload, Eye,
} from 'lucide-react'

// ============ 平台数据 ============
interface Platform {
  id: string
  name: string
  icon: string // emoji for now
  color: string
  authorized: boolean
}

const PLATFORMS: Platform[] = [
  { id: 'douyin',    name: '抖音',    icon: '🎵', color: '#000000', authorized: true },
  { id: 'wechat_mp', name: '微信公众号', icon: '💬', color: '#07C160', authorized: true },
  { id: 'shipinhao', name: '视频号',   icon: '✖️', color: '#FA9D3B', authorized: true },
  { id: 'weibo',     name: '微博',     icon: '🔴', color: '#E6162D', authorized: true },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', color: '#FE2C55', authorized: true },
  { id: 'zhihu',     name: '知乎',     icon: '💙', color: '#0084FF', authorized: false },
  { id: 'bilibili',  name: 'B站',      icon: '📺', color: '#FB7299', authorized: true },
  { id: 'toutiao',   name: '头条号',   icon: '📰', color: '#F85959', authorized: true },
  { id: 'kuaishou',  name: '快手',     icon: '⚡', color: '#FF4906', authorized: false },
  { id: 'baijiahao', name: '百家号',   icon: '📝', color: '#333333', authorized: false },
]

// ============ 作品数据 ============
interface Work {
  id: string
  title: string
  subtitle: string
  type: string
  duration: string
  updatedAt: string
  thumb: string // placeholder gradient
}

const WORKS: Work[] = [
  { id: 'w1', title: '旅行的意义', subtitle: '| 川西之旅', type: 'vlog', duration: '02:45', updatedAt: '2024-05-21', thumb: 'from-blue-400 to-cyan-300' },
  { id: 'w2', title: '咖啡时光', subtitle: '| 探店短视频', type: '生活记录', duration: '00:55', updatedAt: '2024-05-20', thumb: 'from-amber-600 to-orange-400' },
  { id: 'w3', title: '焕活肌肤之美', subtitle: '| 护肤品推广', type: '产品推广', duration: '01:15', updatedAt: '2024-05-19', thumb: 'from-pink-400 to-rose-300' },
  { id: 'w4', title: 'AI發展趨勢解析', subtitle: '', type: '知識分享', duration: '03:16', updatedAt: '2024-05-18', thumb: 'from-indigo-600 to-violet-500' },
  { id: 'w5', title: '家常美味', subtitle: '| 番茄鸡蛋面', type: '美食教程', duration: '01:08', updatedAt: '2024-05-17', thumb: 'from-yellow-400 to-orange-400' },
]

const STEPS = ['選擇內容', '選擇平台', '內容設置', '發布設置', '確認發布']

export default function PublishPage() {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [selectedWorks, setSelectedWorks] = useState<string[]>(['w1'])
  const [workSearch, setWorkSearch] = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState('全部類型')

  // Step 2 state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    PLATFORMS.filter(p => p.authorized).map(p => p.id)
  )

  // Step 3 state
  const [publishTitle, setPublishTitle] = useState('旅行的意义 | 川西之旅')
  const [publishDesc, setPublishDesc] = useState('')
  const [publishTags, setPublishTags] = useState(['旅行', 'vlog', '川西'])
  const [tagInput, setTagInput] = useState('')

  // Step 4 state
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduleTime, setScheduleTime] = useState('')

  // Step 5 state
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)

  const selectedWorkCount = selectedWorks.length
  const authorizedCount = PLATFORMS.filter(p => p.authorized).length
  const totalCount = PLATFORMS.length

  function toggleWork(id: string) {
    setSelectedWorks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleAllPlatforms() {
    if (selectedPlatforms.length === authorizedCount) {
      setSelectedPlatforms([])
    } else {
      setSelectedPlatforms(PLATFORMS.filter(p => p.authorized).map(p => p.id))
    }
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !publishTags.includes(t)) {
      setPublishTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  function removeTag(t: string) {
    setPublishTags(prev => prev.filter(x => x !== t))
  }

  // ========== Step Header ==========
  function StepHeader() {
    return (
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((s, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={
                'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12.5px] font-medium ' +
                (active ? 'bg-violet-50 border-violet-300 text-violet-700' :
                 done ? 'bg-green-50 border-green-200 text-green-600' :
                 'bg-white border-gray-200 text-gray-400')
              }>
                <span className={
                  'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ' +
                  (active ? 'bg-violet-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-100')
                }>{done ? '✓' : n}</span>
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className={'w-4 h-4 shrink-0 ' + (done || active ? 'text-violet-300' : 'text-gray-200')} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ========== Step 1: 选择内容 ==========
  if (step === 1) {
    const filtered = WORKS.filter(w =>
      (!workSearch || w.title.includes(workSearch) || w.subtitle.includes(workSearch)) &&
      (workTypeFilter === '全部類型' || w.type === workTypeFilter)
    )
    return (
      <div className="p-6">
        <div className="max-w-[1280px] mx-auto space-y-5">
          {/* 面包屑 */}
          <div className="flex items-center justify-between">
            <Link to="/smart-editing" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 一鍵發布
            </Link>
            <button className="text-[12.5px] font-medium text-white bg-violet-600 rounded-lg px-4 py-1.5 hover:bg-violet-700 flex items-center gap-1.5 disabled:opacity-40"
              disabled={selectedWorkCount === 0} onClick={() => setStep(2)}>
              下一步 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <h1 className="text-xl font-bold text-gray-900">一鍵發布</h1>
          <p className="text-sm text-gray-500">將您的內容一鍵發佈到多個平台，高效觸達更多觀眾</p>

          <StepHeader />

          <div className="rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            {/* 搜索与筛选 */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input value={workSearch} onChange={e=>setWorkSearch(e.target.value)} placeholder="搜索作品名称" className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400" />
              </div>
              <select value={workTypeFilter} onChange={e=>setWorkTypeFilter(e.target.value)}
                className="text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-white">
                <option>全部類型</option><option>vlog</option><option>生活記錄</option><option>產品推廣</option><option>知識分享</option><option>美食教程</option>
              </select>
            </div>

            {/* 作品列表 */}
            <div className="space-y-2.5">
              {filtered.map(w => {
                const sel = selectedWorks.includes(w.id)
                return (
                  <label key={w.id} className={'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ' + (sel ? 'border-violet-400 bg-violet-50/50' : 'border-gray-100 hover:border-gray-200')}>
                    <input type="checkbox" checked={sel} onChange={()=>toggleWork(w.id)} className="w-4.5 h-4.5 accent-violet-600 rounded cursor-pointer" />
                    <div className={'w-28 h-16 rounded-lg shrink-0 bg-gradient-to-br ' + w.thumb + ' flex items-center justify-center'}>
                      <FileVideo className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-gray-800 truncate">{w.title}<span className="font-normal text-gray-500">{w.subtitle}</span></div>
                      <div className="mt-1 flex items-center gap-3 text-[11.5px] text-gray-400">
                        <span>{w.type}</span><Clock className="w-3 h-3" /><span>{w.duration}</span><span>更新于 {w.updatedAt}</span>
                      </div>
                    </div>
                  </label>
                )
              })}
              {filtered.length === 0 && (
                <div className="py-10 text-center text-[13px] text-gray-400">没有匹配的作品</div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[13px] text-gray-600">已选择 <span className="font-bold text-violet-600">{selectedWorkCount}</span> 个作品</div>
              {selectedWorkCount > 0 && (
                <button onClick={() => setSelectedWorks([])} className="text-[12.5px] text-violet-600 hover:text-violet-700">清空选择</button>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setStep(2)} disabled={selectedWorkCount === 0} className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700 disabled:opacity-40">
                下一步 <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 2: 选择平台 ==========
  if (step === 2) {
    return (
      <div className="p-6">
        <div className="max-w-[1280px] mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <Link to="/smart-editing" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 一鍵發布
            </Link>
            <button onClick={() => window.open('#','_blank')} className="text-[12.5px] text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> 發布記錄</button>
          </div>

          <h1 className="text-xl font-bold text-gray-900">一鍵發布</h1>
          <p className="text-sm text-gray-500">將您的內容一鍵發佈到多個平台，高效觸達更多觀眾</p>

          <StepHeader />

          {/* 三栏布局 */}
          <div className="grid grid-cols-12 gap-5">
            {/* 左：选择内容 */}
            <div className="col-span-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-gray-300" />
                <input value={workSearch} onChange={e=>setWorkSearch(e.target.value)} placeholder="搜索作品名称" className="flex-1 text-[12.5px] border border-gray-200 rounded-lg pl-2 pr-3 py-2 focus:outline-none focus:border-violet-400" />
                <select className="text-[12.5px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-violet-400 bg-white appearance-none pr-7 bg-no-repeat bg-[right_6px_center]"
                  style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3e%3cpath d='M1 3l4 4 4-4' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3e%3c/svg%3e")`}}>
                  <option>全部類型</option>
                </select>
              </div>
              <div className="space-y-2">
                {WORKS.map(w => {
                  const sel = selectedWorks.includes(w.id)
                  return (
                    <label key={w.id} className={'flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ' + (sel ? 'border-violet-400 bg-violet-50/50' : 'border-gray-100 hover:border-gray-200')}>
                      <input type="checkbox" checked={sel} onChange={()=>toggleWork(w.id)} className="w-4 h-4 accent-violet-600 rounded cursor-pointer shrink-0" />
                      <div className={'w-24 h-14 rounded-lg shrink-0 bg-gradient-to-br ' + w.thumb + ' flex items-center justify-center'}>
                        <FileVideo className="w-4 h-4 text-white/80" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-gray-800 truncate">{w.title}<span className="font-normal text-gray-500">{w.subtitle}</span></div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400"><Clock className="w-3 h-3" /><span>{w.duration}</span><span>更新于 {w.updatedAt}</span></div>
                      </div>
                    </label>
                  )
                })}
              </div>
              <div className="flex items-center justify-between pt-1 text-[12.5px]">
                <span className="text-gray-600">已选择 <span className="font-bold text-violet-600">{selectedWorkCount}</span> 个作品</span>
                <button onClick={() => setSelectedWorks([])} className="text-violet-600 hover:text-violet-700">清空选择</button>
              </div>
            </div>

            {/* 中：选择发布平台 */}
            <div className="col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold text-gray-800">选择发布平台</div>
                  <div className="text-[11.5px] text-gray-400 mt-0.5">已选择 {selectedPlatforms.length}/{authorizedCount} 个平台</div>
                </div>
                <button onClick={toggleAllPlatforms} className="text-[12px] text-violet-600 hover:text-violet-700 font-medium">{selectedPlatforms.length === authorizedCount && selectedPlatforms.every(p => PLATFORMS.find(pl=>pl.id===p)?.authorized) ? '取消全选' : '全选'}</button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {PLATFORMS.map(p => {
                  const sel = selectedPlatforms.includes(p.id)
                  return (
                    <button key={p.id} onClick={() => p.authorized && togglePlatform(p.id)}
                      disabled={!p.authorized}
                      className={'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ' +
                        (sel ? 'border-violet-400 bg-violet-50/60' : 'border-gray-100 hover:border-gray-200') +
                        (!p.authorized ? ' opacity-50 cursor-not-allowed' : '')
                      }>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{backgroundColor:p.color+'15'}}>
                        <span>{p.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-gray-800">{p.name}</div>
                        <div className="text-[11px] mt-0.5">{p.authorized ? '已授权' : '未授权'}</div>
                      </div>
                      <div className="shrink-0">
                        {sel ? (
                          <CheckCircle2 className="w-5 h-5 text-violet-500" />
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-200" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              <button className="w-full py-2.5 border border-dashed border-violet-300 rounded-xl text-[12.5px] text-violet-600 hover:bg-violet-50/50 font-medium flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> 添加自定義平台
              </button>
            </div>

            {/* 右：平台授权状态 */}
            <div className="col-span-3 space-y-4">
              <div className="text-[14px] font-bold text-gray-800">平台授權狀態</div>
              <div className="flex flex-col items-center py-4">
                {/* 圆形进度 */}
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#7c3aed" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${(authorizedCount / totalCount) * 364.4} ${364.4}`}
                    transform="rotate(-90 70 70)" />
                </svg>
                <div className="-mt-[105px] flex flex-col items-center">
                  <div className="text-[12px] text-gray-400">已授權平台</div>
                  <div className="text-[32px] font-bold text-gray-900 leading-none mt-0.5">{authorizedCount} <span className="text-base text-gray-400 font-normal">/ {totalCount}</span></div>
                </div>
              </div>
              <div className="space-y-2 px-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> 已授權</span>
                  <span className="font-medium text-gray-800">{authorizedCount}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> 未授權</span>
                  <span className="font-medium text-gray-800">{totalCount - authorizedCount}</span>
                </div>
              </div>
              <button className="w-full mt-2 text-[12.5px] text-violet-600 hover:text-violet-700 font-medium py-2">賬號管理</button>
            </div>
          </div>

          {/* 温馨提示 + 底部按钮 */}
          <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-4 flex items-start gap-2.5">
            <Info className="w-4.5 h-4.5 text-violet-500 shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-gray-600 leading-relaxed">
              <span className="font-medium text-violet-700">溫馨提示</span><br/>
              請確保您的各平台賬號狀態正常，發布內容需遵守各平台規範，避免違規導致發佈失敗。
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-5 py-2 hover:bg-gray-50">
              保存為模板
            </button>
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-5 py-2 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> 上一步
            </button>
            <button onClick={() => setStep(3)} disabled={selectedWorkCount === 0 || selectedPlatforms.length === 0}
              className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700 disabled:opacity-40">
              下一步 <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 3: 内容设置 ==========
  if (step === 3) {
    return (
      <div className="p-6">
        <div className="max-w-[960px] mx-auto space-y-5">
          <StepHeader />
          <div className="rounded-xl bg-white border border-gray-100 p-6 space-y-5">
            <h3 className="text-[15px] font-bold text-gray-800">內容設置</h3>

            <div className="space-y-1.5">
              <label className="text-[12.5px] text-gray-500 font-medium">標題</label>
              <input value={publishTitle} onChange={e=>setPublishTitle(e.target.value)}
                className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-400" />
              <div className="text-[11px] text-gray-400 text-right">{publishTitle.length}/60</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] text-gray-500 font-medium">描述</label>
              <textarea value={publishDesc} onChange={e=>setPublishDesc(e.target.value)} rows={3}
                placeholder="為您的作品添加一段簡短描述，吸引更多觀眾..."
                className="w-full text-[13.5px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-400 resize-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] text-gray-500 font-medium">標籤</label>
              <div className="flex items-center gap-2 flex-wrap">
                {publishTags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 text-[12px] bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1">
                    #{t}
                    <button onClick={() => removeTag(t)} className="hover:text-violet-900">&times;</button>
                  </span>
                ))}
                <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTag()}}}
                  placeholder="輸入標籤後回車添加" className="flex-1 min-w-[160px] text-[12.5px] border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-violet-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px] text-gray-500 font-medium">封面圖片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-[12.5px] text-gray-500">點擊上傳或拖拽封面</div>
                  <div className="text-[11px] text-gray-400 mt-1">建議尺寸 1920×1080，支持 JPG/PNG</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12.5px] text-gray-500 font-medium">預覽</label>
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 h-[152px] flex items-center justify-center text-[12.5px] text-gray-400">
                  封面預覽區域
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-5 py-2 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> 上一步</button>
              <button onClick={() => setStep(4)} className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700">下一步 <ArrowRight className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 4: 发布设置 ==========
  if (step === 4) {
    return (
      <div className="p-6">
        <div className="max-w-[720px] mx-auto space-y-5">
          <StepHeader />
          <div className="rounded-xl bg-white border border-gray-100 p-6 space-y-5">
            <h3 className="text-[15px] font-bold text-gray-800">發布設置</h3>

            <div className="space-y-3">
              <label className="text-[12.5px] text-gray-500 font-medium">發布時間</label>
              <div className="flex items-center gap-4">
                {[{k:'now',l:'立即發佈'},{k:'schedule',l:'定時發佈'}].map(m => (
                  <button key={m.k} onClick={() => setScheduleMode(m.k as any)}
                    className={'flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ' +
                      (scheduleMode === m.k ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
                    <div className={'w-4 h-4 rounded-full border-2 flex items-center justify-center ' + (scheduleMode === m.k ? 'border-violet-500' : 'border-gray-300')}>
                      {scheduleMode === m.k && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                    </div>
                    {m.l}
                  </button>
                ))}
              </div>
              {scheduleMode === 'schedule' && (
                <input type="datetime-local" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)}
                  className="text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 ml-6" />
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[12.5px] text-gray-500 font-medium">高級選項</label>
              <div className="space-y-2.5">
                {[
                  { label: '自動生成各平台適配文案', desc: '根據各平台特性自動調整標題、描述長度與風格', defaultChecked: true },
                  { label: '啟用互動引導', desc: '在視頻結尾添加關注、點贊、評論引導畫面', defaultChecked: true },
                  { label: '發布後通知我', desc: '所有平台完成發送或失敗時推送通知提醒', defaultChecked: false },
                ].map((opt,i) => (
                  <label key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer">
                    <input type="checkbox" defaultChecked={opt.defaultChecked} className="mt-0.5 w-4 h-4 accent-violet-600 rounded" />
                    <div>
                      <div className="text-[13px] font-medium text-gray-800">{opt.label}</div>
                      <div className="text-[11.5px] text-gray-400 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-5 py-2 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> 上一步</button>
              <button onClick={() => setStep(5)} className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700">下一步 <ArrowRight className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 5: 确认发布 ==========
  return (
    <div className="p-6">
      <div className="max-w-[960px] mx-auto space-y-5">
        <StepHeader />

        {!isPublishing && publishProgress >= 100 ? (
          /* 发布成功 */
          <div className="rounded-xl bg-white border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">發佈成功！</h2>
            <p className="text-sm text-gray-500 mb-6">您的內容已成功推送到 {selectedPlatforms.length} 個平台，可在「發布記錄」中查看詳情。</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => { setIsPublishing(false); setPublishProgress(0); setStep(1); }}
                className="text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700">
                繼續發佈新內容
              </button>
              <Link to="/final-preview" className="text-[13px] font-medium text-violet-600 border border-violet-200 rounded-xl px-5 py-2 hover:bg-violet-50">
                查看發布記錄
              </Link>
            </div>
          </div>
        ) : !isPublishing ? (
          /* 确认页 */
          <div className="rounded-xl bg-white border border-gray-100 p-6 space-y-5">
            <h3 className="text-[15px] font-bold text-gray-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-violet-500" /> 確認並發佈</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <div className="text-[11.5px] text-gray-400">待發佈作品</div>
                <div className="text-[14px] font-bold text-gray-800 mt-1">{selectedWorkCount} 個</div>
                <div className="text-[11.5px] text-gray-500 mt-0.5">{WORKS.find(w=>selectedWorks.includes(w.id))?.title ?? ''}</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <div className="text-[11.5px] text-gray-400">目標平台</div>
                <div className="text-[14px] font-bold text-gray-800 mt-1">{selectedPlatforms.length} 個</div>
                <div className="text-[11.5px] text-gray-500 mt-0.5">{selectedPlatforms.map(pid=>PLATFORMS.find(p=>p.id===pid)?.name).filter(Boolean).join(' / ')}</div>
              </div>
              <div className="p-4 rounded-xl bg-violet-50">
                <div className="text-[11.5px] text-violet-500">發佈時間</div>
                <div className="text-[14px] font-bold text-violet-700 mt-1">{scheduleMode==='now'?'立即':scheduleTime||'未設定'}</div>
                <div className="text-[11.5px] text-violet-500 mt-0.5">{publishTags.join(' #')}</div>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[12.5px] text-amber-800 leading-relaxed">
                發佈後將同時推送到 {selectedPlatforms.length} 個平台。請確保各平台賬號狀態正常且內容符合平台規範。
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setStep(4)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-5 py-2 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> 上一步</button>
              <button onClick={() => { setIsPublishing(true); setPublishProgress(0); const t=setInterval(()=>{ setPublishProgress(p=>{ if(p>=100){clearInterval(t);return 100;} return p+Math.max(1,Math.random()*4) }) },150) }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-6 py-2.5 hover:bg-violet-700">
                <Send className="w-4 h-4" /> 確認發佈
              </button>
            </div>
          </div>
        ) : (
          /* 发布中 */
          <div className="rounded-xl bg-white border border-gray-100 p-10 text-center">
            <div className="w-20 h-20 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mx-auto mb-6"></div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">正在發佈中...</h2>
            <div className="text-sm text-gray-500 mb-4">正在同步推送到 {selectedPlatforms.length} 個平台</div>
            <div className="max-w-xs mx-auto">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300" style={{width:`${publishProgress}%`}}></div>
              </div>
              <div className="text-[12px] text-gray-400 mt-2">{Math.round(publishProgress)}% 完成</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* Helper: ArrowRight icon inline */
function ArrowRight({className=''}:{className?:string}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}
