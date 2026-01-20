"use client"

import { motion } from "framer-motion"
import { Zap, Users, Target, Shield } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Habit Tracking",
    description: "Log your daily sessions and watch your streaks grow",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Define your learning objectives and stay focused",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with other learners and share progress",
    color: "from-green-500 to-emerald-400",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and always protected",
    color: "from-orange-500 to-red-400",
  },
]

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const featureVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-gradient-to-b from-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-center mb-4 text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Powerful Features
        </motion.h2>

        <motion.p
          className="text-gray-300 text-center mb-16 text-lg"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Everything you need to master your learning journey
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                variants={featureVariant}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-blue-700/30 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              >
                <div className={`bg-gradient-to-br ${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
