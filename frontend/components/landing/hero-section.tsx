"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

export default function HeroSection() {
  const router = useRouter()

  const orbs = [
    { size: 300, duration: 20, delay: 0, x: -100, y: 100 },
    { size: 200, duration: 25, delay: 5, x: 100, y: -50 },
    { size: 250, duration: 30, delay: 10, x: 50, y: 150 },
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 overflow-hidden flex items-center justify-center px-4 pt-20">
      {/* Animated Background Orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, rgb(59, 130, 246), transparent)`,
          }}
          animate={{
            x: [orb.x, orb.x + 50, orb.x - 50],
            y: [orb.y, orb.y - 50, orb.y + 50],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}

      {/* Content */}
      <div className="max-w-4xl mx-auto text-center z-10">
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Master Your <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Learning</span>
        </motion.h1>

        <motion.p
          className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Build unbreakable learning habits with focusaint. Focus, learn, grow.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={() => router.push("/signup")}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-blue-500/50 text-lg"
          >
            Get Started <ArrowRight className="ml-2" size={20} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="border-blue-400 text-blue-300 hover:bg-blue-950/50 text-lg"
          >
            Learn More
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
