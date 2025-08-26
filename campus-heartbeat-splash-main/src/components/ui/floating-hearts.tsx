import { motion } from "framer-motion"
import { Heart } from "lucide-react"

export const FloatingHearts = () => {
  const hearts = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: Math.random() * 16 + 8,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 4,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-primary/20"
          style={{
            left: `${heart.left}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0.3, 0.8, 0],
            scale: [0, 1, 1.1, 0.9, 0],
            y: [-20, -60, -40, -80, -20],
            x: [0, 10, -5, 15, 0],
            rotate: [0, 5, -3, 8, 0]
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Heart 
            size={heart.size} 
            className="fill-current" 
          />
        </motion.div>
      ))}
    </div>
  )
}