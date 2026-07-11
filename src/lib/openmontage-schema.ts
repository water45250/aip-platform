// OpenMontage 契約層「真相源」的 TS 化樣例（源自 deliverables/openmontage-schema.js）
// 用於創作中心各頁面渲染「項目 / 分鏡 / 素材 / 成片」等對齊 OpenMontage 的數據。

export interface MontageSection {
  id: string
  label: string
  text: string
  start_seconds: number
  end_seconds: number
  speaker_directions?: string
}

export interface MontageAsset {
  id: string
  type: string
  path: string
  source_tool: string
  model: string
  duration_seconds?: number
  resolution?: string
  format?: string
  cost_usd?: number
  quality_score?: number
}

export interface MontageProject {
  id: string
  title: string
  total_duration_seconds: number
  sections: MontageSection[]
  assets: MontageAsset[]
  outputs: { path: string; format: string; resolution: string; bytes: number }[]
}

export const sampleProject: MontageProject = {
  id: 'proj_future_work',
  title: 'AI 如何重塑未來五年的工作',
  total_duration_seconds: 180,
  sections: [
    { id: 's1', label: '開場', text: '未來五年，工作將被重新定義。', start_seconds: 0, end_seconds: 18, speaker_directions: '明快' },
    { id: 's2', label: '維度一·工具', text: '從單點工具到 Agent 協作，任務可以自動編排。', start_seconds: 18, end_seconds: 58, speaker_directions: '明快' },
    { id: 's3', label: '維度二·效率', text: '內容生產提速 3.4 倍，但判斷力仍屬人。', start_seconds: 58, end_seconds: 104, speaker_directions: '堅定' },
    { id: 's4', label: '維度三·協作', text: '人與 AI 分工：你定方向，它做執行。', start_seconds: 104, end_seconds: 150, speaker_directions: '溫暖' },
    { id: 's5', label: '維度四·風險與結語', text: '版權、幻覺、依賴——守住底線，才能走遠。', start_seconds: 150, end_seconds: 180, speaker_directions: '鄭重' },
  ],
  assets: [
    { id: 'a1', type: 'video', path: 'assets/sc1_opening.mp4', source_tool: 'record', model: 'Sony FX3', duration_seconds: 18, resolution: '1080P', format: 'mp4', cost_usd: 0, quality_score: 0.95 },
    { id: 'a2', type: 'animation', path: 'assets/sc2_agent_graph.mp4', source_tool: 'fal.ai/Kling', model: 'Kling 1.6', duration_seconds: 40, resolution: '1080P', format: 'mp4', cost_usd: 0.42, quality_score: 0.88 },
    { id: 'a3', type: 'image', path: 'assets/sc3_stat_card.png', source_tool: 'fal.ai/Veo', model: 'FLUX', resolution: '1920x1080', format: 'png', cost_usd: 0.12, quality_score: 0.91 },
    { id: 'a4', type: 'video', path: 'assets/sc4_broll.mp4', source_tool: 'fal.ai/Veo', model: 'Veo 3', duration_seconds: 46, resolution: '1080P', format: 'mp4', cost_usd: 0.55, quality_score: 0.86 },
    { id: 'a5', type: 'narration', path: 'assets/narration.wav', source_tool: 'Qwen3-TTS', model: 'Qwen3-TTS', duration_seconds: 180, format: 'wav', cost_usd: 0, quality_score: 0.97 },
    { id: 'a6', type: 'music', path: 'assets/bgm.mp3', source_tool: 'Suno', model: 'Suno v4', duration_seconds: 180, format: 'mp3', cost_usd: 0, quality_score: 0.9 },
    { id: 'a7', type: 'subtitle', path: 'assets/subtitle.vtt', source_tool: 'whisper-align', model: 'whisper-large-v3', format: 'vtt', cost_usd: 0, quality_score: 0.99 },
  ],
  outputs: [{ path: 'final/future-work-1080p.mp4', format: 'mp4', resolution: '1920x1080', bytes: 48200000 }],
}
