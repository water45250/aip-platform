import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, Link, ChevronDown, Upload, FileText, PlusCircle,
  GripVertical, Pencil, Check, Quote, Zap, RefreshCw, Download,
  ChevronRight
} from 'lucide-react'

/* ===== 自動增長文字框 ===== */
function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const grow = () => {
    const el = ref.current
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }
  useEffect(grow, [props.value])
  return (
    <textarea
      ref={ref}
      {...props}
      onChange={(e) => { grow(); props.onChange?.(e) }}
      onInput={grow}
    />
  )
}

/* ===== 開關 ===== */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={'relative inline-block w-[42px] h-6 rounded-full transition-colors ' + (checked ? 'bg-violet-600' : 'bg-gray-300')}
    >
      <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ' + (checked ? 'translate-x-4' : '')} />
    </button>
  )
}

/* ===== 選擇框（含箭頭） ===== */
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-violet-400 cursor-pointer pr-9"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}

const STEPS = ['腳本設置', '腳本生成', '分鏡編輯', '成品確認']

const INITIAL_CHAPTERS = [
  { id: 1, label: '開頭鉤子（3秒）', content: '用一個反常識的問題或數據，快速吸引觀眾注意力，引發好奇' },
  { id: 2, label: '痛點引入', content: '' },
  { id: 3, label: '核心觀點提出', content: '' },
  { id: 4, label: '核心內容一：AI 作為工具', content: '' },
  { id: 5, label: '核心內容二：AI 提升效率', content: '' },
  { id: 6, label: '核心內容三：AI 改變協作', content: '' },
  { id: 7, label: '核心內容四：AI 激發創造力', content: '' },
  { id: 8, label: '總結升華', content: '' },
  { id: 9, label: '行動号召（CTA）', content: '' },
]

const TONES = ['😊 吸引好奇', '😐 嚴肅專業', '🥺 輕松幽默', '😈 震撼沖擊']
const RICHNESS = ['簡潔', '適中', '豐富']

const TEMPLATES = [
  { name: '知識分享型', desc: '適合知識科普、乾貨分享' },
  { name: '觀點論述型', desc: '適合觀點輸出、深度分析' },
  { name: '故事敘述型', desc: '適合故事講述、情感共鳴' },
  { name: '教程步驟型', desc: '適合操作教學、方法教學' },
  { name: '產品種草型', desc: '適合產品推薦、使用體驗' },
  { name: '新聞解讀型', desc: '適合熱點解讀、事件分析' },
]

const SAMPLE_FILES = ['AI行業報告2024.pdf', '未來工作趨勢研究.docx', '麥肯錫AI報告.txt']

