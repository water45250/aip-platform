import { useState } from 'react'
import {
  Video, Image, Music, Mic, Wand2, Link2, Download, Save, Send,
  Shield, Coins, Cpu, Check, RefreshCw, PlayCircle, ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { sampleProject } from '../lib/openmontage-schema'

type GenTab = 'image' | 'video' | 'music' | 'tts'
type TaskStatus = '生成中' | '完成'

interface GenTask {
  id: string
  type: string
  name: string
  status: TaskStatus
  progress: number
  cost: number
}

const genTabs: { key: GenTab; label: string; icon: typeof Image }[] = [
  { key: 'image', label: '圖像', icon: Image },
  { key: 'video', label: '視頻', icon: Video },
  { key: 'music', label: '音樂', icon: Music },
  { key: 'tts', label: '字幕TTS', icon: Mic },
]

const suppliers = [
  { name: 'fal.ai Veo', tag: '雲端', tagClass: 'text-violet-600 bg-white', score: 92.4, dims: [90, 95, 88, 92, 78, 85, 90] },
  { name: 'Kling 可靈', tag: '雲端', tagClass: 'text-gray-400 bg-gray-100', score: 88.1, dims: [85, 90, 90, 88, 82, 80, 86] },
  { name: '本地 WAN 2.1', tag: '本地·零成本', tagClass: 'text-green-600 bg-green-50', score: 81.7, dims: [78, 82, 95, 80, 100, 72, 68] },
]
const scoreDims = ['適配', '質量', '控制', '可靠', '成本', '延遲', '連續']

const budget = 10.0

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VideoGenerationPage() {
  const [step, setStep] = useState(0) // 0:素材生成 1:合成渲染 2:預覽發布
  const [genTab, setGenTab] = useState<GenTab>('image')
  const [refLink, setRefLink] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(0)
  const [tasks, setTasks] = useState<GenTask[]>([
    { id: 'seed', type: '圖像', name: '未來辦公室場景', status: '完成', progress: 100, cost: 0.12 },
  ])
  const [approved, setApproved] = useState<null | 'approved' | 'rejected'>(null)
  const [costApproval, setCostApproval] = useState(true)

  const usedCost = tasks.reduce((sum, t) => sum + t.cost, 0)
  const costPct = Math.min((usedCost / budget) * 100, 100)

  const steps = ['素材生成', '合成渲染', '預覽發布']

  const handleGenerate = (type: string, name: string) => {
    const id = 't' + Date.now()
    const cost = +(Math.random() * 0.5 + 0.05).toFixed(2)
    setTasks((prev) => [{ id, type, name, status: '生成中', progress: 0, cost }, ...prev])
    let p = 0
    const timer = setInterval(() => {
      p += Math.random() * 20 + 10
      if (p >= 100) {
        p = 100
        clearInterval(timer)
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress: 100, status: '完成' } : t)))
      } else {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress: p } : t)))
      }
    }, 300)
  }

  const exportAssetsJSON = () => {
    const manifest = {
      version: '1.0',
      assets: tasks.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        cost_usd: t.cost,
        status: t.status,
        quality_score: 0.9,
      })),
      total_cost_usd: +usedCost.toFixed(2),
      metadata: { cap_usd: budget },
    }
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'asset_manifest.openmontage.json'
    a.click()
  }

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 階段指示器 + 操作 */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-0 flex-1 max-w-[560px]">
            {steps.map((label, i) => (
              <div key={i} className="relative flex-1 text-center">
                <button
                  onClick={() => setStep(i)}
                  className={
                    'w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold mx-auto transition-all ' +
                    (i === step
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                      : 'bg-violet-100 text-violet-600 border-2 border-violet-300')
                  }
                >
                  {i + 1}
                </button>
                <div
                  className={
                    'text-[12.5px] mt-2 ' +
                    (i === step ? 'text-violet-600 font-semibold' : 'text-gray-400')
                  }
                >
                  {label}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={
                      'absolute left-1/2 top-3.5 w-full h-0.5 z-0 ' +
                      (i < step ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gray-200')
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-500">已用 ${usedCost.toFixed(2)}</span>
            <button
              onClick={exportAssetsJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> 導出 Asset JSON
            </button>
            <button className="px-3.5 py-2 rounded-xl text-[13px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> 保存草稿
            </button>
            <button className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center gap-1.5">
              <Send className="w-4 h-4" /> 開始合成
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* 左欄 */}
          <div className="space-y-6">
            {/* 素材生成 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-gray-800">素材生成</h2>
                <span className="text-[11.5px] text-gray-400">AI 自動生成素材</span>
              </div>

              {/* 參考連結 */}
              <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <Link2 className="w-4 h-4 text-amber-500 shrink-0" />
                <input
                  value={refLink}
                  onChange={(e) => setRefLink(e.target.value)}
                  placeholder="貼上 YouTube / Reel 連結，Agent 分析並給出差異化方案"
                  className="flex-1 bg-transparent text-[12.5px] text-gray-600 outline-none placeholder:text-gray-400"
                />
                <button className="text-[12px] text-violet-600 font-medium shrink-0">解析</button>
              </div>

              {/* 生成 Tab */}
              <div className="flex gap-1.5 mb-4">
                {genTabs.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.key}
                      onClick={() => setGenTab(t.key)}
                      className={
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all ' +
                        (genTab === t.key
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                      }
                    >
                      <Icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  )
                })}
              </div>

              {/* 圖像 */}
              {genTab === 'image' && (
                <div>
                  <label className="block text-[12.5px] text-gray-500 mb-1.5">圖像提示詞 (Prompt)</label>
                  <textarea
                    rows={2}
                    defaultValue="未來辦公室，AI 助手漂浮在員工身邊，科技藍紫光調"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 outline-none text-[13px] text-gray-800"
                    placeholder="未來辦公室，AI 助手漂浮在員工身邊，科技藍紫光調"
                  />
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">風格</label>
                      <SelectInput options={['寫實攝影', '3D 渲染', '扁平插畫', '電影感']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">比例</label>
                      <SelectInput options={['16:9', '1:1', '9:16', '4:3']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">模型</label>
                      <SelectInput options={['Stable Diffusion', 'FLUX', '本地 SDXL']} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerate('圖像', '未來辦公室場景')}
                    className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> 生成圖像
                  </button>
                </div>
              )}

              {/* 視頻 */}
              {genTab === 'video' && (
                <div>
                  <label className="block text-[12.5px] text-gray-500 mb-1.5">視頻提示詞 (Prompt)</label>
                  <textarea
                    rows={2}
                    defaultValue="鏡頭緩緩推近，展示 AI 助手協助工作的流暢畫面"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 outline-none text-[13px] text-gray-800"
                    placeholder="鏡頭緩緩推近，展示 AI 助手協助工作的流暢畫面"
                  />
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">時長</label>
                      <SelectInput options={['5 秒', '10 秒', '15 秒', '30 秒']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">模型</label>
                      <SelectInput options={['fal.ai Veo', 'Kling', 'Runway', '本地 WAN2.1']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">運鏡</label>
                      <SelectInput options={['推近', '平移', '環繞', '靜態']} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerate('視頻', 'AI 協作工作流')}
                    className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> 生成視頻
                  </button>
                </div>
              )}

              {/* 音樂 */}
              {genTab === 'music' && (
                <div>
                  <label className="block text-[12.5px] text-gray-500 mb-1.5">音樂描述</label>
                  <textarea
                    rows={2}
                    defaultValue="輕快科技感背景音，節奏明快"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 outline-none text-[13px] text-gray-800"
                    placeholder="輕快科技感背景音，節奏明快，適合知識分享"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">情緒</label>
                      <SelectInput options={['激勵向上', '溫馨治癒', '懸疑緊張']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">模型</label>
                      <SelectInput options={['Suno', '本地音樂模型']} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerate('音樂', '科技感BGM')}
                    className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> 生成音樂
                  </button>
                </div>
              )}

              {/* 字幕TTS */}
              {genTab === 'tts' && (
                <div>
                  <label className="block text-[12.5px] text-gray-500 mb-1.5">配音文本</label>
                  <textarea
                    rows={2}
                    defaultValue="未來 5 年，不會用 AI 的職場人，效率可能落後同儕 3 倍"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 outline-none text-[13px] text-gray-800"
                    placeholder="未來 5 年，不會用 AI 的職場人，效率可能落後同儕 3 倍"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">音色</label>
                      <SelectInput options={['專業男聲 A', '溫柔女聲 B', '活力少年 C']} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">語言</label>
                      <SelectInput options={['繁體中文', '簡體中文', '英文']} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerate('字幕', '專業男聲配音')}
                    className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> 生成語音
                  </button>
                </div>
              )}
            </section>

            {/* 供應商評分選擇器 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[15px] font-semibold text-gray-800">供應商評分選擇器</h2>
                <span className="text-[11px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">7 維加權</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">Agent 依 7 維權重自動選型，確保質量、成本與連續性平衡</p>
              <div className="space-y-3">
                {suppliers.map((sp, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedSupplier(i)}
                    className={
                      'border rounded-xl p-3.5 cursor-pointer transition-all ' +
                      (i === selectedSupplier
                        ? 'border-violet-300 bg-violet-50/50'
                        : 'border-gray-200 hover:border-gray-300')
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-gray-800">{sp.name}</span>
                        <span className={'text-[10px] px-1.5 py-0.5 rounded ' + sp.tagClass}>{sp.tag}</span>
                      </div>
                      <span className={'text-[12px] font-bold ' + (i === selectedSupplier ? 'text-violet-600' : 'text-gray-500')}>
                        {sp.score}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                      {sp.dims.map((v, j) => (
                        <div key={j} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 w-7 shrink-0">{scoreDims[j]}</span>
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${v}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-5 text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-gray-400">
                <span>權重：任務適配30%</span>
                <span>質量20%</span>
                <span>控制15%</span>
                <span>可靠性15%</span>
                <span>成本10%</span>
                <span>延遲5%</span>
                <span>連續性5%</span>
              </div>
            </section>

            {/* 生成任務隊列 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-gray-800">生成任務隊列</h2>
                <button className="text-[12px] text-violet-600 hover:underline flex items-center">
                  查看全部 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2.5">
                {tasks.map((t) => {
                  const Icon = t.type === '視頻' ? Video : t.type === '音樂' ? Music : t.type === '字幕' ? Mic : Image
                  return (
                    <div key={t.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] text-gray-700 truncate">
                          {t.name} · {t.type}
                        </p>
                        <div className="h-1.5 mt-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={
                          'text-[11px] font-medium shrink-0 ' +
                          (t.status === '完成' ? 'text-green-600' : 'text-violet-500')
                        }
                      >
                        {t.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* 右欄 */}
          <div className="space-y-6">
            {/* 預覽 / 合成 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-3">預覽 / 合成</h2>
              <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <PlayCircle className="w-10 h-10 mx-auto opacity-60" />
                  <p className="text-[12px] mt-2">合成預覽 · Remotion / HyperFrames</p>
                </div>
                <span className="absolute top-2 left-2 text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                  00:00 / 00:30
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button className="py-2 rounded-lg text-[12.5px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">拆分片段</button>
                <button className="py-2 rounded-lg text-[12.5px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">添加轉場</button>
                <button className="py-2 rounded-lg text-[12.5px] text-white bg-gradient-to-r from-violet-600 to-purple-600 transition-all">一鍵合成</button>
              </div>
              {/* 分鏡對齊 */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <div className="text-[11px] text-gray-400 mb-2">分鏡對齊 · {sampleProject.title}</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {sampleProject.sections.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-[11.5px]">
                      <span className="w-6 h-6 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 text-[10px] font-semibold">
                        {s.label.slice(0, 1)}
                      </span>
                      <span className="text-gray-700 flex-1 truncate">{s.label}</span>
                      <span className="text-gray-400 shrink-0">
                        {fmt(s.start_seconds)}–{fmt(s.end_seconds)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 人工批准門 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-violet-500" />
                <h2 className="text-[15px] font-semibold text-gray-800">人工批准門</h2>
              </div>
              <div
                className={
                  'flex items-center gap-3 border rounded-xl p-3 transition-all ' +
                  (approved === 'approved'
                    ? 'bg-green-50 border-green-100'
                    : approved === 'rejected'
                    ? 'bg-rose-50 border-rose-100'
                    : 'bg-amber-50 border-amber-100')
                }
              >
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-gray-700">未來辦公室場景.png</p>
                  <p className="text-[11px] text-gray-400">
                    {approved === 'approved'
                      ? '已批准 ✓'
                      : approved === 'rejected'
                      ? '已退回 · 待重新生成'
                      : '單資產成本 $0.12 · 待視覺批准'}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setApproved('approved')}
                    className="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <Check className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => setApproved('rejected')}
                    className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">資產聯繫人表（contact sheet）需人工視覺批准後才進入渲染</p>
            </section>

            {/* 成本治理 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-violet-500" />
                <h2 className="text-[15px] font-semibold text-gray-800">成本治理</h2>
              </div>
              <div className="flex items-center justify-between text-[12.5px] text-gray-600 mb-2">
                <span>本次預估</span>
                <span className="font-semibold text-gray-800">
                  ${usedCost.toFixed(2)} / ${budget.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${costPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-3 text-[12px]">
                <span className="text-gray-500">單動作 &gt; $0.50 需批准</span>
                <button
                  onClick={() => setCostApproval((v) => !v)}
                  className={
                    'relative inline-block w-[42px] h-6 rounded-full transition-colors ' +
                    (costApproval ? 'bg-green-500' : 'bg-gray-300')
                  }
                >
                  <span
                    className={
                      'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform ' +
                      (costApproval ? 'translate-x-[18px]' : '')
                    }
                  />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">預算上限預設 $10，超出自動暫停並通知</p>
            </section>

            {/* 質量驗證 */}
            <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-violet-500" />
                <h2 className="text-[14px] font-semibold text-gray-800">質量驗證</h2>
              </div>
              <div className="space-y-2 text-[12.5px] text-gray-600">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 預合成驗證 · 幻燈片風險 6 維評分</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 後渲染自審 · ffprobe 探針</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 抽幀分析 · 畫面連續性</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 音頻分析 · 音量/雜音</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectInput({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="w-full appearance-none px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 outline-none cursor-pointer">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
