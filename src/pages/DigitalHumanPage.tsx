import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot, Play, Check, ChevronLeft, ChevronRight, ArrowRight,
  FileText, Mic, Image, Sparkles, Wand2, Clock, Coins,
  UserCircle, Upload, CheckCircle2, ChevronDown,
  Plus, Loader2, AlertCircle, Film, RefreshCw,
} from 'lucide-react'
import { sampleProject } from '../lib/openmontage-schema'

/* ============ API 基址 ============
 * 前端掛在 www.bigwhale.top，aip-core(FastAPI) 經 Nginx 的 /aip 前綴反代到 8080，
 * 且 /aip 前綴會被剝離，故公網路徑為 /aip/api/...（不是 /api/...，/api 指向 Laravel）。
 */
const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL ?? '/aip'

// ============ mock 數據（平臺預設數字人形象，作爲風格預設；真實面部以用戶上傳肖像照為準） ============

const AVATARS = [
  { id: 'dh1',  name: '知性女主播',     gender: '女', style: '專業', tag: '熱門' },
  { id: 'dh2',  name: '商務男主播',     gender: '男', style: '商務', tag: '熱門' },
  { id: 'dh3',  name: '親和女主播',     gender: '女', style: '親和', tag: '熱門' },
  { id: 'dh4',  name: '年輕活力女',     gender: '女', style: '活力', tag: '' },
  { id: 'dh5',  name: '沉穩男主播',     gender: '男', style: '沉穩', tag: '' },
  { id: 'dh6',  name: '科技感女聲',     gender: '女', style: '科技', tag: '專業' },
  { id: 'dh7',  name: '溫柔治癒女',     gender: '女', style: '溫柔', tag: '溫馨' },
  { id: 'dh8',  name: '時尚男主播',     gender: '男', style: '時尚', tag: '時尚' },
  { id: 'dh9',  name: '知識講解女',     gender: '女', style: '知性', tag: '教育' },
  { id: 'dh10', name: '新聞女主播',     gender: '女', style: '新聞', tag: '' },
  { id: 'dh11', name: '全齡男專家',     gender: '男', style: '全齡', tag: '' },
]

type Voice = { id: string; name: string; desc: string }

