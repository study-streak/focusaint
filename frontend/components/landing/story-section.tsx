"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

export default function StorySection() {
  const values = [
    { title: "Trust", description: "Building secure, reliable systems" },
    { title: "Excellence", description: "Striving for continuous improvement" },
    { title: "Community", description: "Growing together as learners" },
  ]

  return (
    <section id="story" className="py-20 px-4 bg-gradient-to-b from-purple-950 to-indigo-950">
      <div className="max-w-6xl mx-auto">
        {/* Company Story */}
        <div className="mb-16">
          <motion.h2
            className="text-4xl sm:text-5xl font-bold text-white mb-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our Story
          </motion.h2>

          <motion.p
            className="text-gray-300 text-lg leading-relaxed max-w-3xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            focusaint was born from a simple belief: everyone has the potential to master their learning journey. Founded by a team of two young minds, we created a platform that transforms how people build and maintain learning habits. We understand that real growth comes through consistent effort, genuine focus, and a supportive community.
          </motion.p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-700/30 rounded-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
            <p className="text-gray-300">
              To empower learners worldwide by providing tools and community that foster consistent habit formation and meaningful growth.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-700/30 rounded-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
            <p className="text-gray-300">
              A world where learning is accessible, personalized, and celebrated as a lifelong journey of discovery and achievement.
            </p>
          </motion.div>
        </div>

        {/* Core Values */}
        <motion.h3
          className="text-3xl font-bold text-white mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Our Core Values
        </motion.h3>

        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-700/30 rounded-lg p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{value.title}</h4>
                  <p className="text-gray-300">{value.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
