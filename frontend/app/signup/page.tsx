"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { User, Mail, Zap, ArrowRight, Lock, Check, X } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [learningGoal, setLearningGoal] = useState("")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<"signup" | "otp">("signup")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resending, setResending] = useState(false)

  // Password validation checks (keep in sync with backend)
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const isPasswordValid = Object.values(passwordChecks).every(Boolean)

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

  const handleSignup = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, learningGoal }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message)
      setStep("otp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
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
      if (!response.ok) throw new Error(data.message)
      localStorage.setItem("token", data.token)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-teal-950 to-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"
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
        <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 border border-green-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Join focusaint</h1>
            <p className="text-gray-300">Start building unbreakable learning habits</p>
          </motion.div>

          {/* Form */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {step === "signup" ? (
              <motion.div className="space-y-4" initial={{ x: -20 }} animate={{ x: 0 }} transition={{ duration: 0.3 }}>
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-200 font-semibold">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-green-400" size={20} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-green-900/30 border-green-700/50 text-white placeholder:text-gray-400 pl-10 focus:bg-green-900/50 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-green-400" size={20} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-green-900/30 border-green-700/50 text-white placeholder:text-gray-400 pl-10 focus:bg-green-900/50 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-green-400" size={20} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 chars, 1 number, 1 uppercase"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-green-900/30 border-green-700/50 text-white placeholder:text-gray-400 pl-10 focus:bg-green-900/50 focus:border-green-500 transition-all"
                    />
                  </div>
                  {/* Password checklist */}
                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      {passwordChecks.length ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <X size={16} className="text-red-400" />
                      )}
                      <span className={passwordChecks.length ? "text-green-300" : "text-gray-300"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.uppercase ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <X size={16} className="text-red-400" />
                      )}
                      <span className={passwordChecks.uppercase ? "text-green-300" : "text-gray-300"}>
                        Contains an uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.number ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <X size={16} className="text-red-400" />
                      )}
                      <span className={passwordChecks.number ? "text-green-300" : "text-gray-300"}>
                        Contains a number (0-9)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Learning Goal Input */}
                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-gray-200 font-semibold">
                    Learning Goal
                  </Label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-3 text-green-400" size={20} />
                    <Input
                      id="goal"
                      type="text"
                      placeholder="e.g., Master JavaScript"
                      value={learningGoal}
                      onChange={(e) => setLearningGoal(e.target.value)}
                      className="bg-green-900/30 border-green-700/50 text-white placeholder:text-gray-400 pl-10 focus:bg-green-900/50 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p className="text-red-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {error}
                  </motion.p>
                )}

                {/* Create Account Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSignup}
                    disabled={loading || !email || !name || !isPasswordValid}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold py-6 text-lg group"
                  >
                    {loading ? "Creating..." : "Create Account"}
                    {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />}
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div className="space-y-4" initial={{ x: 20 }} animate={{ x: 0 }} transition={{ duration: 0.3 }}>
                {/* OTP Sent Message */}
                <motion.p className="text-green-300 text-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  We've sent a 6-digit verification code to <span className="font-semibold text-white">{email}</span>
                </motion.p>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-200 font-semibold">
                    Enter Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    maxLength= {6}
                    className="bg-green-900/30 border-green-700/50 text-white text-center text-2xl tracking-[0.5em] placeholder:text-gray-400 focus:bg-green-900/50 focus:border-green-500 transition-all font-semibold"
                  />
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
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold py-6 text-lg group disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Sign Up"}
                    {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />}
                  </Button>
                </motion.div>

                {/* Resend OTP Button */}
                <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <button
                    onClick={handleResendOTP}
                    disabled={resending}
                    className="text-green-300 hover:text-green-200 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {resending ? "Resending..." : "Didn't receive code? Resend OTP"}
                  </button>
                </motion.div>

                {/* Back Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => {
                      setStep("signup")
                      setOtp("")
                      setError("")
                    }}
                    variant="outline"
                    className="w-full border-green-700 text-green-300 hover:bg-green-900/30"
                  >
                    Back to Signup
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Divider */}
            <motion.div className="relative my-6" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-green-700/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-green-900/50 to-teal-900/50 text-gray-400">Already have an account?</span>
              </div>
            </motion.div>

            {/* Sign In Link */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/login" className="text-green-300 hover:text-green-200 font-semibold transition-colors">
                Sign in to your account
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Trust Badge */}
        <motion.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <p className="text-gray-400 text-sm">Your account is secure and your data is encrypted</p>
        </motion.div>
      </motion.div>
    </main>
  )
}
