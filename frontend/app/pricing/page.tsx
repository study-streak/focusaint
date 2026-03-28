"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Crown, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createCheckoutSession, redirectToCheckout } from "@/lib/subscription"

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

  async function handleUpgrade(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    try {
      const session = await createCheckoutSession(plan)
      redirectToCheckout(session.url)
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  const features = {
    free: [
      "Quick Mode (3 sessions/day)",
      "Daily limited AI tokens",
      "Local device storage",
      "Basic analytics",
      "Streak tracking",
      "Community (read-only)",
    ],
    premium: [
      "Unlimited sessions",
      "Extended AI token limits",
      "Cloud sync across devices",
      "Multi-device access",
      "Advanced analytics",
      "Data export (PDF/Markdown)",
      "Priority AI responses",
      "Custom AI persona",
      "Private groups",
      "Streak insurance",
      "No ads",
      "Early access to features",
    ],
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 left-1/4 w-[520px] h-[520px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-24 right-1/4 w-[560px] h-[560px] bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-slate-400 text-lg">
            Unlock your full potential with premium features
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-white/15 bg-white/5 backdrop-blur-xl h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-6 h-6 text-blue-400" />
                  <CardTitle className="text-2xl">Free</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  Perfect for getting started
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-slate-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.free.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => router.push("/signup")}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl h-full relative overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-xs font-semibold">
                  POPULAR
                </div>
              </div>

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <CardTitle className="text-2xl">Premium</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  Unlock all features and maximize your potential
                </CardDescription>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    or <span className="text-white font-semibold">$95.99/year</span> (save 20%)
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.premium.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={loading !== null}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {loading === 'monthly' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Monthly - $9.99
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleUpgrade('yearly')}
                    disabled={loading !== null}
                    variant="outline"
                    className="w-full border-purple-500/50 text-white hover:bg-purple-500/10"
                  >
                    {loading === 'yearly' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Yearly - $95.99 (Save 20%)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="border-white/15 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Yes! You can cancel your premium subscription at any time. You'll
                  continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/15 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  What happens to my data if I downgrade?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Your data is never deleted. If you downgrade, you'll lose access to
                  premium features but all your data remains safe and accessible.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/15 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  How do AI token limits work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Free users get a daily limit of AI tokens that resets at midnight UTC.
                  Premium users get significantly higher limits to support extensive AI
                  usage throughout the day.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </main>
  )
}
