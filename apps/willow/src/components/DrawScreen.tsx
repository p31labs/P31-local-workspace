import { useRef, useEffect } from 'react'

interface Props {
  onBack: () => void
}

export default function DrawScreen({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const stickers = ['⭐', '❤️', '🌈', '🎵', '🌸', '🦋']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  function handleStickerClick(sticker: string) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.font = '40px sans-serif'
    ctx.fillText(sticker, 50, 50)
  }

  function handleBrushChange() {
  }

  function handlePatternChange() {
  }

  function handleAction() {
  }

  return (
    <div>
      <h1>Draw!</h1>
      <div>
        <button onClick={onBack}>BACK</button>
      </div>
      <canvas ref={canvasRef} className="draw-canvas" width={400} height={400} />
      <div>
        {(['round', 'square', 'spray'] as const).map((b) => (
          <button key={b} onClick={() => handleBrushChange()}>{b.charAt(0).toUpperCase() + b.slice(1)}</button>
        ))}
      </div>
      <div>
        {(['none', 'grid', 'dots', 'lines'] as const).map((p) => (
          <button key={p} onClick={() => handlePatternChange()}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
        ))}
      </div>
      <div>
        <button onClick={() => handleAction()}>Undo</button>
        <button onClick={() => handleAction()}>Redo</button>
        <button onClick={() => handleAction()}>Clear</button>
        <button onClick={() => handleAction()}>Save</button>
        <button onClick={() => handleAction()}>Share</button>
      </div>
      <div className="sticker-palette">
        {stickers.map((s) => (
          <button key={s} className="sticker-btn" onClick={() => handleStickerClick(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