// 兜底音色（/api/voices 失敗時使用，僅保證頁面可用）
const FALLBACK_VOICES: Voice[] = [
  { id: 'FunAudioLLM/CosyVoice2-0.5B:alex', name: '沉穩男聲 (CosyVoice2)', desc: '男 · siliconflow_preset' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:anna', name: '沉穩女聲 (CosyVoice2)', desc: '女 · siliconflow_preset' },
]

// 服裝選項（設計稿）
const OUTFITS = ['outfit-1', 'outfit-2', 'outfit-3', 'outfit-4', 'outfit-5']
// 背景選項（含自定義）
const BACKGROUNDS = ['bg-custom', 'bg-1', 'bg-2', 'bg-3', 'bg-4']
// 畫面風格（映射到 WaveSpeed hunyuan-avatar 的 prompt）
const VISUAL_STYLES = [
  { key: 'natural', label: '自然真實' },
  { key: 'cinema', label: '電影質感' },
  { key: 'fresh',   label: '清新明亮' },
  { key: 'tech',    label: '科技感' },
  { key: 'warm',    label: '溫暖柔和' },
]
const VISUAL_PROMPTS: Record<string, string> = {
  natural: '自然真實，清晰正面，自然的表情與唇形同步',
  cinema: '電影質感，光影細膩，電影級畫面',
  fresh: '清新明亮，乾淨通透的畫面',
  tech: '科技感，冷色調，未來感風格',
  warm: '溫暖柔和，暖色調，親和氛圍',
}
// 鏡頭選項
const SHOT_TYPES = ['特寫', '近景', '中景', '全景', '大全景']
const ANGLES = ['正面', '側面', '斜側', '俯拍', '仰拍']
const POSITIONS = ['居中', '左偏', '右偏', '上偏', '下偏']

// 計費（估算，僅供頁面展示）
const RATE_PER_MIN = 0.8 // ¥/分鐘

function estimateMinutes(text: string): number {
  return Math.max(0.5, text.replace(/\s/g, '').length / 240)
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const visualStyleToPrompt = (k: string): string => VISUAL_PROMPTS[k] ?? ''

const STEPS = ['數字人選擇', '腳本 & 聲音', '場景 & 畫面', '生成視頻']
const DEFAULT_SCRIPT = sampleProject.sections.map((s) => s.text).join('\n\n')

export default function DigitalHumanPage() {
  const [step, setStep] = useState(1)
  const [avatarId, setAvatarId] = useState<string>('dh1')
  const [voiceId, setVoiceId] = useState<string>('')
  const [script, setScript] = useState<string>(DEFAULT_SCRIPT)

  // Step 1 篩選與配置狀態
  const [tab, setTab] = useState<'mine' | 'platform'>('platform')
  const [genderFilter, setGenderFilter] = useState('全部')
  const [styleFilter, setStyleFilter] = useState('全部風情')
  const [sceneFilter, setSceneFilter] = useState('全部場景')
  const [ratio, setRatio] = useState('9:16') // 豎版默認
  const [previewTab, setPreviewTab] = useState<'look' | 'action'>('look')
  const [selectedOutfit, setSelectedOutfit] = useState(0)
  const [selectedBg, setSelectedBg] = useState(1)
  const [visualStyle, setVisualStyle] = useState('natural')
  const [shotType, setShotType] = useState('中景')
  const [angle, setAngle] = useState('正面')
  const [position, setPosition] = useState('居中')
  const [autoMatch, setAutoMatch] = useState(true)

  // 聲音列表（真實音色，來自 aip-core /api/voices）
  const [voices, setVoices] = useState<Voice[]>(FALLBACK_VOICES)
  const [voicesLoading, setVoicesLoading] = useState(true)

  // 肖像照（必填，作爲 hunyuan-avatar 的 image 輸入）
  const [portraitFile, setPortraitFile] = useState<File | null>(null)
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null)
  const portraitInputRef = useRef<HTMLInputElement>(null)

  // 生成參數
  const [resolution, setResolution] = useState<'480p' | '720p'>('480p')

  // Step 4 生成狀態
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [genTaskId, setGenTaskId] = useState<string | null>(null)
  const [genError, setGenError] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  const avatar = AVATARS.find((a) => a.id === avatarId)!
  const voice = voices.find((v) => v.id === voiceId) ?? voices[0]
  const minutes = estimateMinutes(script)
  const estCost = +(minutes * RATE_PER_MIN).toFixed(2)

  const filteredAvatars = AVATARS.filter((a) =>
    (genderFilter === '全部' || a.gender === genderFilter)
  )

  // ===== 載入真實音色列表 =====
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/voices`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled && Array.isArray(data.voices) && data.voices.length) {
          const mapped: Voice[] = data.voices.map((v: any) => ({
            id: v.id,
            name: v.name,
            desc: [v.gender, v.type].filter(Boolean).join(' · '),
          }))
          setVoices(mapped)
          const def = data.voices.find((v: any) => v.default) || data.voices[0]
          if (def?.id) setVoiceId(def.id)
        }
      } catch {
        /* 保留兜底音色 */
      } finally {
        if (!cancelled) setVoicesLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ===== 釋放肖像預覽 ObjectURL =====
  useEffect(() => () => {
    if (portraitPreview) URL.revokeObjectURL(portraitPreview)
  }, [portraitPreview])

  const onPortraitChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPortraitFile(f)
    setPortraitPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    if (genError) setGenError('')
  }

  // ===== 真實生成流程：voice/test 合成音頻 -> digital-human-p0/generate -> 輪詢 task =====
  function finalizeVideoUrl(raw: string): string {
    if (!raw) return ''
    return raw.startsWith('http') ? raw : `${API_BASE}${raw}`
  }

  async function handleGenerate() {
    if (isGenerating) return
    if (!portraitFile) { setGenError('請先上傳肖像照（數字人面部）'); return }
    if (!script.trim()) { setGenError('請先填寫腳本內容'); return }
    if (!voiceId) { setGenError('請先選擇聲音'); return }

    setGenError(''); setVideoUrl(''); setProgress(0); setIsGenerating(true)
    try {
      // 1) 語音合成：腳本文本 + 選中音色 -> 旁白音頻（audio/mpeg 字節流）
      const vres = await fetch(`${API_BASE}/api/voice/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: voiceId, text: script }),
      })
      if (!vres.ok) {
        let detail = `語音合成失敗 (${vres.status})`
        try { const j = await vres.json(); if (j?.detail) detail = j.detail } catch { /* ignore */ }
        throw new Error(detail)
      }
      const audioBlob = await vres.blob()

      // 2) 提交數字人生成：肖像圖(image) + 旁白音頻(audio) -> task_id
      const fd = new FormData()
      fd.append('image', portraitFile)
      fd.append('audio', audioBlob, 'narration.mp3')
      fd.append('resolution', resolution)
      const prompt = visualStyleToPrompt(visualStyle)
      if (prompt) fd.append('prompt', prompt)
      const gres = await fetch(`${API_BASE}/api/digital-human-p0/generate`, {
        method: 'POST',
        body: fd,
      })
      if (!gres.ok) {
        let detail = `提交生成失敗 (${gres.status})`
        try { const j = await gres.json(); if (j?.detail) detail = j.detail } catch { /* ignore */ }
        throw new Error(detail)
      }
      const gj = await gres.json()
      const taskId: string = gj.task_id
      setGenTaskId(taskId)

      // 3) 輪詢任務狀態，直到 done / failed
      const start = Date.now()
      const estSec = Math.max(5, estimateMinutes(script) * 60)
      for (;;) {
        await sleep(3000)
        const r = await fetch(`${API_BASE}/api/digital-human-p0/task/${taskId}`)
        const d = await r.json().catch(() => ({}) as any)
        if (d.status === 'done') {
          setVideoUrl(finalizeVideoUrl(d.video_url || ''))
          setProgress(100); setIsGenerating(false); break
        }
        if (d.status === 'failed') throw new Error(d.error || '生成失敗')
        const elapsed = (Date.now() - start) / 1000
        setProgress(Math.min(95, Math.round((elapsed / estSec) * 100)))
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : '生成失敗，請重試')
      setIsGenerating(false)
    }
  }

  // ============ Step 1: 數字人選擇（三欄佈局）============
  if (step === 1) {
    return (
      <div className="p-6">
        <div className="max-w-[1280px] mx-auto space-y-5">
          {/* 麪包屑 */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Link to="/voice-clone" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
                <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 數字人視頻
              </Link>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-500" /> 數字人視頻
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-[12px] text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">保存草稿</button>
              <Link to="/script-creation" className="text-[12.5px] font-medium text-white bg-violet-600 rounded-lg px-4 py-1.5 hover:bg-violet-700 flex items-center gap-1.5">
                下一步：腳本 & 聲音 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 步驟條 */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const n = i + 1
              const active = n === step
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12.5px] font-medium ' +
                    (active ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-gray-200 text-gray-400')}>
                    <span className={'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ' + (active ? 'bg-violet-600 text-white' : 'bg-gray-100')}>{n}</span>
                    {s}
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
                </div>
              )
            })}
          </div>

          {/* 三欄主體 */}
          <div className="grid grid-cols-12 gap-5">
            {/* ===== 左欄：篩選 + 數字人網格 ===== */}
            <div className="col-span-7 space-y-4">
              {/* 我的數字人 / 平臺數字人 tab */}
              <div>
                <h3 className="text-[14px] font-bold text-gray-800 mb-2">選擇數字人</h3>
                <div className="inline-flex rounded-xl bg-white border border-gray-200 p-0.5">
                  {[{k:'mine',l:'我的數字人'}, {k:'platform',l:'平臺數字人'}].map(t => (
                    <button key={t.k} onClick={() => setTab(t.k as any)}
                      className={'px-4 py-1.5 rounded-[10px] text-[12.5px] font-medium transition-all ' + (tab===t.k?'bg-violet-50 text-violet-600':'text-gray-500 hover:text-gray-700')}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 肖像照上傳（必填，作爲 hunyuan-avatar 的 image 輸入） */}
              <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-gray-800">肖像照（必填）</span>
                  <span className="text-[11px] text-gray-400">正面清晰照片，用於數字人面部</span>
                </div>
                {portraitPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={portraitPreview} alt="肖像" className="w-20 h-20 rounded-xl object-cover border border-violet-200" />
                    <div className="flex flex-col gap-2">
                      <span className="text-[12px] text-gray-600 truncate max-w-[220px]">{portraitFile?.name}</span>
                      <button onClick={() => portraitInputRef.current?.click()} className="text-[12px] text-violet-600 border border-violet-200 rounded-lg px-3 py-1 hover:bg-violet-50 w-fit">重新上傳</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => portraitInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-white py-6 text-violet-500 hover:bg-violet-50 transition-all">
                    <Upload className="w-7 h-7" />
                    <span className="text-[12.5px]">點擊上傳肖像照</span>
                    <span className="text-[11px] text-gray-400">JPG / PNG，建議正面、光線充足</span>
                  </button>
                )}
                <input ref={portraitInputRef} type="file" accept="image/*" className="hidden" onChange={onPortraitChange} />
              </div>

              {/* 篩選欄（下拉式）*/}
              <div className="flex items-center gap-3 flex-wrap">
                {/* 性別 */}
                <div className="space-y-1">
                  <div className="text-[10.5px] text-gray-400">性別</div>
                  <select value={genderFilter} onChange={(e)=>setGenderFilter(e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20d%3d%22M3%204.5h6M4.58.5L6%202m-2%204.5h6M4.5%208.5L6%207%22%2f%3e')] bg-no-repeat bg-[right_6px_center]">
                    <option>全部</option><option>女</option><option>男</option>
                  </select>
                </div>
                {/* 風情 */}
                <div className="space-y-1">
                  <div className="text-[10.5px] text-gray-400">風情</div>
                  <select value={styleFilter} onChange={(e)=>setStyleFilter(e.target.value)} className="text-[12px] border border-gray-200 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20d%3d%22M3%204.5h6M4.58.5L6%202m-2%204.5h6M4.5%208.5L6%207%22%2f%3e')] bg-no-repeat bg-[right_6px_center]">
                    <option>全部風情</option><option>專業</option><option>親和</option><option>活力</option><option>溫柔</option><option>時尚</option>
                  </select>
                </div>
                {/* 場景 */}
                <div className="space-y-1">
                  <div className="text-[10.5px] text-gray-400">場景</div>
                  <select value={sceneFilter} onChange={(e)=>setSceneFilter(e.target.value)} className="text-[12px] border border-gray-200 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20d%3d%22M3%204.5h6M4.58.5L6%202m-2%204.5h6M4.5%208.5L6%207%22%2f%3e')] bg-no-repeat bg-[right_6px_center]">
                    <option>全部場景</option><option>室內</option><option>戶外</option><option>演播室</option><option>書房</option>
                  </select>
                </div>
              </div>

              {/* 數字人卡片網格（3列）— 風格預設，實際面部以肖像照為準 */}
              <div className="grid grid-cols-3 gap-3">
                {filteredAvatars.map((a) => {
                  const sel = a.id === avatarId
                  return (
                    <button key={a.id} onClick={() => setAvatarId(a.id)}
                      className={'relative group rounded-xl overflow-hidden border-2 transition-all text-left bg-white ' + (sel ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-100 hover:border-violet-300 hover:shadow-sm')}>
                      {/* 頭像區域（模擬照片風格） */}
                      <div className="aspect-square bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center relative">
                        <UserCircle className="w-14 h-14 text-gray-300 group-hover:text-violet-300 transition-colors" />
                        {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                      </div>
                      {/* 信息區 */}
                      <div className="p-2.5 pb-3">
                        <div className="text-[13px] font-semibold text-gray-800">{a.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {a.tag && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">{a.tag}</span>}
                          <span className="text-[10.5px] text-gray-400">{a.style}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {/* 上傳我的肖像照（觸發同一個文件輸入） */}
                <button onClick={()=>portraitInputRef.current?.click()} className="rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 flex flex-col items-center justify-center aspect-[1/1] min-h-[140px] gap-2 text-gray-400 hover:text-violet-500 transition-all bg-white">
                  <Plus className="w-7 h-7" />
                  <div className="text-[11.5px] leading-tight text-center">上傳我的肖像照<br/><span className="text-gray-300">定製專屬數字人形象</span></div>
                </button>
              </div>

              {/* 分頁器 */}
              <div className="flex items-center justify-center gap-2 text-[12px] text-gray-400 pt-1">
                共 {filteredAvatars.length+1} 條
                <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="font-medium text-gray-600">1</span>
                <span className="text-gray-300">/</span>
                <span>2</span>
                <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronRight className="w-3.5 h-3.5" /></button>
                <span className="ml-2 text-[11px]">12 條/頁</span>
                <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              </div>
            </div>

            {/* ===== 右欄：預覽面板 ===== */}
            <div className="col-span-5 space-y-4">
              <h3 className="text-[14px] font-bold text-gray-800">數字人預覽</h3>

              {/* 視頻比例切換 */}
              <div className="flex items-center gap-2">
                {['9:16','16:9','1:1'].map(r => (
                  <button key={r} onClick={()=>setRatio(r)} className={'text-[12px] px-3 py-1 rounded-lg border transition-all ' + (ratio===r?'border-violet-400 bg-violet-50 text-violet-600':'border-gray-200 text-gray-500 hover:bg-gray-50')}>{r==='9:16'?'豎版':r==='16:9'?'橫版':'方版'} {r}
                </button>
              ))}
              </div>

              {/* 視頻/圖片預覽區 */}
              <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 ${ratio==='9:16'?'aspect-[9/16]':ratio==='16:9'?'aspect-video':'aspect-square'} flex items-center justify-center`}>
                {portraitPreview ? (
                  <img src={portraitPreview} alt="預覽" className="absolute inset-0 w-full h-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <UserCircle className={`text-gray-250 ${ratio!=='1:1'?'w-24 h-24':'w-28 h-28'}`} />
                  </div>
                )}
                {/* 播放控制條 */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="w-4 h-4 text-white cursor-pointer hover:text-violet-300" />
                    <div className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden cursor-pointer">
                      <div className="h-full w-1/4 bg-violet-500 rounded-full" />
                    </div>
                    <span className="text-[10.5px] text-white/80">00:08 / 00:20</span>
                    <ExpandIcon className="w-3.5 h-3.5 text-white/60" />
                  </div>
                </div>
              </div>

              {/* 形象設置 / 動作設置 tab */}
              <div className="flex items-center gap-2">
                {[{k:'look',l:'形象設置'},{k:'action',l:'動作設置'}].map(t=>(
                  <button key={t.k} onClick={()=>setPreviewTab(t.k as any)}
                    className={'text-[12.5px] px-3 py-1.5 rounded-lg transition-all ' + (previewTab===t.k?'bg-violet-50 text-violet-600 font-medium':'text-gray-500 hover:text-gray-700')}>
                    {t.l}
                  </button>
                ))}
              </div>

              {/* 服裝 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-gray-800">服裝</span>
                  <button className="text-[11px] text-gray-400 hover:text-violet-600">更多 &gt;</button>
                </div>
                <div className="flex items-center gap-2.5">
                  {OUTFITS.map((_, i) => (
                    <button key={i} onClick={()=>setSelectedOutfit(i)}
                      className={'w-12 h-12 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all bg-white ' + (selectedOutfit===i?'border-violet-500 ring-1 ring-violet-200':'border-gray-200 hover:border-violet-300')}>
                      <UserCircle className="w-7 h-7 text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 背景 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-gray-800">背景</span>
                  <button className="text-[11px] text-gray-400 hover:text-violet-600">更多 &gt;</button>
                </div>
                <div className="flex items-center gap-2.5">
                  {BACKGROUNDS.map((b, i) => (
                    <button key={b} onClick={()=>setSelectedBg(i)}
                      className={'w-16 h-10 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all bg-white ' + (selectedBg===i?'border-violet-500 ring-1 ring-violet-200':'border-gray-200 hover:border-violet-300')}>
                      {i===0 ? <><Upload className="w-4 h-4 text-gray-400"/><div className="text-[9px] text-gray-400 mt-[-2px]">自定義背景</div></> :
                       <Image className="w-5 h-5 text-gray-300" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 畫面風格 */}
              <div>
                <div className="text-[13px] font-medium text-gray-800 mb-2">畫面風格（映射到生成 prompt）</div>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map(s => (
                    <button key={s.key} onClick={()=>setVisualStyle(s.key)}
                      className={'text-[12px] px-3 py-1.5 rounded-full border transition-all ' + (visualStyle===s.key?'border-violet-400 bg-violet-50 text-violet-600':'border-gray-200 text-gray-600 hover:border-violet-300')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 其他設置 */}
              <div>
                <div className="text-[13px] font-medium text-gray-800 mb-2">其他設置</div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <div className="text-[10.5px] text-gray-400 mb-1">鏡頭景別</div>
                    <select value={shotType} onChange={(e)=>setShotType(e.target.value)}
                      className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20d%3d%22M3%204.5h6M4.58.5L6%202m-2%204.5h6M4.5%208.5L6%207%22%2f%3e')] bg-no-repeat bg-[right_4px_center]">
                      {SHOT_TYPES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-gray-400 mb-1">鏡頭角度</div>
                    <select value={angle} onChange={(e)=>setAngle(e.target.value)} className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20d%3d%22M3%204.5h6M4.58.5L6%202m-2%204.5h6M4.5%208.5L6%207%22%2f%3e')] bg-no-repeat bg-[right_4px_center]">
                      {ANGLES.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-gray-400 mb-1">人物位置</div>
                    <select value={position} onChange={(e)=>setPosition(e.target.value)} className="w-full text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20d%3d%22M3%204.5h6M4.58.5L6%202m-2%204.5h6M4.5%208.5L6%207%22%2f%3e')] bg-no-repeat bg-[right_4px_center]">
                      {POSITIONS.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2 text-[12px] text-gray-500">
                  自動匹配裝備
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" checked={autoMatch} onChange={(e)=>setAutoMatch(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 底部：當前選擇摘要 + 下一步按鈕 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-[12.5px] text-gray-500">當前選擇</span>
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                {portraitPreview
                  ? <img src={portraitPreview} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <UserCircle className="w-4 h-4 text-violet-600" />}
              </div>
              <div className="text-[13px] font-semibold text-gray-800">{avatar.name}</div>
              <span className="text-[11.5px] text-gray-400">風格：{avatar.style} · 場景：{sceneFilter.replace('全部','')} · 畫面風格：{VISUAL_STYLES.find(v=>v.key===visualStyle)?.label}</span>
              {portraitFile
                ? <span className="text-[11px] text-emerald-600">肖像照已上傳</span>
                : <span className="text-[11px] text-orange-500">待上傳肖像照</span>}
            </div>
            <button onClick={() => setStep(2)} className="text-[12.5px] font-medium text-white bg-violet-600 rounded-lg px-5 py-2 hover:bg-violet-700 flex items-center gap-1.5">
              下一步：腳本 & 聲音 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============ Step 2: 腳本 & 聲音 ============
  if (step === 2) {
    return (
      <div className="p-6">
        <div className="max-w-[1280px] mx-auto space-y-5">
          {/* 步驟條 */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const n = i + 1
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12.5px] font-medium ' + (n===step?'bg-violet-50 border-violet-300 text-violet-700':'bg-white border-gray-200 text-gray-400')}>
                    <span className={'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold '+(n===step?'bg-violet-600 text-white':'bg-gray-100')}>{n}</span>{s}
                  </div>
                  {i<STEPS.length-1 && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0"/>}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 腳本 */}
            <div className="rounded-xl bg-white border border-gray-100 p-5">
              <h3 className="text-[13px] font-bold text-gray-800 mb-1 flex items-center gap-1.5"><FileText className="w-4 h-4 text-violet-500" /> 腳本內容</h3>
              <p className="text-[11px] text-gray-400 mb-3">從「腳本創作」導入，或直接編輯下方文案（將作爲數字人旁白文本）</p>
              <textarea value={script} onChange={(e)=>setScript(e.target.value)} rows={14} className="w-full text-[12.5px] border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-violet-400 resize-none leading-relaxed"/>
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                <span>{script.replace(/\s/g,'').length} 字</span>
                <span>預估時長 {minutes.toFixed(1)} 分鐘</span>
              </div>
            </div>
            {/* 聲音 */}
            <div className="rounded-xl bg-white border border-gray-100 p-5">
              <h3 className="text-[13px] font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Mic className="w-4 h-4 text-violet-500" /> 選擇聲音</h3>
              <p className="text-[11px] text-gray-400 mb-3">使用「聲音克隆」中已克隆的聲音模型驅動數字人</p>
              {voicesLoading ? (
                <div className="flex items-center gap-2 text-[12px] text-gray-400 py-6">
                  <Loader2 className="w-4 h-4 animate-spin" /> 正在加載音色…
                </div>
              ) : (
                <div className="space-y-2.5">
                  {voices.map((v) => {
                    const sel=v.id===voiceId
                    return (
                      <button key={v.id} onClick={()=>setVoiceId(v.id)} className={'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all '+ (sel?'border-violet-500 bg-violet-50/40':'border-gray-100 hover:border-violet-300')}>
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center"><Mic className="w-5 h-5 text-violet-600"/></div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-gray-800">{v.name}</div>
                          <div className="text-[11px] text-gray-400">{v.desc}</div>
                        </div>
                        {sel && <Check className="w-4 h-4 text-violet-600"/>}
                      </button>
                    )
                  })}
                </div>
              )}
              <Link to="/voice-clone" className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-violet-600 border border-violet-200 rounded-lg py-2 hover:bg-violet-50">
                <Wand2 className="w-3.5 h-3.5" /> 去克隆更多聲音
              </Link>
            </div>
          </div>
          {/* 導航 */}
          <div className="flex items-center justify-between">
            <button onClick={()=>setStep(1)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> 上一步
            </button>
            <button onClick={()=>setStep(3)} className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700">
              下一步 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============ Step 3: 場景 & 畫面 ============
  if (step === 3) {
    return (
      <div className="p-6">
        <div className="max-w-[1280px] mx-auto space-y-5">
          <div className="flex items-center gap-2">
            {STEPS.map((s,i)=>{
              const n=i+1
              return (<div key={s} className="flex items-center gap-2 flex-1"><div className={'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12.5px] font-medium '+ (n===step?'bg-violet-50 border-violet-300 text-violet-700':'bg-white border-gray-200 text-gray-400')}><span className={'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold '+(n===step?'bg-violet-600 text-white':'bg-gray-100')}>{n}</span>{s}</div>{i<STEPS.length-1&&<ChevronRight className="w-4 h-4 text-gray-300 shrink-0"/>}</div>)
              })
            }
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white border border-gray-100 p-5">
              <h3 className="text-[13px] font-bold text-gray-800 mb-3"><Image className="w-4 h-4 text-violet-500 inline mr-1.5" /> 場景背景</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {BACKGROUNDS.slice(1).map((b,i)=>
                  <button key={b} onClick={()=>setSelectedBg(i+1)} className={'aspect-video rounded-xl border-2 flex items-center justify-center text-[12px] font-medium transition-all '+(selectedBg===i+1?'border-violet-500 bg-violet-50 text-violet-600':'border-gray-100 text-gray-500 hover:border-violet-300')}>{['書房','演播室','簡約白牆','城市夜景','自然戶外'][i]}</button>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-5">
              <h3 className="text-[13px] font-bold text-gray-800 mb-3"><Sparkles className="w-4 h-4 text-violet-500 inline mr-1.5" /> 畫面風格與參數</h3>
              <div className="mb-4">
                <div className="text-[11.5px] text-gray-400 mb-1.5">畫面風格（映射到生成 prompt）</div>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map(s=>
                    <button key={s.key} onClick={()=>setVisualStyle(s.key)} className={'text-[12.5px] px-3 py-2 rounded-full border transition-all '+(visualStyle===s.key?'bg-violet-600 text-white border-violet-600':'border-gray-200 text-gray-600 hover:bg-gray-50')}>{s.label}</button>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 text-[11.5px] text-gray-500 leading-relaxed">
                數字人視頻由 <span className="text-violet-600 font-medium">WaveSpeed Hunyuan Avatar</span> 雲端推理生成（肖像圖 + 語音 → 脣形同步 → 口播成片）。
              </div>
              <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100 text-[12.5px] text-gray-600 flex items-center gap-2">
                <Coins className="w-4 h-4 text-violet-500 shrink-0" />
                本次預估成本：<span className="font-bold text-violet-700">¥{estCost}</span> <span className="text-gray-400">（{minutes.toFixed(1)} 分鐘 × ¥{RATE_PER_MIN}/分）</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={()=>setStep(2)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> 上一步</button>
            <button onClick={()=>setStep(4)} className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-violet-600 rounded-xl px-5 py-2 hover:bg-violet-700">下一步 <ArrowRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
    )
  }

  // ============ Step 4: 生成視頻 ============
  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-5">
        <div className="flex items-center gap-2">
          {STEPS.map((s,i)=>{
            const n=i+1
            return (<div key={s} className="flex items-center gap-2 flex-1"><div className={'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12.5px] font-medium '+(n===step?'bg-violet-50 border-violet-300 text-violet-700':'bg-white border-gray-200 text-gray-400')}><span className={'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold '+(n===step?'bg-violet-600 text-white':'bg-gray-100')}>{n}</span>{s}</div>{i<STEPS.length-1&&<ChevronRight className="w-4 h-4 text-gray-300 shrink-0"/>}</div>)
            })
          }
        </div>

        <div className="rounded-xl bg-white border border-gray-100 p-6">
          <h3 className="text-[14px] font-bold text-gray-800 mb-4 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-violet-500" /> 確認並生成</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-gray-50"><div className="text-[11px] text-gray-400">數字人</div><div className="text-[13px] font-semibold text-gray-800">{avatar.name}</div></div>
            <div className="p-3 rounded-xl bg-gray-50"><div className="text-[11px] text-gray-400">聲音</div><div className="text-[13px] font-semibold text-gray-800">{voice?.name}</div></div>
            <div className="p-3 rounded-xl bg-gray-50"><div className="text-[11px] text-gray-400">場景 / 風格</div><div className="text-[13px] font-semibold text-gray-800">{sceneFilter.replace('全部','')} · {VISUAL_STYLES.find(v=>v.key===visualStyle)?.label}</div></div>
            <div className="p-3 rounded-xl bg-violet-50"><div className="text-[11px] text-violet-500">預估成本</div><div className="text-[13px] font-bold text-violet-700">¥{estCost}<span className="text-[10px] font-normal text-violet-500">/{minutes.toFixed(1)}分</span></div></div>
          </div>

          {/* 肖像照 & 分辨率 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-gray-400">肖像照</span>
              {portraitFile
                ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已上傳（{portraitFile.name}）</span>
                : <span className="text-orange-500">未上傳</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-400">分辨率</span>
              {(['480p','720p'] as const).map(r => (
                <button key={r} onClick={()=>setResolution(r)}
                  className={'text-[12px] px-3 py-1 rounded-lg border transition-all ' + (resolution===r?'border-violet-400 bg-violet-50 text-violet-600':'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                  {r}{r==='480p'?'（快速）':'（高清）'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-violet-100 bg-violet-50/40 text-[12.5px] text-gray-600 mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500 shrink-0" /> 腳本 {script.replace(/\s/g,'').length} 字 · 預估視頻時長 {minutes.toFixed(1)} 分鐘 · 按 ¥{RATE_PER_MIN}/分鐘計費
          </div>

          {/* 錯誤提示 */}
          {genError && (
            <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-[12.5px] text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {genError}
            </div>
          )}

          {/* 生成按鈕 */}
          {!isGenerating && !videoUrl && (
            <button
              onClick={handleGenerate}
              disabled={!portraitFile || !script.trim() || !voiceId}
              className={'w-full flex items-center justify-center gap-2 text-[13px] font-medium text-white rounded-xl py-3.5 transition-all ' + (!portraitFile || !script.trim() || !voiceId ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90')}>
              <Play className="w-4 h-4" /> 開始生成數字人視頻
            </button>
          )}

          {/* 生成中：輪詢進度 */}
          {isGenerating && (
            <div className="space-y-3">
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300" style={{width:progress+'%'}}/></div>
              <div className="text-center text-[12.5px] text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> 生成中… {Math.round(progress)}%（提交 WaveSpeed Hunyuan Avatar，輪詢任務狀態）
              </div>
              {genTaskId && <div className="text-center text-[11px] text-gray-300">task: {genTaskId}</div>}
            </div>
          )}

          {/* 完成：展示視頻 */}
          {videoUrl && (
            <div className="text-center space-y-4 pt-2">
              <div className="flex items-center justify-center gap-2 text-[14px] font-medium text-emerald-600"><CheckCircle2 className="w-5 h-5" /> 數字人視頻已生成！</div>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-black">
                <video src={videoUrl} controls className="w-full max-h-[60vh]" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { setVideoUrl(''); setProgress(0); }} className="px-5 py-2.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> 重新生成</button>
                <Link to="/smart-editing" className="px-5 py-2.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5"><Film className="w-4 h-4" /> 去智能剪輯</Link>
                <Link to="/final-preview" className="px-5 py-2.5 text-[13px] text-white bg-violet-600 rounded-xl hover:bg-violet-700">前往成品預覽</Link>
              </div>
              <div className="pt-3 border-t border-gray-100 text-[11.5px] text-gray-400">
                提示：也可返回「動畫生成」走 OpenMontage 全套流程，兩路產出內容完全不同、可並行。
                <br/><Link to="/video-generation" className="text-violet-600 hover:underline mt-1 inline-block">去嘗試 OpenMontage →</Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={()=>setStep(3)} className="flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> 返回修改</button>
          {videoUrl && <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 生成完成</span>}
        </div>
      </div>
    </div>
  )
}

// SVG expand icon helper
function ExpandIcon({className}:{className?:string}) {
  return <svg className={className||''} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2h12v12H2z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
