"use client"

import { motion } from "framer-motion"

const timelineEvents = [
  { year: "DEC 2025", title: "The Beginning", description: "Founded focusaint with a vision to revolutionize learning habits" },
  { year: "FEB 2026", title: "Beta Launch", description: "Launched beta version with 100+ early adopters" },
  { year: "MAR 2026", title: "Community Growth", description: "Reached 10,000+ active learners building their habits" },
  { year: "JUNE 2026", title: "Global Expansion", description: "Expanding to 50+ countries with multi-language support" },
]

export default function TimelineSection() {
  return (
    <section id="timeline" className="py-20 px-4 bg-gradient-to-b from-indigo-950 to-blue-950">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-center mb-16 text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Our Journey
        </motion.h2>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-400" />

          <div className="space-y-12">
            {timelineEvents.map((event, index) => (
              <motion.div
                key={index}
                className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {/* Content */}
                <div className={`w-5/12 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8"}`}>
                  <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-700/30 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                    <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                    <p className="text-gray-300">{event.description}</p>
                  </div>
                </div>

                {/* Timeline Dot */}
                <motion.div
                  className="w-2/12 flex justify-center"
                  whileHover={{ scale: 1.3 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full border-4 border-indigo-950 shadow-lg shadow-blue-500/50" />
                </motion.div>

                {/* Year */}
                <div className="w-5/12 text-center">
                  <motion.div
                    className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
                    viewport={{ once: true }}
                  >
                    {event.year}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
