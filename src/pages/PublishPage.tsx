import { useState, useRef, useCallback } from 'react'
import {
  Send, Upload, FileText, Wand2, Settings, Smartphone, Play, Image,
  Check, X, Trash2, Clock, AlertTriangle,
} from 'lucide-react'

// ---------- types ----------
interface Account {
  id: number
  name: string
  platform: string
  avatar?: string
}

interface VideoData {
  id?: number | string
  name: string
  url: string
  stored_path?: string
  size?: number
  duration?: number
  orientation?: 'horizontal' | 'portrait'
}

interface CoverData {
  id?: number | string
  name: string
  url: string
  stored_path?: string
}

interface PlatformConfig {
  title: string
  description: string
  tags: string[]
  aiContent?: string
  isOriginal?: boolean
  scheduleTime?: string
}

// ---------- constants ----------
const PLATFORMS = [
  { key: 'douyin', name: '抖音', color: '#000000', bgColor: 'rgba(0,0,0,0.06)' },
  { key: 'xiaohongshu', name: '小紅書', color: '#ff2442', bgColor: 'rgba(255,36,66,0.1)' },
  { key: 'kuaishou', name: '快手', color: '#ff4906', bgColor: 'rgba(255,73,6,0.1)' },
  { key: 'bilibili', name: 'B站', color: '#fb7299', bgColor: 'rgba(251,114,153,0.1)' },
  { key: 'weibo', name: '微博', color: '#e6162d', bgColor: 'rgba(230,22,45,0.1)' },
  { key: 'channels', name: '視頻號', color: '#fa9d3b', bgColor: 'rgba(250,157,59,0.1)' },
  { key: 'toutiao', name: '頭條號', color: '#f85959', bgColor: 'rgba(248,89,89,0.1)' },
  { key: 'youtube', name: 'YouTube', color: '#ff0000', bgColor: 'rgba(255,0,0,0.08)' },
]

const MOCK_ACCOUNTS: Account[] = [
  { id: 1, name: '抖音官方號', platform: '抖音' },
  { id: 2, name: '小紅書主號', platform: '小紅書' },
  { id: 3, name: '快手達人號', platform: '快手' },
  { id: 4, name: 'B站個人號', platform: 'B站' },
  { id: 5, name: '微博個人號', platform: '微博' },
  { id: 6, name: '視頻號官方', platform: '視頻號' },
]

