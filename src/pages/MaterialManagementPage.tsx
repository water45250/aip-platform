import { useState, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Upload, Trash2, Play, Image, Film, LayoutGrid,
  X, Eye,
} from 'lucide-react'

// ---------- types ----------
interface Material {
  id: number | string
  original_filename: string
  file_type: 'image' | 'video'
  file_size: number
  stored_path: string
  thumbnail_url?: string
  storage_type: 'local' | 's3'
  upload_time: string
}

// ---------- mock data ----------
const MOCK_MATERIALS: Material[] = [
  {
    id: 1,
    original_filename: '产品宣传封面图_v3.png',
    file_type: 'image',
    file_size: 2_480_000,
    stored_path: '',
    storage_type: 'local',
    upload_time: '2025-01-15 10:32:00',
  },
  {
    id: 2,
    original_filename: '2025春季新品发布会花絮.mp4',
    file_type: 'video',
    file_size: 156_000_000,
    stored_path: '',
    thumbnail_url: '',
    storage_type: 's3',
    upload_time: '2025-01-14 16:20:00',
  },
  {
    id: 3,
    original_filename: '小红书种草素材_穿搭系列_01.jpg',
    file_type: 'image',
    file_size: 3_120_000,
    stored_path: '',
    storage_type: 'local',
    upload_time: '2025-01-14 14:10:00',
  },
  {
    id: 4,
    original_filename: '抖音口播_知识分享_第8期.mp4',
    file_type: 'video',
    file_size: 320_000_000,
    stored_path: '',
    thumbnail_url: '',
    storage_type: 's3',
    upload_time: '2025-01-13 09:45:00',
  },
  {
    id: 5,
    original_filename: 'B站封面_科技测评.png',
    file_type: 'image',
    file_size: 1_850_000,
    stored_path: '',
    storage_type: 'local',
    upload_time: '2025-01-12 11:00:00',
  },
  {
    id: 6,
    original_filename: '快手短视频_搞笑段子.mp4',
    file_type: 'video',
    file_size: 45_000_000,
    stored_path: '',
    thumbnail_url: '',
    storage_type: 's3',
    upload_time: '2025-01-11 18:30:00',
  },
  {
    id: 7,
    original_filename: '公众号头图_年终总结.png',
    file_type: 'image',
    file_size: 4_200_000,
    stored_path: '',
    storage_type: 'local',
    upload_time: '2025-01-10 08:15:00',
  },
  {
    id: 8,
    original_filename: 'YouTube_Vlog_旅行日记_EP3.mp4',
    file_type: 'video',
    file_size: 890_000_000,
    stored_path: '',
    thumbnail_url: '',
    storage_type: 's3',
    upload_time: '2025-01-09 22:00:00',
  },
]

