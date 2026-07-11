import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title = '功能' }: { title?: string }) {
  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-violet-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-sm text-gray-500">此功能正在建設中，敬請期待。</p>
        </div>
      </div>
    </div>
  )
}
