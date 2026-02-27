'use client'

/**
 * SignaturePad — Canvas-based signature input.
 *
 * Supports touch + mouse input. Provides clear, undo, and PNG export.
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { DsButton } from '@/components/ds/DsButton'
import { Undo2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DS_TEXT } from '@/lib/design-system/tokens'

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
}

export interface SignaturePadProps {
  width?: number
  height?: number
  strokeColor?: string
  strokeWidth?: number
  className?: string
  onChange?: (hasSignature: boolean) => void
}

export function SignaturePad({
  width = 320,
  height = 160,
  strokeColor = '#3C1E1E',
  strokeWidth = 2.5,
  className,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const currentStroke = useRef<Point[]>([])

  const hasSignature = strokes.length > 0

  // Redraw all strokes
  const redraw = useCallback(
    (strokesToDraw: Stroke[]) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const stroke of strokesToDraw) {
        if (stroke.points.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
      }
    },
    [strokeColor, strokeWidth],
  )

  useEffect(() => {
    redraw(strokes)
  }, [strokes, redraw])

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    currentStroke.current = [getPoint(e)]
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const point = getPoint(e)
    currentStroke.current.push(point)

    // Draw current stroke in real-time
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pts = currentStroke.current
    if (pts.length < 2) return
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const handleEnd = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentStroke.current.length > 1) {
      const newStrokes = [...strokes, { points: currentStroke.current }]
      setStrokes(newStrokes)
      onChange?.(true)
    }
    currentStroke.current = []
  }

  const handleClear = () => {
    setStrokes([])
    onChange?.(false)
  }

  const handleUndo = () => {
    const newStrokes = strokes.slice(0, -1)
    setStrokes(newStrokes)
    onChange?.(newStrokes.length > 0)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-xl ring-1 ring-dotori-200/50 dark:ring-dotori-700/50">
        <canvas
          ref={canvasRef}
          width={width * 2}
          height={height * 2}
          style={{ width, height }}
          className="w-full touch-none bg-white dark:bg-dotori-950"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {!hasSignature && (
          <p className={cn('pointer-events-none absolute inset-0 flex items-center justify-center text-sm', DS_TEXT.muted)}>
            여기에 서명해주세요
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <DsButton variant="ghost" onClick={handleUndo} disabled={!hasSignature}>
          <Undo2 className="h-4 w-4" />
          되돌리기
        </DsButton>
        <DsButton variant="ghost" onClick={handleClear} disabled={!hasSignature}>
          <Trash2 className="h-4 w-4" />
          지우기
        </DsButton>
      </div>
    </div>
  )
}

/**
 * Export the current canvas as a base64 PNG data URL.
 */
export function exportSignaturePNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
