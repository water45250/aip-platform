import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BookOpen, Mic, Upload, Star, Type, Settings2, PlayCircle,
  Lightbulb, Download, Folder, PlusCircle, X, Play, Pause, CheckCircle2,
  Loader2, AudioLines, Volume2, Gauge,
} from 'lucide-react'

/* ============ 資料 ============ */
const VOICES = [
  {
    id: 'taiwan-vivian', name: 'Taiwan-Vivian', sub: 'Qwen3-TTS · 克隆',
    initial: 'T', avatar: 'bg-gradient-to-br from-violet-600 to-purple-600',
    status: '可用', tags: ['中文', '台灣腔'], cat: 'cloned', fav: true,
  },
  {
    id: 'host-kevin', name: 'Host-Kevin', sub: 'Qwen3-TTS · 克隆',
    initial: 'K', avatar: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    status: '可用', tags: ['中文', '男聲'], cat: 'cloned', fav: false,
  },
  {
    id: 'cherry', name: 'Cherry（甜美女聲）', sub: 'Qwen3-TTS · 預設',
    initial: 'V', avatar: 'bg-gradient-to-br from-pink-400 to-rose-400',
    status: '可用', tags: ['中文', '女聲'], cat: 'preset', fav: true,
  },
  {
    id: 'uncle-fu', name: 'Uncle-Fu（大叔）', sub: 'Qwen3-TTS · 預設',
    initial: 'U', avatar: 'bg-gradient-to-br from-indigo-500 to-violet-500',
    status: '可用', tags: ['中文', '男低音'], cat: 'preset', fav: false,
  },
  {
    id: 'new-voice-03', name: 'New-Voice_03', sub: 'Qwen3-TTS · 克隆中...',
    initial: '...', avatar: 'bg-gray-200 text-gray-400',
    status: '克隆中', tags: [], cat: 'cloned', fav: false, progress: 65,
  },
]

const VOICE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'cloned', label: '我克隆的' },
  { key: 'preset', label: '平台預設' },
  { key: 'fav', label: '收藏' },
]

const EMOTIONS = [
  { label: '開朗愉快', text: '開朗、輕快、帶有活力的語調' },
  { label: '溫柔知性', text: '溫柔知性、語調平和、適合有聲書' },
  { label: '激昂熱情', text: '激昂熱情、富有感染力、節奏感強' },
  { label: '新聞播報', text: '嚴肅權威、吐字清晰、新聞播報風格' },
  { label: '可愛俏皮', text: '可愛俏皮、音域偏高、語速偏快' },
  { label: '深沉穩重', text: '深沉穩重、磁性低沉、紀錄片解說' },
]

const TOTAL_SECONDS = 12

