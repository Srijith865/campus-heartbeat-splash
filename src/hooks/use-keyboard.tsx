
import { useEffect } from "react"

interface UseKeyboardProps {
  onLeftArrow?: () => void
  onRightArrow?: () => void
  onEscape?: () => void
  onEnter?: () => void
  enabled?: boolean
}

export const useKeyboard = ({ 
  onLeftArrow, 
  onRightArrow, 
  onEscape, 
  onEnter, 
  enabled = true 
}: UseKeyboardProps) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          onLeftArrow?.()
          break
        case 'ArrowRight':
          event.preventDefault()
          onRightArrow?.()
          break
        case 'Escape':
          event.preventDefault()
          onEscape?.()
          break
        case 'Enter':
          if (event.target === document.body) {
            event.preventDefault()
            onEnter?.()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onLeftArrow, onRightArrow, onEscape, onEnter, enabled])
}