export default function ScriptCreationPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [title, setTitle] = useState('AI 如何改變未來的工作方式？')
  const [topic, setTopic] = useState('AI 將從工具、效率、協作、創造力四個維度重塑未來工作方式')

  const [videoType, setVideoType] = useState('知識分享')
  const [audience, setAudience] = useState('職場人士')
  const [duration, setDuration] = useState('3-5分鐘')
  const [voiceStyle, setVoiceStyle] = useState('專業幹貨')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advLanguage, setAdvLanguage] = useState('繁體中文')
  const [advPlatform, setAdvPlatform] = useState('抖音 / TikTok')
  const [advEmotion, setAdvEmotion] = useState('專業權威')

  const [files, setFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [chapters, setChapters] = useState(INITIAL_CHAPTERS)
  const [activeChapterId, setActiveChapterId] = useState(1)
  const [tone, setTone] = useState(0)

  const [mode, setMode] = useState(0)
  const [richness, setRichness] = useState(1)
  const [caseRef, setCaseRef] = useState(true)
  const [goldenLine, setGoldenLine] = useState(true)
  const [template, setTemplate] = useState(0)

  const [generating, setGenerating] = useState(false)

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? chapters[0]

  const updateChapterContent = (content: string) => {
    setChapters((prev) => prev.map((c) => (c.id === activeChapterId ? { ...c, content } : c)))
  }

  const addChapter = () => {
    setChapters((prev) => {
      const id = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1
      const next = [...prev, { id, label: '新章節 ' + prev.length, content: '' }]
      setActiveChapterId(id)
      return next
    })
  }

  const handleFiles = (list: FileList | null) => {
    if (!list || !list.length) return
    setFiles((prev) => [...prev, ...Array.from(list).map((f) => f.name)])
  }

  const generateScript = () => {
    if (generating) return
    setGenerating(true)
    setTimeout(() => {
      const sample = '未來 5 年，不會用 AI 的職場人，效率可能落後同儕 3 倍以上。本集用 4 個維度，帶你重新理解「AI 協作」的真正含義。'
      updateChapterContent(sample)
      setGenerating(false)
    }, 1600)
  }

  const exportScriptJSON = () => {
    const pacing = ['conversational', 'technical', 'energetic', 'contemplative'][tone] ?? 'conversational'
    const labels = chapters.map((c) => c.label)
    const total = Math.max(labels.length * 36, 60)
    const per = total / labels.length
    const sections = chapters.map((c, i) => ({
      id: 's' + (i + 1),
      label: c.label,
      text: c.content,
      start_seconds: +(i * per).toFixed(1),
      end_seconds: +((i + 1) * per).toFixed(1),
      speaker_directions: '',
      delivery_cues: { pace: pacing, emphasis_words: [] },
      enhancement_cues: [],
      pronunciation_guides: [],
      source_ref: '',
    }))
    const out = {
      version: '1.0',
      title,
      total_duration_seconds: Math.round(total),
      voice_performance: {
        performance_intent: '科技頻道旁白',
        pacing_profile: pacing,
        energy_curve: '',
        pause_policy: '',
        sample_section_id: 's1',
        provider_notes: {},
      },
      sections,
      metadata: { language: 'zh-Hant', region: 'HK/MO/TW', topic },
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (title || 'script').replace(/[^\w一-龥-]/g, '_') + '.script.openmontage.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* ===== 步驟條 ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center flex-1 max-w-[640px]">
            {STEPS.map((s, i) => {
              const active = i === activeStep
              return (
                <div key={s} className="flex-1 flex flex-col items-center relative">
                  {i < STEPS.length - 1 && (
                    <div className={'absolute top-4 left-1/2 w-full h-0.5 ' + (i < activeStep ? 'bg-violet-400' : 'bg-gray-200')} />
                  )}
                  <button
                    onClick={() => setActiveStep(i)}
                    className={
                      'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all ' +
                      (active ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' : 'bg-violet-100 text-violet-600 border-2 border-violet-300')
                    }
                  >
                    {i + 1}
                  </button>
                  <div className={'mt-2 text-[12.5px] ' + (active ? 'text-violet-600 font-semibold' : 'text-gray-400')}>{s}</div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
              <Link className="w-3 h-3" /> 對齊創作契約
            </span>
            <button className="px-3.5 py-2 rounded-xl text-[13px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">保存草稿</button>
            <button
              onClick={() => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1))}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 transition-all"
            >
              下一步：分鏡編輯
            </button>
          </div>
        </div>

        {/* ===== 內容網格 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* 左側 */}
          <div className="space-y-5">
            {/* 腳本基本信息 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-4">腳本基本信息</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] text-gray-600 mb-1.5">視頻標題 <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      maxLength={50}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white outline-none text-[13.5px] text-gray-800 transition-colors pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">{title.length}/50</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] text-gray-600 mb-1.5">視頻主題 / 核心觀點 <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <AutoTextarea
                      maxLength={100}
                      rows={2}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white outline-none text-[13.5px] text-gray-800 transition-colors resize-none"
                    />
                    <span className="absolute right-3 bottom-2.5 text-[11px] text-gray-400">{topic.length}/100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">視頻類型</label>
                    <Select value={videoType} onChange={setVideoType} options={['知識分享', '觀點論述', '故事敘述', '教程步驟']} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">目標受眾</label>
                    <Select value={audience} onChange={setAudience} options={['職場人士', '學生群體', '創業者', '大眾']} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">視頻時長</label>
                    <Select value={duration} onChange={setDuration} options={['3-5分鐘', '1-3分鐘', '5-8分鐘', '8分鐘以上']} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">語音風格</label>
                    <Select value={voiceStyle} onChange={setVoiceStyle} options={['專業幹貨', '親切自然', '激情演說', '溫柔療癒']} />
                  </div>
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[12.5px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  <ChevronDown className={'w-3.5 h-3.5 transition-transform ' + (showAdvanced ? 'rotate-180' : '')} />
                  {showAdvanced ? '收起高級設置' : '展開高級設置'}
                </button>
                {showAdvanced && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">語言</label>
                      <Select value={advLanguage} onChange={setAdvLanguage} options={['繁體中文', '簡體中文', '英文']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">平台</label>
                      <Select value={advPlatform} onChange={setAdvPlatform} options={['抖音 / TikTok', 'YouTube', '小紅書', '視頻號']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">情感基調</label>
                      <Select value={advEmotion} onChange={setAdvEmotion} options={['專業權威', '輕松幽默', '溫暖走心']} />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 參考資料 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-4">參考資料 <span className="text-[12px] font-normal text-gray-400">（選填）</span></h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-violet-100') }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-violet-100')}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-violet-100'); handleFiles(e.dataTransfer.files) }}
                  className={'flex-1 border-2 border-dashed border-violet-200 rounded-xl bg-violet-50/40 px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-violet-50 transition-colors ' + (files.length ? 'bg-violet-100' : '')}
                >
                  {files.length ? (
                    <>
                      <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <p className="text-[13px] text-gray-700">已上傳 {files.length} 個文件</p>
                      <p className="text-[11.5px] text-gray-400 mt-1">點擊可重新上傳</p>
                    </>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center mb-2">
                        <Upload className="w-5 h-5 text-violet-500" />
                      </div>
                      <p className="text-[13px] text-gray-700">點擊上傳文件 或 <span className="text-violet-600 font-medium">拖拽到此處</span></p>
                      <p className="text-[11.5px] text-gray-400 mt-1">支持 PDF、Word、TXT 文件，單個文件不超過 50MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
                <div className="w-full md:w-[230px] shrink-0">
                  <p className="text-[12px] text-gray-500 mb-2">參考資料示例</p>
                  <div className="space-y-1.5">
                    {SAMPLE_FILES.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[12.5px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {f}
                      </div>
                    ))}
                    <button className="text-[12px] text-violet-600 hover:underline mt-1 flex items-center">查看全部 <ChevronRight className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            </section>

            {/* 腳本大綱結構 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-gray-800">腳本大綱結構 <span className="text-[12px] font-normal text-gray-400">（可調整）</span></h2>
                <button onClick={addChapter} className="text-[12.5px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> 添加章節
                </button>
              </div>
              <div className="space-y-1.5">
                {chapters.map((c) => {
                  const active = c.id === activeChapterId
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveChapterId(c.id)}
                      className={
                        'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ' +
                        (active ? 'bg-violet-50 border border-violet-200' : 'hover:bg-gray-50 border border-transparent')
                      }
                    >
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <span className={'text-[13px] flex-1 ' + (active ? 'text-gray-800 font-medium' : 'text-gray-700')}>{c.label}</span>
                      <Pencil className={'w-4 h-4 ' + (active ? 'text-violet-500' : 'text-gray-400')} />
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 當前章節編輯器 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-1">當前章節：<span className="text-violet-600">{activeChapter?.label}</span></h2>
              <div className="mt-4">
                <label className="block text-[13px] text-gray-600 mb-1.5">章節內容描述 <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <AutoTextarea
                    rows={3}
                    maxLength={300}
                    value={activeChapter?.content ?? ''}
                    onChange={(e) => updateChapterContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white outline-none text-[13.5px] text-gray-800 transition-colors resize-none"
                  />
                  <span className="absolute right-3 bottom-2.5 text-[11px] text-gray-400">{(activeChapter?.content ?? '').length}/300</span>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-[13px] text-gray-600 mb-2">情緒基調</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t, i) => (
                    <button
                      key={t}
                      onClick={() => setTone(i)}
                      className={
                        'px-3 py-1.5 rounded-full text-[12.5px] border transition-all ' +
                        (i === tone ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200')
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                <p className="text-[12px] text-amber-700 font-medium mb-1.5 flex items-center gap-1.5"><Quote className="w-3.5 h-3.5" /> 參考示例</p>
                <ul className="space-y-1 text-[12.5px] text-gray-600 leading-relaxed list-disc pl-5">
                  <li>ChatGPT 發布兩年，全球 80% 的打工人都可能面臨職業重塑？</li>
                  <li>未來 5 年，不會用 AI 的人，將被先掌握 AI 的人遠遠甩開？</li>
                  <li>一位 AI 員工的效率，已經超過普通員工的 3 倍？</li>
                </ul>
              </div>
            </section>
          </div>

          {/* 右側 */}
          <div className="space-y-5">
            {/* AI 生成設置 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-4">AI 生成設置</h2>
              <label className="block text-[12.5px] text-gray-500 mb-2">生成模式</label>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  onClick={() => setMode(0)}
                  className={'rounded-xl p-3 cursor-pointer border-2 text-left transition-all ' + (mode === 0 ? 'border-violet-400 bg-violet-50/60' : 'border-gray-200')}
                >
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                    標準模式 {mode === 0 && <Check className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">平衡質量與速度，適合大多數場景</p>
                </button>
                <button
                  onClick={() => setMode(1)}
                  className={'rounded-xl p-3 cursor-pointer border-2 text-left transition-all ' + (mode === 1 ? 'border-violet-400 bg-violet-50/60' : 'border-gray-200')}
                >
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">深度模式</div>
                  <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">更深入的內容，更多細節和案例</p>
                </button>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12.5px] text-gray-500">內容豐富度</label>
                  <span className="text-[12px] text-violet-600 font-medium">{RICHNESS[richness]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  value={richness}
                  onChange={(e) => setRichness(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1"><span>簡潔</span><span>適中</span><span>豐富</span></div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] text-gray-700">案例引用</p>
                  <p className="text-[11.5px] text-gray-400">在腳本中加入相關案例或數據</p>
                </div>
                <Toggle checked={caseRef} onChange={setCaseRef} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-[13px] text-gray-700">金句輸出</p>
                  <p className="text-[11.5px] text-gray-400">為腳本生成金句標題和亮點句</p>
                </div>
                <Toggle checked={goldenLine} onChange={setGoldenLine} />
              </div>
            </section>

            {/* 腳本模板 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-1">腳本模板</h2>
              <p className="text-[12px] text-gray-400 mb-3">選擇適合的腳本結構模板</p>
              <div className="grid grid-cols-2 gap-2.5">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setTemplate(i)}
                    className={'rounded-xl p-3 cursor-pointer border-2 text-left transition-all ' + (i === template ? 'border-violet-400 bg-violet-50/60' : 'border-gray-200 hover:border-gray-300')}
                  >
                    <p className="text-[13px] font-medium text-gray-800">{t.name}</p>
                    <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">{t.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* 小貼士 */}
            <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-5">
              <h2 className="text-[14px] font-semibold text-gray-800 mb-3 flex items-center gap-1.5"><Zap className="w-4 h-4 text-violet-500" /> 小貼士</h2>
              <ul className="space-y-2 text-[12.5px] text-gray-600 leading-relaxed list-disc pl-5">
                <li>開頭 3 秒決定觀眾是否留存，用反常識或強衝突抓住注意力。</li>
                <li>每個核心觀點配一個真實案例或數據，提升可信度。</li>
                <li>結尾給清晰的行動号召（關注 / 評論 / 轉發），提升互動。</li>
              </ul>
              <button className="mt-3 text-[12.5px] text-violet-600 hover:underline font-medium">查看腳本創作指南 <ChevronRight className="w-3 h-3 inline" /></button>
            </section>
          </div>
        </div>

        {/* ===== 底部生成條 ===== */}
        <div className="sticky bottom-0 bg-white border border-gray-100 rounded-xl shadow-lg shadow-violet-100 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12.5px] text-gray-500">
            <Sparkles className="w-4 h-4 text-violet-500" />
            基於你的設置，AI 將生成完整腳本與分鏡建議
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={exportScriptJSON}
              className="px-4 py-2.5 rounded-xl text-[13px] text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-violet-500" /> 導出 Script JSON
            </button>
            <button
              onClick={generateScript}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'AI 生成中…' : 'AI 一鍵生成腳本'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