export default function VoiceClonePage() {
  /* ---- 聲音列表 / 選擇 ---- */
  const [activeTab, setActiveTab] = useState('all')
  const [selectedVoice, setSelectedVoice] = useState('taiwan-vivian')

  /* ---- 合成文本 ---- */
  const [synthText, setSynthText] = useState('')
  const [lang, setLang] = useState('zh')
  const [tradConvert, setTradConvert] = useState(true)
  const [instruct, setInstruct] = useState('')
  const [emotion, setEmotion] = useState<string | null>(null)
  const [optimize, setOptimize] = useState(false)

  /* ---- 高級參數 ---- */
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(100)
  const [sampleRate, setSampleRate] = useState('44100 Hz')
  const [format, setFormat] = useState('MP3（壓縮）')

  /* ---- 播放器 ---- */
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playerStatus, setPlayerStatus] = useState('等待合成...')
  const [isGenerating, setIsGenerating] = useState(false)
  const timerRef = useRef<number | null>(null)

  /* ---- 克隆 Modal ---- */
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState<number | 'success'>(1)
  const [fileName, setFileName] = useState('')
  const [fileInfo, setFileInfo] = useState('')
  const [recording, setRecording] = useState(false)
  const [recSec, setRecSec] = useState(0)
  const [recTimer, setRecTimer] = useState<number | null>(null)
  const [genProgress, setGenProgress] = useState(0)
  const [genStatus, setGenStatus] = useState('')
  const [voicePrefix, setVoicePrefix] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* 波形條 */
  const waveBars = useMemo(
    () => Array.from({ length: 40 }, () => Math.random() * 70 + 15),
    [],
  )

  const visibleVoices = VOICES.filter((v) => {
    if (activeTab === 'all') return true
    if (activeTab === 'fav') return v.fav
    return v.cat === activeTab
  })

  const metaVoice = VOICES.find((v) => v.id === selectedVoice)?.name ?? '--'

  /* ===== 播放模擬 ===== */
  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startPlayback = (status: string) => {
    setPlayerStatus(status)
    setPlaying(true)
    setCurrentTime(0)
    stopTimer()
    timerRef.current = window.setInterval(() => {
      setCurrentTime((t) => {
        if (t + 0.1 >= TOTAL_SECONDS) {
          setPlaying(false)
          setPlayerStatus('準備就緒')
          stopTimer()
          return 0
        }
        return t + 0.1
      })
    }, 100)
  }

  const togglePlay = () => {
    if (playing) {
      stopTimer()
      setPlaying(false)
      setPlayerStatus('已暫停')
    } else {
      startPlayback('播放中…')
    }
  }

  const startStreamPreview = () => {
    if (!synthText.trim()) {
      setPlayerStatus('請先輸入合成文本')
      return
    }
    startPlayback('試聽中…（流式 97ms）')
  }

  const generateAudio = () => {
    if (!synthText.trim()) {
      setPlayerStatus('請先輸入合成文本')
      return
    }
    setIsGenerating(true)
    setPlayerStatus('生成中…')
    setTimeout(() => {
      setIsGenerating(false)
      startPlayback('生成完成，播放中…')
    }, 800)
  }

  useEffect(() => stopTimer, [])

  /* ===== 字符計數 ===== */
  const charCount = synthText.length
  const instrCount = instruct.length

  /* ===== 克隆 Modal 邏輯 ===== */
  const openModal = (goRecord = false) => {
    setShowModal(true)
    setModalStep(1)
    setGenProgress(0)
    setVoicePrefix('')
    setFileName('')
    setFileInfo('')
    if (goRecord) setTimeout(() => toggleRecord(), 300)
  }

  const closeModal = () => {
    setShowModal(false)
    if (recTimer) {
      window.clearInterval(recTimer)
      setRecTimer(null)
    }
    setRecording(false)
    setRecSec(0)
    setModalStep(1)
    setGenProgress(0)
  }

  const showStep = (s: number | 'success') => {
    setModalStep(s)
    if (s === 4) setGenStatus('初始化模型...')
  }

  const nextStep = () => {
    if (modalStep === 1) {
      if (fileName) showValidate()
      return
    }
    if (modalStep === 2) showStep(3)
  }

  const showValidate = () => {
    showStep(2)
    setTimeout(() => showStep(3), 1200)
  }

  const startClone = () => {
    showStep(4)
    const steps = ['初始化模型...', '下載編碼器...', '提取聲紋特徵...', '驗證相似度...', '生成音色 ID...']
    let si = 0
    const iv = window.setInterval(() => {
      si++
      if (si <= steps.length) setGenStatus(steps[si - 1])
      const pct = Math.min(si * (100 / steps.length) + Math.random() * 8, 98)
      setGenProgress(pct)
      if (si >= steps.length) {
        window.clearInterval(iv)
        setTimeout(() => setModalStep('success'), 600)
      }
    }, 800)
  }

  const handleFile = (file: { name: string; size?: number }) => {
    setFileName(file.name)
    const mb = file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''
    setFileInfo(`${mb} · WAV · 24kHz · ${(5 + Math.random() * 15).toFixed(1)}s`)
  }

  const removeFile = () => {
    setFileName('')
    setFileInfo('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleRecord = () => {
    setRecording((r) => {
      const next = !r
      if (next) {
        setRecSec(0)
        const t = window.setInterval(() => {
          setRecSec((s) => s + 1)
        }, 1000)
        setRecTimer(t)
      } else {
        if (recTimer) window.clearInterval(recTimer)
        setRecTimer(null)
        if (recSec > 3) handleFile({ name: `recording_${Date.now()}.wav` })
      }
      return next
    })
  }

  const speedPct = ((speed - 0.5) / (2 - 0.5)) * 100
  const volPct = (volume / 200) * 100
  const progressPct = TOTAL_SECONDS ? (currentTime / TOTAL_SECONDS) * 100 : 0
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${m}:${String(ss).padStart(2, '0')}`
  }

  return (
    <div className="p-6">
      <style>{`
        input[type=range].aip-range{ -webkit-appearance:none; appearance:none; height:5px; border-radius:999px;
          background:linear-gradient(to right,#7c3aed var(--progress,60%),#e5e7eb var(--progress,60%)); }
        input[type=range].aip-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px;
          border-radius:50%; background:#7c3aed; border:2px solid #fff; box-shadow:0 1px 6px rgba(124,58,237,.35); cursor:pointer; margin-top:-5.5px; }
        input[type=range].aip-range::-moz-range-thumb{ width:16px; height:16px; border-radius:50%; background:#7c3aed; border:2px solid #fff; cursor:pointer; }
        @keyframes aip-wave{ 0%{height:20%} 50%{height:85%} 100%{height:20%} }
        .aip-wave{ animation:aip-wave .9s ease-in-out infinite alternate; }
      `}</style>

      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">聲音克隆</h1>
            <p className="text-[13.5px] text-gray-500 mt-1">
              基於 Qwen3-TTS 引擎，上傳參考音頻即可複製專屬音色，支持自然語言情緒控制與流式實時合成
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors">
            <BookOpen className="w-4 h-4" />
            使用教程
          </button>
        </div>

        {/* ===== 三欄工作區 ===== */}
        <div className="grid grid-cols-12 gap-5">
          {/* ===== 欄 1：我的聲音庫 ===== */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* 上傳 / 錄音 CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white shadow-lg shadow-violet-300/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-white" />
                  </span>
                  <span className="text-[14px] font-bold leading-tight">上傳你的聲音做克隆</span>
                </div>
                <p className="text-[11.5px] text-white/80 leading-relaxed mb-3">
                  支持上傳音頻文件，或用瀏覽器直接錄音，約 3 秒即可複製專屬音色。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(false)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white text-[12.5px] font-semibold text-violet-700 hover:bg-violet-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> 上傳音頻
                  </button>
                  <button
                    onClick={() => openModal(true)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/15 text-[12.5px] font-semibold text-white border border-white/30 hover:bg-white/25 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-4 h-4" /> 錄音克隆
                  </button>
                </div>
              </div>
            </div>

            {/* 聲音列表 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-1">
                {VOICE_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={
                      'flex-1 py-3 text-[13px] transition-colors ' +
                      (activeTab === t.key
                        ? 'text-violet-600 border-b-2 border-violet-600 font-semibold'
                        : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600')
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 列表 */}
              <div className="p-3 space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto">
                {visibleVoices.map((v) => {
                  const selected = v.id === selectedVoice
                  if (v.status === '克隆中') {
                    return (
                      <div key={v.id} className="p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/70">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs animate-pulse">
                              {v.initial}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-600">{v.name}</div>
                              <div className="text-[11px] text-gray-400">{v.sub}</div>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            克隆中
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full" style={{ width: `${v.progress}%` }} />
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1 text-right">{v.progress}%</div>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={
                        'group p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ' +
                        (selected
                          ? 'border-2 border-violet-400 bg-violet-50/50'
                          : 'border border-gray-100 bg-white hover:border-violet-200')
                      }
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ' + v.avatar}>
                            {v.initial}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-gray-800">{v.name}</div>
                            <div className="text-[11px] text-gray-400">{v.sub}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">
                          {v.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {v.tags.map((tag) => (
                            <span key={tag} className="text-[10.5px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startStreamPreview()
                          }}
                          className="p-1.5 rounded-lg hover:bg-violet-100 transition-colors"
                          title="試聽"
                        >
                          <Play className="w-4 h-4 text-violet-500" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {visibleVoices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Folder className="w-10 h-10 text-gray-300 mb-2" />
                    <div className="text-[13px] text-gray-400">此分類暫無音色</div>
                    <button
                      onClick={() => openModal(false)}
                      className="mt-3 px-4 py-2 rounded-xl text-[12.5px] font-medium text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                    >
                      + 新建克隆音色
                    </button>
                  </div>
                )}
              </div>

              {/* 配額提示 */}
              <div className="px-4 pb-3 pt-1">
                <div className="text-[11.5px] text-gray-400 text-center">
                  已使用 3 / 1000 個音色配額 · <span className="text-violet-500 hover:underline cursor-pointer">管理音色</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 欄 2：合成工作區 ===== */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* 合成文本 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className="flex items-center justify-between mb-2.5">
                <span className="text-[14px] font-semibold text-gray-800 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-violet-500" />
                  合成文本
                </span>
                <span className="text-[12px] text-gray-400">
                  <strong className="text-violet-600">{charCount}</strong> / 600 字符
                </span>
              </label>
              <textarea
                value={synthText}
                onChange={(e) => setSynthText(e.target.value)}
                rows={4}
                placeholder={'請輸入要合成的文本內容（支持繁體中文）...\n例如：歡迎來到文經客創作平台，今天我們來聊聊如何用AI提升內容生產效率。'}
                className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 text-[14px] leading-relaxed text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-300 transition-shadow"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500">語種：</span>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12.5px] focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  >
                    <option value="auto">Auto（自動識別）</option>
                    <option value="zh">Chinese（中文）</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>
                <label className="flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tradConvert}
                    onChange={(e) => setTradConvert(e.target.checked)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-400"
                  />
                  繁體自動轉換
                </label>
              </div>
            </div>

            {/* 情緒 / 語氣控制 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-gray-800 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-pink-400" />
                  情緒 / 語氣控制
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200 ml-1">
                    Qwen3-TTS Instruct
                  </span>
                </span>
                <label className="flex items-center gap-1.5 text-[11.5px] text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={optimize}
                    onChange={(e) => setOptimize(e.target.checked)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-400"
                  />
                  語義優化
                </label>
              </div>

              <div className="mb-3">
                <div className="text-[11.5px] text-gray-400 mb-2">快速選擇情緒標籤：</div>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map((em) => {
                    const active = emotion === em.label
                    return (
                      <button
                        key={em.label}
                        onClick={() => {
                          setEmotion(em.label)
                          setInstruct(em.text)
                        }}
                        className={
                          'px-3 py-1.5 rounded-full text-[12.5px] border transition-colors ' +
                          (active
                            ? 'border-violet-200 bg-violet-50 text-violet-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-violet-50 hover:border-violet-200')
                        }
                      >
                        {em.label}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => {
                      setEmotion(null)
                      setInstruct('')
                    }}
                    className="px-3 py-1.5 rounded-full text-[12.5px] border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    清除
                  </button>
                </div>
              </div>

              <textarea
                value={instruct}
                onChange={(e) => setInstruct(e.target.value)}
                rows={3}
                placeholder={'或自定義情緒指令（自然語言描述期望的聲音特質、語調、情感表達方式）\n例：採用清新甜美的少女音色，音調輕快有活力，語氣自然俏皮，傳遞出親切溫暖又不失可愛的表達風格。\n支持中英文，最長 1600 Token。'}
                className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 text-[13px] leading-relaxed text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 placeholder:text-gray-300"
              />
              <div className="mt-1.5 text-right text-[11px] text-gray-400">
                {instrCount} / 1600 Token
              </div>
            </div>

            {/* 高級參數 */}
            <details className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
              <summary className="px-5 py-3.5 cursor-pointer text-[13.5px] font-semibold text-gray-700 flex items-center justify-between hover:bg-gray-50/80 transition-colors list-none">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform duration-200" />
                  高級參數
                </span>
                <span className="text-[11px] text-gray-400 font-normal">語速 · 音量 · 採樣率 · 格式</span>
              </summary>
              <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-4">
                {/* 語速 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12.5px] text-gray-600 font-medium flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-gray-400" /> 語速
                    </label>
                    <span className="text-[12px] text-violet-600 font-mono font-semibold">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range" min={0.5} max={2} step={0.1} value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="aip-range w-full" style={{ '--progress': `${speedPct}%` } as CSSProperties}
                  />
                  <div className="flex justify-between text-[10.5px] text-gray-400 mt-1">
                    <span>0.5x</span><span>1.0x</span><span>2.0x</span>
                  </div>
                </div>
                {/* 音量 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12.5px] text-gray-600 font-medium flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-gray-400" /> 音量
                    </label>
                    <span className="text-[12px] text-violet-600 font-mono font-semibold">{volume}%</span>
                  </div>
                  <input
                    type="range" min={0} max={200} step={5} value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="aip-range w-full" style={{ '--progress': `${volPct}%` } as CSSProperties}
                  />
                  <div className="flex justify-between text-[10.5px] text-gray-400 mt-1">
                    <span>0%</span><span>100%</span><span>200%</span>
                  </div>
                </div>
                {/* 採樣率 */}
                <div>
                  <label className="text-[12.5px] text-gray-600 font-medium block mb-1.5">採樣率</label>
                  <select
                    value={sampleRate}
                    onChange={(e) => setSampleRate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12.5px] focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  >
                    <option>24000 Hz</option>
                    <option>44100 Hz</option>
                    <option>48000 Hz</option>
                  </select>
                </div>
                {/* 格式 */}
                <div>
                  <label className="text-[12.5px] text-gray-600 font-medium block mb-1.5">輸出格式</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12.5px] focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  >
                    <option>MP3（壓縮）</option>
                    <option>WAV（無損）</option>
                  </select>
                </div>
              </div>
            </details>

            {/* 操作按鈕 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startStreamPreview}
                className="py-2.5 rounded-xl text-[13px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                流式試聽（97ms）
              </button>
              <button
                onClick={generateAudio}
                disabled={isGenerating}
                className="py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 shadow-md shadow-violet-200/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <PlusCircle className="w-4 h-4" />
                {isGenerating ? '生成中...' : '生成音頻'}
              </button>
            </div>
          </div>

          {/* ===== 欄 3：預覽與導出 ===== */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* 播放器 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[14px] font-semibold text-gray-800 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-green-500" />
                    試聽播放器
                  </span>
                  <span className="text-[11px] text-gray-400">{playerStatus}</span>
                </div>

                {/* 波形可視化 */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50/40 rounded-xl p-4 relative overflow-hidden">
                  <div className="flex items-end justify-center gap-[3px] h-20 opacity-40">
                    {waveBars.map((h, i) => (
                      <div
                        key={i}
                        className={'w-[5px] bg-violet-400 rounded-full opacity-70 ' + (playing ? 'aip-wave' : '')}
                        style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-300/40 hover:scale-105 transition-transform"
                    >
                      {playing ? (
                        <Pause className="w-6 h-6" fill="currentColor" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(TOTAL_SECONDS)}</span>
                  </div>
                </div>

                {/* 進度條 */}
                <div className="px-1 mt-3">
                  <input
                    type="range" min={0} max={100} value={progressPct}
                    disabled
                    className="aip-range w-full"
                    style={{ '--progress': `${progressPct}%` } as CSSProperties}
                  />
                </div>
              </div>

              {/* 元信息 */}
              <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                  <div className="flex items-center justify-between"><span className="text-gray-400">引擎</span><span className="font-medium text-gray-700">Qwen3-TTS-VC</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-400">音色</span><span className="font-medium text-violet-600">{metaVoice}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-400">時長</span><span className="font-medium text-gray-700">{fmt(TOTAL_SECONDS)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-400">字符數</span><span className="font-medium text-gray-700">{charCount}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-400">情緒</span><span className="font-medium text-gray-500 truncate max-w-[120px] text-right">{emotion ?? '--'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-400">格式</span><span className="font-medium text-gray-700">{format.split('（')[0]}</span></div>
                </div>
              </div>

              {/* 導出按鈕 */}
              <div className="px-5 pb-5 flex gap-2.5">
                <button className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Download className="w-4 h-4" />
                  下載 {format.split('（')[0]}
                </button>
                <button className="py-2.5 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                  <Folder className="w-4 h-4" />
                  加入素材庫
                </button>
              </div>
            </div>

            {/* 引擎狀態 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="text-[13px] font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                引擎狀態
              </div>
              <div className="space-y-2.5 text-[12.5px]">
                <div className="flex items-center justify-between"><span className="text-gray-500">模型</span><span className="font-mono text-gray-700 text-[11.5px] bg-gray-50 px-2 py-0.5 rounded">qwen3-tts-vc-realtime</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">區域</span><span className="text-gray-700">新加坡 (ap-southeast-1)</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">首包延遲</span><span className="text-green-600 font-medium">~97 ms</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">流式協議</span><span className="text-gray-700">SSE</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">計費</span><span className="text-gray-700">$0.01/克隆 · $0.02/萬字符</span></div>
              </div>
            </div>

            {/* 克隆提示 */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/60 p-4">
              <div className="text-[13px] font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                克隆提示
              </div>
              <ul className="text-[12px] text-amber-700/80 space-y-1 leading-relaxed">
                <li>• 參考音頻建議 10~20 秒，單聲道，≥24kHz 採樣率</li>
                <li>• 至少包含 3 秒連續清晰朗讀，避免背景噪音</li>
                <li>• 克隆音色綁定引擎模型，不可跨引擎使用</li>
                <li>• 上傳前請確認您擁有該聲音的合法使用權</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 克隆 Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,17,34,.38)] backdrop-blur-[6px]">
          <div className="bg-white rounded-3xl shadow-2xl w-[580px] max-w-[92vw] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 rounded-t-3xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">新建克隆音色</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">上傳參考音頻 → 自動提取聲紋 → 生成專屬音色</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 步驟指示器 */}
            <div className="px-6 pt-5 pb-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => {
                  const done = modalStep !== 'success' && s < modalStep
                  const active = modalStep === s
                  return (
                    <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                      <div
                        className={
                          'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 flex-shrink-0 transition-all ' +
                          (done
                            ? 'border-violet-600 text-violet-600 bg-violet-50'
                            : active
                              ? 'border-violet-600 text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/30'
                              : 'border-gray-200 text-gray-400')
                        }
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : s}
                      </div>
                      {s < 4 && <div className={'flex-1 h-0.5 rounded-full ' + (done ? 'bg-violet-600' : 'bg-gray-200')} />}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-gray-400">
                <span>上傳音頻</span><span>校驗</span><span>命名</span><span>生成</span>
              </div>
            </div>

            {/* Step 1：上傳 */}
            {modalStep === 1 && (
              <div className="px-6 py-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files[0]
                    if (f && f.type.startsWith('audio/')) handleFile({ name: f.name, size: f.size })
                  }}
                  className="rounded-2xl border-2 border-dashed border-violet-200 p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-violet-400" />
                  </div>
                  <div className="text-[14px] font-semibold text-gray-700 mb-1">拖拽音頻文件到這裡</div>
                  <div className="text-[12.5px] text-gray-400 mb-3">或點擊選擇文件（支援 WAV / MP3 / M4A）</div>
                  <div className="inline-flex items-center gap-1.5 text-[11.5px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                    <Mic className="w-3.5 h-3.5" /> 支持瀏覽器錄音
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFile({ name: f.name, size: f.size })
                    }}
                  />
                </div>

                {/* 文件預覽 */}
                {fileName && (
                  <div className="mt-4 p-4 rounded-xl bg-violet-50/60 border border-violet-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center text-white shrink-0">
                        <AudioLines className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-gray-800 truncate">{fileName}</div>
                        <div className="text-[11.5px] text-gray-500 mt-0.5">{fileInfo}</div>
                      </div>
                      <button onClick={removeFile} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 錄音 */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={toggleRecord}
                    className={'relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all group ' + (recording ? 'border-red-400 bg-red-50' : 'border-red-300 hover:border-red-400 hover:bg-red-50')}
                  >
                    <span className={'w-5 h-5 rounded-full bg-red-400 ' + (recording ? 'animate-ping' : '')} />
                  </button>
                  <div className="text-[12.5px] text-gray-500">
                    <span>{recording ? '錄音中' : '點擊開始錄音'}</span>
                    {recording && (
                      <span className="font-mono text-red-500 ml-2 font-semibold">
                        {String(Math.floor(recSec / 60)).padStart(2, '0')}:{String(recSec % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 協議 */}
                <label className="mt-5 flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-400" />
                  <span className="text-[11.5px] text-gray-500 leading-relaxed">
                    我確認擁有此音頻的合法版權及使用授權，並同意<span className="text-violet-600 hover:underline cursor-pointer">《聲音克隆服務協議》</span>
                  </span>
                </label>
              </div>
            )}

            {/* Step 2：校驗 */}
            {modalStep === 2 && (
              <div className="px-6 py-5 space-y-3">
                {[
                  { t: '格式通過', d: 'WAV, 16bit, 24000Hz, 單聲道, 15.3s' },
                  { t: '信噪比合格', d: 'SNR > 25dB，無明顯背景噪音' },
                  { t: '有效語音充足', d: '連續清晰語音 12.1s (≥3s)' },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-[13px] font-medium text-emerald-800">{r.t}</div>
                      <div className="text-[11.5px] text-emerald-600">{r.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3：命名 */}
            {modalStep === 3 && (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">音色名稱前綴</label>
                  <input
                    type="text" maxLength={10} value={voicePrefix}
                    onChange={(e) => setVoicePrefix(e.target.value)}
                    placeholder="英文/數字，如 taiwan-vivian"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                  />
                  <div className="text-[11px] text-gray-400 mt-1">≤10 字符，僅支持英文字母和數字</div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">分組標籤（可選）</label>
                  <input type="text" placeholder="如：主播音色 / 角色配音" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400" />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">備註（可選）</label>
                  <input type="text" placeholder="記錄用途或來源" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400" />
                </div>
              </div>
            )}

            {/* Step 4：生成 */}
            {modalStep === 4 && (
              <div className="px-6 py-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  </div>
                  <div className="text-[15px] font-semibold text-gray-800 mb-1">正在提取聲紋特徵...</div>
                  <div className="text-[13px] text-gray-500 mb-5">Qwen3-TTS 正在分析您的音頻，預計需 5~15 秒</div>
                  <div className="max-w-[360px] mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-300" style={{ width: `${genProgress}%` }} />
                  </div>
                  <div className="text-[11.5px] text-gray-400 mt-2">{genStatus}</div>
                </div>
              </div>
            )}

            {/* 成功 */}
            {modalStep === 'success' && (
              <div className="px-6 py-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-[15px] font-semibold text-gray-800 mb-1">音色克隆成功！</div>
                  <div className="text-[13px] text-gray-500 mb-4">您的專屬音色已就緒，可直接用於語音合成</div>
                  <div className="bg-gray-50 rounded-xl p-3 inline-block text-left">
                    <div className="text-[11.5px] text-gray-400">Voice ID</div>
                    <div className="text-[13px] font-mono text-violet-600 font-semibold break-all">qwen-omni-vc-myvoice-voice-20260708xxxxx-abc123</div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-4 rounded-b-3xl flex items-center justify-between">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors">取消</button>
              {modalStep === 'success' ? (
                <button onClick={closeModal} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 shadow-md shadow-violet-200/40 transition-all">完成</button>
              ) : modalStep === 4 ? (
                <button onClick={startClone} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 shadow-md shadow-violet-200/40 transition-all">開始克隆</button>
              ) : (
                <button onClick={nextStep} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 shadow-md shadow-violet-200/40 transition-all">下一步</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