// ---------- helpers ----------
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'))
  if (isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PLACEHOLDER_SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFhMWQyNCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='

// ---------- component ----------
export default function MaterialManagementPage() {
  const [materials] = useState<Material[]>(MOCK_MATERIALS)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [loading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // filter
  const filtered = materials.filter((m) => {
    if (typeFilter !== 'all' && m.file_type !== typeFilter) return false
    if (searchKeyword.trim()) {
      return m.original_filename.toLowerCase().includes(searchKeyword.trim().toLowerCase())
    }
    return true
  })

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // simulate refresh
    await new Promise((r) => setTimeout(r, 600))
    setIsRefreshing(false)
  }, [])

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleDelete = useCallback((mat: Material) => {
    if (window.confirm(`確定要刪除素材「${mat.original_filename}」嗎？\n將同時刪除對應的文件，該操作不可恢復。`)) {
      // TODO: call API
    }
  }, [])

  const typeOptions = [
    { value: 'all' as const, label: '全部', icon: LayoutGrid },
    { value: 'image' as const, label: '圖片', icon: Image },
    { value: 'video' as const, label: '視頻', icon: Film },
  ]

  const hasFilter = searchKeyword.trim() !== '' || typeFilter !== 'all'

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">素材管理</h1>
        <p className="text-sm text-gray-500 mt-1">統一管理所有上傳的視頻與圖片素材</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl">
        {/* Search */}
        <div className="relative w-72 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="按文件名搜索..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex gap-1 p-1 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0">
          {typeOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = typeFilter === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-800 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '刷新中' : '刷新'}</span>
          </button>
          <button
            onClick={handleUpload}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-200 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>上傳素材</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*"
          className="hidden"
          onChange={() => {
            // TODO: handle upload
          }}
        />
      </div>

      {/* Cards Grid */}
      <div className="min-h-[320px]">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {filtered.map((mat) => (
              <div
                key={mat.id}
                className="group bg-white border border-gray-100 rounded-xl overflow-hidden transition-all hover:border-violet-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/50"
              >
                {/* Preview */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {mat.file_type === 'image' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
                      <Image className="w-12 h-12 text-violet-300" />
                    </div>
                  ) : (
                    <>
                      {mat.thumbnail_url ? (
                        <img
                          src={mat.thumbnail_url}
                          alt={mat.original_filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_SVG
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900/20">
                          <Play className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {/* Play button */}
                      <button
                        onClick={() => setPreviewMaterial(mat)}
                        className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center pl-0.5 text-white opacity-85 hover:opacity-100 hover:scale-110 hover:bg-gradient-to-br hover:from-violet-500 hover:to-purple-600 transition-all z-10"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                      {/* Video badge */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-white text-[10px] font-medium z-10">
                        <Play className="w-2.5 h-2.5" />
                        <span>視頻</span>
                      </div>
                    </>
                  )}

                  {/* Storage badge */}
                  <span
                    className={`absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 backdrop-blur-md rounded text-[11px] font-semibold z-10 group-hover:opacity-0 transition-opacity ${
                      mat.storage_type === 's3'
                        ? 'bg-blue-500/70 text-white border border-blue-400/50'
                        : 'bg-black/60 text-gray-200 border border-white/10'
                    }`}
                  >
                    {mat.storage_type === 's3' ? 'S3' : '本地'}
                  </span>

                  {/* Delete button (hover) */}
                  <button
                    onClick={() => handleDelete(mat)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/90 hover:scale-110 transition-all z-20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Bottom hover info */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex justify-end bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] font-medium pointer-events-none z-10">
                    <span>{mat.file_type === 'image' ? '圖片' : '視頻'}</span>
                  </div>
                </div>

                {/* Meta */}
                <div className="px-2.5 py-2">
                  <div className="text-xs text-gray-700 font-medium truncate" title={mat.original_filename}>
                    {mat.original_filename}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400 tabular-nums">
                    <span>{formatFileSize(mat.file_size)}</span>
                    <span className="opacity-50">·</span>
                    <span>{formatDate(mat.upload_time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Image className="w-12 h-12 opacity-30" />
            <p className="text-sm text-gray-500 font-medium">
              {hasFilter ? '沒有匹配的素材' : '素材庫還是空的'}
            </p>
            <p className="text-xs text-gray-400">
              {hasFilter ? '試試其他關鍵詞或類型' : '上傳你的第一個素材吧'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex justify-center py-4 bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-all">
              上一頁
            </button>
            <button className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg shadow-sm shadow-violet-200">
              1
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-all">
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {previewMaterial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewMaterial(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">素材預覽</h3>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-gray-900/20 flex flex-col items-center gap-3">
              {previewMaterial.file_type === 'video' ? (
                <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
                  <Eye className="w-16 h-16 text-gray-600" />
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <Image className="w-16 h-16 text-violet-300" />
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="text-gray-700 font-medium">{previewMaterial.original_filename}</span>
                <span>{formatFileSize(previewMaterial.file_size)}</span>
                <span>{formatDate(previewMaterial.upload_time)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
