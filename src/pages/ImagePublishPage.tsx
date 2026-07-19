import { useState, useRef } from 'react'
import {
  Upload, Image, Send, FileText, Wand2, Settings, Smartphone,
  ChevronLeft, ChevronRight, Plus, X, Check,
} from 'lucide-react'

// ---------- types ----------
interface PlatformAccount {
  id: number
  name: string
  platform: string
  avatar?: string
}

interface ImageItem {
  id: string
  name: string
  url: string
  uploading: boolean
  progress: number
}

interface PlatformConfig {
  title: string
  description: string
  tags: string[]
}

// ---------- constants ----------
const PLATFORMS = [
  { key: 'xiaohongshu', name: '小紅書', color: '#ff2442', bgColor: 'rgba(255,36,66,0.1)' },
  { key: 'douyin', name: '抖音', color: '#000000', bgColor: 'rgba(0,0,0,0.05)' },
  { key: 'kuaishou', name: '快手', color: '#ff4906', bgColor: 'rgba(255,73,6,0.1)' },
  { key: 'weibo', name: '微博', color: '#e6162d', bgColor: 'rgba(230,22,45,0.1)' },
]

const MOCK_ACCOUNTS: PlatformAccount[] = [
  { id: 1, name: '小紅書主號', platform: '小紅書' },
  { id: 2, name: '抖音官方號', platform: '抖音' },
  { id: 3, name: '快手達人號', platform: '快手' },
  { id: 4, name: '微博個人號', platform: '微博' },
]

// ---------- component ----------
export default function ImagePublishPage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [coverImage] = useState<ImageItem | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [publishAccountIds, setPublishAccountIds] = useState<Set<number>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [publishing] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [configs, setConfigs] = useState<Record<string, PlatformConfig>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // group accounts by platform
  const accountGroups = PLATFORMS.map((p) => ({
    ...p,
    accounts: MOCK_ACCOUNTS.filter((a) => a.platform === p.name),
  }))

  const currentPlatform = PLATFORMS.find((p) => p.key === selectedPlatform)

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setSelectedPlatform(key)
  }

  const toggleAccount = (id: number) => {
    setPublishAccountIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newImages: ImageItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      name: f.name,
      url: URL.createObjectURL(f),
      uploading: false,
      progress: 100,
    }))
    setImages((prev) => [...prev, ...newImages].slice(0, 35))
    e.target.value = ''
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const updateConfig = (platform: string, field: keyof PlatformConfig, value: string | string[]) => {
    setConfigs((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] || { title: '', description: '', tags: [] }), [field]: value },
    }))
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">發布賬號</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            已選 {publishAccountIds.size} 個賬號
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {accountGroups.map((group) => (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatform === group.key
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span>{group.name}</span>
                <span className="ml-auto text-xs text-gray-400">{group.accounts.length}</span>
              </button>
              {expandedGroups.has(group.key) && group.accounts.length > 0 && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {group.accounts.map((acc) => {
                    const isSelected = publishAccountIds.has(acc.id)
                    return (
                      <button
                        key={acc.id}
                        onClick={() => toggleAccount(acc.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-violet-100 text-violet-800'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="truncate">{acc.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 via-transparent to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">圖集發布</h2>
            {currentPlatform && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: currentPlatform.bgColor,
                  color: currentPlatform.color,
                }}
              >
                {currentPlatform.name} · 個性化設置
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
              disabled={publishing || publishAccountIds.size === 0}
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
            {/* Public Config */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-full shadow-sm shadow-violet-200" />
                <span className="text-base font-bold text-gray-900">公共配置</span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">所有賬號共享</span>
              </div>

              {/* Cover Image */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">封面圖片</label>
                <div
                  onClick={triggerUpload}
                  className="w-40 h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                >
                  {coverImage ? (
                    <img src={coverImage.url} alt="cover" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">上傳封面</span>
                    </>
                  )}
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="border border-violet-100 rounded-xl p-5 bg-violet-50/30">
                <label className="text-sm font-semibold text-gray-600 mb-3 block">
                  圖片列表 ({images.length}/35)
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-white border border-gray-100 group">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 35 && (
                    <button
                      onClick={triggerUpload}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                    >
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400">添加圖片</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent my-6" />

            {/* Platform-specific settings */}
            {selectedPlatform && publishAccountIds.size > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-1 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: currentPlatform?.color }}
                  />
                  <span className="text-base font-bold text-gray-900">
                    {currentPlatform?.name} · 默認設置
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    對該分組所有未自定義的賬號生效
                  </span>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">標題</label>
                    <input
                      type="text"
                      value={configs[selectedPlatform]?.title || ''}
                      onChange={(e) => updateConfig(selectedPlatform, 'title', e.target.value)}
                      placeholder="輸入標題..."
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">描述</label>
                    <textarea
                      value={configs[selectedPlatform]?.description || ''}
                      onChange={(e) => updateConfig(selectedPlatform, 'description', e.target.value)}
                      placeholder="輸入描述..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">標籤</label>
                    <input
                      type="text"
                      value={(configs[selectedPlatform]?.tags || []).join(', ')}
                      onChange={(e) =>
                        updateConfig(
                          selectedPlatform,
                          'tags',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        )
                      }
                      placeholder="輸入標籤，用逗號分隔..."
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* No selection hint */}
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
                  <Image className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">請在左側選擇一個平台分組</p>
                <p className="text-xs text-gray-400 mt-1">選擇後可配置該平台的個性化發布設置</p>
              </div>
            )}
          </div>

          {/* Right: Phone Preview */}
          <aside className="w-[340px] flex-shrink-0 bg-gradient-to-b from-white to-gray-50/50 border-l border-gray-100 flex flex-col items-center justify-center overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 w-full flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">圖片預覽</span>
              {images.length > 0 && (
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 transition-all">
                  <span>放大預覽</span>
                </button>
              )}
            </div>

            {/* Phone Mockup */}
            <div className="py-6 px-4 w-full flex justify-center">
              <div className="relative bg-gradient-to-b from-[#1e1e3a] to-[#14142a] border-2 border-violet-200/30 rounded-[28px] p-2.5 shadow-2xl shadow-gray-300/50 w-[85%]">
                <div className="w-16 h-1.5 bg-gray-600 rounded-full mx-auto mb-2" />
                <div className="aspect-[9/16] bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center">
                  {images.length > 0 ? (
                    <div className="relative w-full h-full">
                      <img
                        src={images[previewIndex]?.url}
                        alt={images[previewIndex]?.name}
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setPreviewIndex((i) => (i - 1 + images.length) % images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPreviewIndex((i) => (i + 1) % images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button onClick={triggerUpload} className="flex flex-col items-center gap-2 text-gray-400 hover:text-violet-500 transition-all">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-medium">上傳圖片</span>
                    </button>
                  )}
                </div>
                <div className="w-10 h-1 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full mx-auto mt-2 opacity-50" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5 w-full">
              <button
                onClick={triggerUpload}
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

            {images.length > 0 && (
              <div className="mx-5 mb-5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between w-[calc(100%-40px)]">
                <span className="text-xs text-gray-600 truncate flex-1">
                  {images[previewIndex]?.name || '未選擇圖片'}
                </span>
                <span className="text-[11px] text-violet-500 font-semibold flex-shrink-0 ml-2">
                  {previewIndex + 1}/{images.length}
                </span>
              </div>
            )}
          </aside>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
