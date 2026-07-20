import {
  Home, Lightbulb, FileText, Mic, MonitorPlay, GraduationCap, Eye, Bot,
  Send, Image, FileBox, Clock, History, User, Receipt,
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

// 創作中心導航（個人 IP 視頻課程製作平臺）
// 聲音克隆（CosyVoice2）後為分叉點：並行兩條獨立路徑，生成內容完全不同、互不切換
//   路徑A 數字人視頻（對接 RunningHub digital_customize 純雲端 API，主打口播/IP課，服務端零 GPU）
//   路徑B 動畫生成（OpenMontage 全套，按素材量計費，主打創意視頻）
// 兩路匯合於 智能剪輯 → 成品預覽
// 7 個核心模塊有真實頁面；其餘菜單項以 PlaceholderPage 兜底，避免 404 死鏈。
export const navSections: NavSection[] = [
  { items: [{ label: '工作臺', path: '/dashboard', icon: Home }] },
  {
    header: '創作中心',
    items: [
      { label: '選題挖掘', path: '/topic-mining', icon: Lightbulb },
      { label: '腳本創作', path: '/script-creation', icon: FileText },
      { label: '聲音克隆', path: '/voice-clone', icon: Mic },
      { label: '數字人視頻', path: '/digital-human', icon: Bot },
      { label: '動畫生成', path: '/video-generation', icon: MonitorPlay },
      { label: '課程工坊', path: '/course-workshop', icon: GraduationCap },
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
  {
    header: '帳號與賬單',
    items: [
      { label: '帳號管理', path: '/account', icon: User },
      { label: '訂單計費', path: '/billing', icon: Receipt },
    ],
  },
]