// ---------- helpers ----------
function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// ---------- component ----------
export default function PublishPage() {
  // --- sidebar state ---
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [publishAccountIds, setPublishAccountIds] = useState<Set<number>>(new Set())

  // --- public config ---
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [coverLandscape, setCoverLandscape] = useState<CoverData | null>(null)
  const [coverPortrait] = useState<CoverData | null>(null)

  // --- platform configs ---
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, PlatformConfig>>({})

  // --- account overrides ---
  const [accountOverrides, setAccountOverrides] = useState<Record<number, Partial<PlatformConfig>>>({})

  // --- dialog / ui state ---
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [showBatchPublish, setShowBatchPublish] = useState(false)
  const [publishResults, setPublishResults] = useState<{ label: string; status: 'success' | 'error'; message: string }[]>([])
  const [currentPublishingAccount, setCurrentPublishingAccount] = useState('')

  // --- refs ---
  const videoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // --- computed ---
  const accountGroups = PLATFORMS.map((p) => ({
    ...p,
    accounts: MOCK_ACCOUNTS.filter((a) => a.platform === p.name),
  }))

  const currentPlatform = PLATFORMS.find((p) => p.key === selectedPlatform)
  const currentAccount = MOCK_ACCOUNTS.find((a) => a.id === selectedAccountId)

  // Get merged config for current selection
  const currentConfig: PlatformConfig = (() => {
    const base = selectedPlatform ? platformConfigs[selectedPlatform] : null
    const override = selectedAccountId ? accountOverrides[selectedAccountId] : null
    const defaults: PlatformConfig = { title: '', description: '', tags: [] }
    if (!base && !override) return defaults
    return {
      title: override?.title ?? base?.title ?? '',
      description: override?.description ?? base?.description ?? '',
      tags: override?.tags ?? base?.tags ?? [],
      aiContent: override?.aiContent ?? base?.aiContent ?? '',
      isOriginal: override?.isOriginal ?? base?.isOriginal ?? false,
      scheduleTime: override?.scheduleTime ?? base?.scheduleTime ?? '',
    }
  })()

  // --- sidebar handlers ---
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setSelectedPlatform(key)
    setSelectedAccountId(null)
  }

  const selectAccount = (account: Account, groupKey: string) => {
    setSelectedAccountId(account.id)
    setSelectedPlatform(groupKey)
    setExpandedGroups((prev) => new Set(prev).add(groupKey))
  }

  const toggleAccountSelection = (id: number) => {
    setPublishAccountIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- video handlers ---
  const triggerUploadVideo = () => videoInputRef.current?.click()

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    // Create a temporary video element to get duration
    const tempVid = document.createElement('video')
    tempVid.preload = 'metadata'
    tempVid.onloadedmetadata = () => {
      setVideoData({
        id: Date.now(),
        name: file.name,
        url,
        size: file.size,
        duration: tempVid.duration,
      })
      URL.revokeObjectURL(tempVid.src)
    }
    tempVid.src = url
    e.target.value = ''
  }

  const clearVideo = () => setVideoData(null)

  const triggerUploadCover = () => coverInputRef.current?.click()

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCoverLandscape({ id: Date.now(), name: file.name, url })
    e.target.value = ''
  }

  // --- config handlers ---
  const updateCurrentConfig = (field: keyof PlatformConfig, value: string | string[] | boolean) => {
    if (selectedAccountId) {
      setAccountOverrides((prev) => ({
        ...prev,
        [selectedAccountId]: { ...(prev[selectedAccountId] || {}), [field]: value },
      }))
    } else if (selectedPlatform) {
      setPlatformConfigs((prev) => ({
        ...prev,
        [selectedPlatform]: { ...(prev[selectedPlatform] || { title: '', description: '', tags: [] }), [field]: value },
      }))
    }
  }

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (!t) return
    const currentTags = currentConfig.tags
    if (currentTags.includes(t)) return
    updateCurrentConfig('tags', [...currentTags, t])
  }

  const removeTag = (tag: string) => {
    updateCurrentConfig('tags', currentConfig.tags.filter((t) => t !== tag))
  }

  const [tagInput, setTagInput] = useState('')

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
  }

  // --- publish ---
  const handlePublish = useCallback(async () => {
    if (!videoData) return
    if (publishAccountIds.size === 0) return

    setPublishing(true)
    setPublishProgress(0)
    setPublishResults([])
    setShowBatchPublish(true)

    const allTasks = accountGroups.flatMap((group) =>
      group.accounts
        .filter((a) => publishAccountIds.has(a.id))
        .map((a) => ({ account: a, group })),
    )

    for (let i = 0; i < allTasks.length; i++) {
      const { account } = allTasks[i]
      setCurrentPublishingAccount(account.name)
      setPublishProgress(Math.floor((i / allTasks.length) * 100))

      // Simulate publish delay
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))

      const success = Math.random() > 0.15
      setPublishResults((prev) => [
        ...prev,
        {
          label: account.name,
          status: success ? 'success' : 'error',
          message: success ? '發布成功' : 'Cookie 已過期，請重新登錄',
        },
      ])
    }

    setPublishProgress(100)
    setCurrentPublishingAccount('')
    setPublishing(false)
  }, [videoData, publishAccountIds, accountGroups])

  // --- render ---
  return (
    <div className="flex h-full overflow-hidden">
      {/* ============ LEFT SIDEBAR ============ */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">發布賬號</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            已選 {publishAccountIds.size} 個賬號
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {accountGroups.map((group) => {
            const hasAccounts = group.accounts.length > 0
            return (
              <div key={group.key}>
                <button
                  onClick={() => hasAccounts && toggleGroup(group.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPlatform === group.key && !selectedAccountId
                      ? 'bg-violet-50 text-violet-700'
                      : hasAccounts
                      ? 'text-gray-600 hover:bg-gray-50'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color, opacity: hasAccounts ? 1 : 0.3 }}
                  />
                  <span>{group.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{group.accounts.length}</span>
                </button>
                {expandedGroups.has(group.key) && group.accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id
                  const isPublishSelected = publishAccountIds.has(acc.id)
                  return (
                    <div
                      key={acc.id}
                      className="ml-6 flex items-center gap-2"
                    >
                      <button
                        onClick={() => selectAccount(acc, group.key)}
                        className={`flex-1 text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-violet-100 text-violet-800'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate block">{acc.name}</span>
                      </button>
                      <button
                        onClick={() => toggleAccountSelection(acc.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isPublishSelected
                            ? 'bg-violet-500 border-violet-500'
                            : 'border-gray-300 hover:border-violet-400'
                        }`}
                      >
                        {isPublishSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ============ MAIN AREA ============ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 via-transparent to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">發布視頻</h2>
            {currentPlatform && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: currentPlatform.bgColor,
                  color: currentPlatform.color,
                }}
              >
                {currentPlatform.name}
                {currentAccount ? ` · ${currentAccount.name}` : ' · 默認設置'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <FileText className="w-4 h-4" />
              <span>保存草稿</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <Wand2 className="w-4 h-4" />
              <span>一鍵填寫</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <Settings className="w-4 h-4" />
              <span>批量設置</span>
            </button>
            <button
              disabled={publishing || !videoData || publishAccountIds.size === 0}
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-5 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
            >
              <Send className="w-4 h-4" />
              <span>{publishing ? '發布中...' : '一鍵發布'}</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* ===== Public Config ===== */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-full shadow-sm shadow-violet-200" />
                <span className="text-base font-bold text-gray-900">公共配置</span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">所有賬號共享</span>
              </div>

              {/* Cover */}
              <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50/30">
                <label className="text-sm font-semibold text-gray-600 mb-3 block">封面</label>
                <div className="flex gap-4">
                  {/* Portrait cover */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-400">豎版封面 (9:16)</span>
                    <button
                      onClick={triggerUploadCover}
                      className="w-[120px] h-[213px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                    >
                      {coverPortrait ? (
                        <img src={coverPortrait.url} alt="portrait cover" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-300" />
                          <span className="text-[10px] text-gray-400">上傳封面</span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Landscape cover */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-400">橫版封面 (16:9)</span>
                    <button
                      onClick={triggerUploadCover}
                      className="w-[213px] h-[120px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                    >
                      {coverLandscape ? (
                        <img src={coverLandscape.url} alt="landscape cover" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-300" />
                          <span className="text-[10px] text-gray-400">上傳封面</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent my-6" />

            {/* ===== Platform-specific Settings ===== */}
            {selectedPlatform && publishAccountIds.size > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-1 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: currentPlatform?.color }}
                  />
                  <span className="text-base font-bold text-gray-900">
                    {currentPlatform?.name}
                    {currentAccount ? ` · ${currentAccount.name}` : ' · 默認設置'}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    {currentAccount ? '僅對該賬號生效' : '對該分組所有未自定義的賬號生效'}
                  </span>
                </div>

                {/* 小紅書警告 */}
                {selectedPlatform === 'xiaohongshu' && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border-2 border-red-400 rounded-lg text-red-600 text-sm font-semibold animate-pulse">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>由於小紅書反檢測機制比較惡心，如果出現被警告的情況！請立即停止使用小紅書渠道！</span>
                  </div>
                )}

                <div className="space-y-4 max-w-lg">
                  {/* Title */}
                  <div
                    className="p-4 rounded-xl border transition-all"
                    style={{ borderColor: (currentPlatform?.color || '#ddd') + '26', background: (currentPlatform?.color || '#f5f5f5') + '0a' }}
                  >
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: currentPlatform?.color }}>
                      標題
                    </label>
                    <input
                      type="text"
                      value={currentConfig.title}
                      onChange={(e) => updateCurrentConfig('title', e.target.value)}
                      placeholder="請輸入標題..."
                      maxLength={100}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    <div className="text-right text-[11px] text-gray-400 mt-1">
                      {currentConfig.title.length}/100
                    </div>
                  </div>

                  {/* Description */}
                  <div
                    className="p-4 rounded-xl border transition-all"
                    style={{ borderColor: (currentPlatform?.color || '#ddd') + '26', background: (currentPlatform?.color || '#f5f5f5') + '0a' }}
                  >
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: currentPlatform?.color }}>
                      描述
                    </label>
                    <textarea
                      value={currentConfig.description}
                      onChange={(e) => updateCurrentConfig('description', e.target.value)}
                      placeholder="請輸入描述..."
                      rows={5}
                      maxLength={2000}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                    />
                    <div className="text-right text-[11px] text-gray-400 mt-1">
                      {currentConfig.description.length}/2000
                    </div>
                  </div>

                  {/* Tags */}
                  <div
                    className="p-4 rounded-xl border transition-all"
                    style={{ borderColor: (currentPlatform?.color || '#ddd') + '26', background: (currentPlatform?.color || '#f5f5f5') + '0a' }}
                  >
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: currentPlatform?.color }}>
                      標籤
                    </label>
                    <div className="text-xs text-gray-400 mb-2">
                      {selectedPlatform === 'douyin'
                        ? '官方活動 + 標籤最多 5 個，按回車確認'
                        : selectedPlatform === 'kuaishou'
                        ? '輸入標籤內容，按回車確認（最多 4 個）'
                        : '輸入標籤內容，按回車確認'}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="輸入標籤內容，按回車添加"
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    {currentConfig.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {currentConfig.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs"
                          >
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-violet-900 ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Platform-specific fields */}
                  {selectedPlatform === 'bilibili' && (
                    <div
                      className="p-4 rounded-xl border transition-all"
                      style={{ borderColor: (currentPlatform?.color || '#ddd') + '26', background: (currentPlatform?.color || '#f5f5f5') + '0a' }}
                    >
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: currentPlatform?.color }}>
                        分區
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 text-gray-600"
                      >
                        <option value="">請選擇分區</option>
                        <option value="knowledge">知識</option>
                        <option value="life">生活</option>
                        <option value="game">遊戲</option>
                        <option value="entertainment">娛樂</option>
                        <option value="tech">科技</option>
                      </select>
                    </div>
                  )}

                  {/* AI Content Declaration */}
                  <div
                    className="p-4 rounded-xl border transition-all"
                    style={{ borderColor: (currentPlatform?.color || '#ddd') + '26', background: (currentPlatform?.color || '#f5f5f5') + '0a' }}
                  >
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: currentPlatform?.color }}>
                      作品聲明
                    </label>
                    <select
                      value={currentConfig.aiContent || ''}
                      onChange={(e) => updateCurrentConfig('aiContent', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 text-gray-600"
                    >
                      <option value="">請選擇</option>
                      <option value="ai_generated">內容由 AI 生成</option>
                      <option value="ai_assisted">內容由 AI 輔助創作</option>
                      <option value="original">原創內容</option>
                      <option value="repost">轉載內容</option>
                    </select>
                  </div>

                  {/* Schedule */}
                  <div
                    className="p-4 rounded-xl border transition-all"
                    style={{ borderColor: (currentPlatform?.color || '#ddd') + '26', background: (currentPlatform?.color || '#f5f5f5') + '0a' }}
                  >
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: currentPlatform?.color }}>
                      定時發布
                    </label>
                    <input
                      type="datetime-local"
                      value={currentConfig.scheduleTime || ''}
                      onChange={(e) => updateCurrentConfig('scheduleTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-gray-600"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      留空則立即發布
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No account selected */}
            {publishAccountIds.size === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-violet-100 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Smartphone className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">請先在左側賬號設置</p>
                <p className="text-xs text-gray-400 mt-1">選擇賬號後才能配置對應渠道的發布設置</p>
              </div>
            )}

            {publishAccountIds.size > 0 && !selectedPlatform && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-violet-100 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">請在左側選擇一個平台分組</p>
                <p className="text-xs text-gray-400 mt-1">選擇後可配置該平台的個性化發布設置</p>
              </div>
            )}
          </div>

          {/* Right: Phone Preview */}
          <aside className="w-[360px] flex-shrink-0 bg-gradient-to-b from-white to-gray-50/50 border-l border-gray-100 flex flex-col items-center justify-center overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 w-full flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">視頻預覽</span>
            </div>

            {/* Phone Mockup */}
            <div className="py-6 px-4 w-full flex justify-center">
              <div className={`relative bg-gradient-to-b from-[#1e1e3a] to-[#14142a] border-2 border-violet-200/30 rounded-[28px] p-2.5 shadow-2xl shadow-gray-300/50 w-[85%] ${
                videoData?.orientation === 'horizontal' ? 'aspect-[16/10]' : 'aspect-[9/16]'
              }`}>
                <div className="w-16 h-1.5 bg-gray-600 rounded-full mx-auto mb-2" />
                <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center mx-0.5 mb-1">
                  {videoData ? (
                    <video
                      src={videoData.url}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <button
                      onClick={triggerUploadVideo}
                      className="flex flex-col items-center gap-2 text-gray-400 hover:text-violet-400 transition-all"
                    >
                      <Upload className="w-7 h-7" />
                      <span className="text-xs font-medium">上傳視頻</span>
                    </button>
                  )}
                </div>
                <div className="w-10 h-1 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full mx-auto mt-1.5 opacity-50" />
              </div>
            </div>

            {/* Video Actions */}
            <div className="flex gap-2 px-5 pb-4 w-full">
              <button
                onClick={triggerUploadVideo}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>本地上傳</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
                <Image className="w-3.5 h-3.5" />
                <span>素材庫</span>
              </button>
            </div>

            {/* Video Info */}
            {videoData && (
              <div className="mx-5 mb-5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between w-[calc(100%-40px)]">
                <span className="text-xs text-gray-600 truncate flex-1">{videoData.name}</span>
                <button onClick={clearVideo} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Video Metadata */}
            {videoData && videoData.duration !== undefined && (
              <div className="mx-5 mb-5 flex gap-3 w-[calc(100%-40px)] text-xs text-gray-400">
                {videoData.duration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(videoData.duration)}
                  </span>
                )}
                {videoData.size && (
                  <span>{formatSize(videoData.size)}</span>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Batch Publish Dialog */}
      {showBatchPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {publishProgress >= 100 ? '發布完成' : '正在發布中...'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {publishProgress < 100 ? (
                <>
                  <div className="text-sm text-gray-600">
                    正在推送到：{currentPublishingAccount}
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${publishProgress}%` }}
                    />
                  </div>
                  <div className="text-center text-sm text-gray-500">{publishProgress}%</div>
                </>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {publishResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {r.status === 'success' ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-gray-700">{r.label}</span>
                      <span className={`text-xs ml-auto ${r.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {r.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowBatchPublish(false)
                  if (publishProgress >= 100) {
                    setPublishing(false)
                    setPublishProgress(0)
                  }
                }}
                disabled={publishing}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {publishProgress >= 100 ? '關閉' : '取消'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
    </div>
  )
}
