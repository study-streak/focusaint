"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface NavbarProps {
  onNavClick: (href: string) => void
}

export default function Navbar({ onNavClick }: NavbarProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false)
    onNavClick(href)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gradient-to-b from-indigo-950/95 to-blue-950/95 backdrop-blur border-b border-blue-800/30 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push("/")}
        >
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            focusaint
          </div>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {["features", "story", "timeline", "team", "contact"].map((item) => (
            <motion.button
              key={item}
              onClick={() => handleNavClick(item)}
              className="text-gray-200 hover:text-blue-300 transition-colors text-sm font-medium capitalize"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item}
            </motion.button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
              className="border-blue-400 text-blue-300 hover:bg-blue-950/50"
            >
              Sign In
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              onClick={() => router.push("/signup")}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-blue-500/50"
            >
              Get Started
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-2 text-gray-200"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.1 }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          className="md:hidden bg-gradient-to-b from-indigo-950 to-blue-950 border-t border-blue-800/30 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-3">
            {["features", "story", "timeline", "team", "contact"].map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="text-left text-gray-200 hover:text-blue-300 py-2 capitalize"
              >
                {item}
              </button>
            ))}
            <Button
              size="sm"
              onClick={() => router.push("/login")}
              className="w-full mt-2 border-blue-400 text-blue-300 hover:bg-blue-950/50"
              variant="outline"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/signup")}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
            >
              Get Started
            </Button>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
