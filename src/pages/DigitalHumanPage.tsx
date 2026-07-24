import { useEffect } from 'react'

export default function DigitalHumanPage() {
  useEffect(() => {
    document.title = '數字人視頻 - AIP'
  }, [])

  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] bg-white">
      <iframe
        src="/pixelle-video/"
        title="Pixelle-Video 数字人"
        className="w-full h-full border-0 block"
        allow="fullscreen"
        loading="eager"
      />
    </div>
  )
}
