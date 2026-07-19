import { useState, useCallback } from 'react'
import {
  Edit, Trash2, Check, X, Image, Clock,
  CheckSquare, Send,
} from 'lucide-react'

// ---------- types ----------
interface ChannelInfo {
  platform: string
  name: string
  count: number
  logo?: string
}

interface Draft {
  id: number | string
  type: 'video' | 'image'
  title: string
  cover_path?: string
  video_duration?: number
  video_file_size?: number
  channels_summary?: ChannelInfo[]
  updated_at: string
}

// ---------- mock data ----------
const MOCK_VIDEO_DRAFTS: Draft[] = [
  {
    id: 1,
    type: 'video',
    title: '2025春季新品上市推廣視頻',
    cover_path: '',
    video_duration: 125,
    video_file_size: 156_000_000,
    channels_summary: [
      { platform: 'douyin', name: '抖音', count: 2 },
      { platform: 'kuaishou', name: '快手', count: 1 },
    ],
    updated_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 2,
    type: 'video',
    title: 'AI智能體使用教程_第3集',
    cover_path: '',
    video_duration: 480,
    video_file_size: 420_000_000,
    channels_summary: [
      { platform: 'douyin', name: '抖音', count: 1 },
      { platform: 'xiaohongshu', name: '小紅書', count: 1 },
      { platform: 'bilibili', name: 'B站', count: 1 },
    ],
    updated_at: '2025-01-14T16:20:00Z',
  },
  {
    id: 3,
    type: 'video',
    title: '知識付費課程宣傳片',
    cover_path: '',
    video_duration: 60,
    video_file_size: 88_000_000,
    channels_summary: [
      { platform: 'douyin', name: '抖音', count: 1 },
    ],
    updated_at: '2025-01-13T09:00:00Z',
  },
]

const MOCK_IMAGE_DRAFTS: Draft[] = [
  {
    id: 10,
    type: 'image',
    title: '小紅書穿搭合集_春季系列',
    cover_path: '',
    channels_summary: [
      { platform: 'xiaohongshu', name: '小紅書', count: 3 },
    ],
    updated_at: '2025-01-14T14:00:00Z',
  },
  {
    id: 11,
    type: 'image',
    title: '抖音圖文種草_美妝推薦',
    cover_path: '',
    channels_summary: [
      { platform: 'douyin', name: '抖音', count: 2 },
      { platform: 'kuaishou', name: '快手', count: 1 },
    ],
    updated_at: '2025-01-13T11:30:00Z',
  },
]

// ---------- helpers ----------
function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '剛剛'
  if (minutes < 60) return `${minutes} 分鐘前`
  if (hours < 24) return `${hours} 小時前`
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN')
}

// ---------- component ----------
export default function DraftBoxPage() {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video')
  const [videoDrafts] = useState<Draft[]>(MOCK_VIDEO_DRAFTS)
  const [imageDrafts] = useState<Draft[]>(MOCK_IMAGE_DRAFTS)
  const [selectMode, setSelectMode] = useState(false)
  const [selection, setSelection] = useState<Set<number | string>>(new Set())
  const [loading] = useState(false)

  const currentDrafts = activeTab === 'video' ? videoDrafts : imageDrafts

  const isAllSelected = currentDrafts.length > 0 && selection.size >= currentDrafts.length
  const isIndeterminate = selection.size > 0 && selection.size < currentDrafts.length

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => !prev)
    setSelection(new Set())
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelection(new Set())
    } else {
      setSelection(new Set(currentDrafts.map((d) => d.id)))
    }
  }, [isAllSelected, currentDrafts])

  const toggleSelection = useCallback((id: number | string) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDelete = useCallback((draft: Draft) => {
    if (window.confirm(`確定刪除這個${draft.type === 'video' ? '視頻' : '圖集'}草稿嗎？`)) {
      // TODO: call API
    }
  }, [])

  const handleBatchDelete = useCallback(() => {
    if (selection.size === 0) return
    if (window.confirm(`確認刪除選中的 ${selection.size} 個草稿？此操作不可恢復。`)) {
      // TODO: call API
      setSelection(new Set())
    }
  }, [selection])

  const handleBatchPublish = useCallback(() => {
    if (selection.size === 0) return
    // TODO: call API
  }, [selection])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">草稿箱</h1>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'video'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              視頻草稿
              <span className="ml-2 text-xs text-gray-400">{videoDrafts.length} 個草稿</span>
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'image'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              圖集草稿
              <span className="ml-2 text-xs text-gray-400">{imageDrafts.length} 個草稿</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Toolbar */}
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          selectMode
            ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 shadow-sm shadow-violet-100'
            : 'border-transparent'
        }`}
      >
        {!selectMode ? (
          <button
            onClick={toggleSelectMode}
            disabled={currentDrafts.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckSquare className="w-4 h-4" />
            <span>多選</span>
          </button>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <div
                onClick={toggleSelectAll}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                  isAllSelected
                    ? 'bg-violet-500 border-violet-500'
                    : isIndeterminate
                    ? 'bg-violet-300 border-violet-300'
                    : 'border-gray-300 hover:border-violet-400'
                }`}
              >
                {(isAllSelected || isIndeterminate) && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span>全選</span>
            </label>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-full text-sm text-violet-700">
              <Check className="w-3 h-3" />
              <span>
                已選 <strong className="font-semibold">{selection.size}</strong> / {currentDrafts.length}
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={handleBatchPublish}
              disabled={selection.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>批量發布{selection.size > 0 ? ` (${selection.size})` : ''}</span>
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selection.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>批量刪除</span>
            </button>
            <button
              onClick={toggleSelectMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-all"
            >
              <X className="w-4 h-4" />
              <span>退出多選</span>
            </button>
          </>
        )}
      </div>

      {/* Empty State */}
      {!loading && currentDrafts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock className="w-12 h-12 opacity-30 mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            還沒有保存的{activeTab === 'video' ? '視頻' : '圖集'}草稿
          </p>
        </div>
      )}

      {/* Drafts Grid */}
      {currentDrafts.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {currentDrafts.map((draft) => {
            const isSelected = selection.has(draft.id)
            return (
              <div
                key={draft.id}
                onClick={() => selectMode && toggleSelection(draft.id)}
                className={`group bg-white border rounded-xl overflow-hidden flex flex-col transition-all ${
                  selectMode ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-violet-400 bg-gradient-to-br from-violet-50/80 to-purple-50/80 shadow-lg shadow-violet-100 ring-1 ring-violet-400 -translate-y-0.5'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Cover */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  {draft.cover_path ? (
                    <img
                      src={draft.cover_path}
                      alt={draft.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {draft.video_duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                      {formatDuration(draft.video_duration)}
                    </span>
                  )}

                  {/* Select checkbox (select mode) */}
                  {selectMode && (
                    <div
                      className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                        isSelected
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-transparent shadow-lg shadow-violet-300 scale-110'
                          : 'bg-black/40 border-white/50 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 py-3 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {draft.title || '無標題'}
                  </h3>
                  {draft.channels_summary && draft.channels_summary.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {draft.channels_summary.map((ch) => (
                        <span
                          key={ch.platform}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500"
                        >
                          {ch.name} × {ch.count}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    {draft.video_file_size && <span>{formatFileSize(draft.video_file_size)}</span>}
                    <span>{formatTime(draft.updated_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                {!selectMode && (
                  <div className="flex border-t border-gray-100 mt-auto">
                    <button
                      onClick={() => {
                        /* TODO: edit draft */
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all border-r border-gray-100"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>編輯</span>
                    </button>
                    <button
                      onClick={() => handleDelete(draft)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>刪除</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
