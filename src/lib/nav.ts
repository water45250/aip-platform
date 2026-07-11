import {
  Home, Lightbulb, FileText, Mic, MonitorPlay, Scissors, Eye,
  Send, BarChart3, User, Award, LayoutGrid, FolderPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface NavSection {
  header?: string
  items: NavItem[]
}

// 創作中心導航（與 OpenMontage 領域對齊：選題→腳本→聲音→視頻→剪輯→預覽）
// 6 個核心模塊有真實頁面；其餘菜單項以 PlaceholderPage 兜底，避免 404 死鏈。
export const navSections: NavSection[] = [
  { items: [{ label: '工作台', path: '/dashboard', icon: Home }] },
  {
    header: '創作中心',
    items: [
      { label: '選題挖掘', path: '/topic-mining', icon: Lightbulb },
      { label: '腳本創作', path: '/script-creation', icon: FileText },
      { label: '聲音克隆', path: '/voice-clone', icon: Mic },
      { label: '視頻生成', path: '/video-generation', icon: MonitorPlay },
      { label: '智能剪輯', path: '/smart-editing', icon: Scissors },
      { label: '成品預覽', path: '/final-preview', icon: Eye },
    ],
  },
  {
    header: '發布與運營',
    items: [
      { label: '一鍵發布', path: '/publish', icon: Send },
      { label: '數據分析', path: '/analytics', icon: BarChart3 },
    ],
  },
  { items: [{ label: '帳號管理', path: '/account', icon: User }] },
  {
    header: '增值服務',
    items: [
      { label: '導師審核', path: '/mentor', icon: Award },
      { label: '模板中心', path: '/templates', icon: LayoutGrid },
      { label: '素材中心', path: '/assets', icon: FolderPlus },
    ],
  },
]
