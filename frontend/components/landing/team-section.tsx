"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, Twitter } from "lucide-react"

const team = [
  {
    name: "Sarah Chen",
    role: "Co-Founder & CEO",
    bio: "Education technologist passionate about habit formation and lifelong learning.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    social: { github: "#", linkedin: "#", twitter: "#" },
  },
  {
    name: "Alex Rivera",
    role: "Co-Founder & CTO",
    bio: "Full-stack developer dedicated to creating intuitive and powerful learning tools.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    social: { github: "#", linkedin: "#", twitter: "#" },
  },
]

export default function TeamSection() {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const memberVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <section id="team" className="py-20 px-4 bg-gradient-to-b from-indigo-900 to-purple-950">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-center mb-16 text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Meet Our Team
        </motion.h2>

        <motion.div
          className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {team.map((member, index) => (
            <motion.div
              key={index}
              variants={memberVariants}
              whileHover={{ y: -10 }}
              className="text-center"
            >
              <div className="relative mb-6 inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-purple-500/50">
                  <img src={member.image || "/placeholder.svg"} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-indigo-500 to-purple-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ opacity: 0.3 }}
                />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
              <p className="text-indigo-300 font-semibold mb-4">{member.role}</p>
              <p className="text-gray-300 mb-6">{member.bio}</p>

              <div className="flex justify-center gap-4">
                <motion.a
                  href={member.social.github}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  <Github size={20} className="text-white" />
                </motion.a>
                <motion.a
                  href={member.social.linkedin}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  <Linkedin size={20} className="text-white" />
                </motion.a>
                <motion.a
                  href={member.social.twitter}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  <Twitter size={20} className="text-white" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
