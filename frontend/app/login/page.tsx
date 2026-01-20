"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"login" | "otp">("login")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resending, setResending] = useState(false)

  const handleResendOTP = async () => {
    setResending(true)
    setError("")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message)
      setOtp("") // Clear previous OTP
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP")
    } finally {
      setResending(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem("token", data.token)
        router.push("/dashboard")
        return
      }
      // If unverified, move to OTP step
      if (response.status === 403 && data?.requiresVerification) {
        setStep("otp")
        setError("")
        return
      }
      throw new Error(data.error || data.message || "Login failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message)
      localStorage.setItem("token", data.token)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, delay: 2 }}
      />

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Card */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your focusaint account</p>
          </motion.div>

          {/* Form */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {step === "login" ? (
              <motion.div className="space-y-4" initial={{ x: -20 }} animate={{ x: 0 }} transition={{ duration: 0.3 }}>
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-indigo-400" size={20} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-indigo-900/30 border-indigo-700/50 text-white placeholder:text-gray-400 pl-10 focus:bg-indigo-900/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-indigo-400" size={20} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleLogin()
                        }
                      }}
                      className="bg-indigo-900/30 border-indigo-700/50 text-white placeholder:text-gray-400 pl-10 focus:bg-indigo-900/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p className="text-red-400 text-sm flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {error}
                  </motion.p>
                )}

                {/* Sign In Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleLogin}
                    disabled={loading || !email || !password}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-6 text-lg group"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                    {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />}
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div className="space-y-4" initial={{ x: 20 }} animate={{ x: 0 }} transition={{ duration: 0.3 }}>
                {/* OTP Sent Message */}
                <motion.p className="text-indigo-300 text-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  We've sent a 6-digit code to <span className="font-semibold text-white">{email}</span>
                </motion.p>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-200 font-semibold">
                    Enter OTP Code
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-indigo-400" size={20} />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                      onKeyPress={(e) => e.key === "Enter" && otp.length === 6 && handleVerifyOTP()}
                      maxLength={6}
                      className="bg-indigo-900/30 border-indigo-700/50 text-white text-center text-2xl tracking-[0.5em] placeholder:text-gray-400 pl-10 focus:bg-indigo-900/50 focus:border-indigo-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p className="text-red-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {error}
                  </motion.p>
                )}

                {/* Verify Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-6 text-lg group disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                    {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />}
                  </Button>
                </motion.div>

                {/* Resend OTP Button */}
                <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <button
                    onClick={handleResendOTP}
                    disabled={resending}
                    className="text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {resending ? "Resending..." : "Didn't receive code? Resend OTP"}
                  </button>
                </motion.div>

                {/* Back Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => {
                      setStep("login")
                      setOtp("")
                      setError("")
                    }}
                    variant="outline"
                    className="w-full border-indigo-700 text-indigo-300 hover:bg-indigo-900/30"
                  >
                    Back to Email
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Divider */}
            <motion.div className="relative my-6" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-indigo-700/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-indigo-900/50 to-blue-900/50 text-gray-400">New to focusaint?</span>
              </div>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/signup" className="text-indigo-300 hover:text-indigo-200 font-semibold transition-colors">
                Create an account
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Trust Badge */}
        <motion.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <p className="text-gray-400 text-sm">Your data is secure and encrypted</p>
        </motion.div>
      </motion.div>
    </main>
  )
}
