import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { MeshState } from '../types'
import { mountK4Eye } from './k4-scene'
import type { K4EyeHandle } from './k4-scene'

export function K4Eye({ mesh }: { mesh: MeshState }): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<K4EyeHandle | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const handle = mountK4Eye(el, { reducedMotion })
      // A no-op handle (WebGL unavailable) produces no canvas — fall back to the readout.
      if (!el.querySelector('canvas')) {
        handle.dispose()
        setFailed(true)
        return
      }
      handleRef.current = handle
    } catch {
      setFailed(true)
    }
    return () => {
      handleRef.current?.dispose()
      handleRef.current = null
    }
  }, [])

  useEffect(() => {
    handleRef.current?.update(mesh)
  }, [mesh])

  if (failed) {
    return (
      <div role="img" aria-label="K4 mesh" className="cc-eye">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center',
          }}
        >
          <div className="cc-mono" style={{ fontSize: 22, fontWeight: 700 }}>
            {mesh.vertices}V / {mesh.edges}E
          </div>
          <div className="cc-muted cc-mono" style={{ fontSize: 12 }}>
            {mesh.isostatic ? 'isostatic' : 'non-isostatic'} / rigidity {Math.round(mesh.rigidity * 100)}%
          </div>
          <div className="cc-mono" style={{ fontSize: 12 }}>
            love {Math.round(mesh.love * 100)}%
          </div>
        </div>
      </div>
    )
  }

  return <div ref={ref} className="cc-eye" role="img" aria-label="K4 mesh" />
}
