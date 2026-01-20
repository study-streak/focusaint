"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/landing/navbar"
import HeroSection from "@/components/landing/hero-section"
import FeaturesSection from "@/components/landing/features-section"
import StorySection from "@/components/landing/story-section"
import TimelineSection from "@/components/landing/timeline-section"
import TeamSection from "@/components/landing/team-section"
import ContactSection from "@/components/landing/contact-section"
import Footer from "@/components/landing/footer"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        router.push("/dashboard")
      }
    }
  }, [router])

  const handleNavClick = (href: string) => {
    const element = document.getElementById(href)
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="w-full overflow-hidden bg-slate-950">
      <Navbar onNavClick={handleNavClick} />
      <HeroSection />
      <FeaturesSection />
      <StorySection />
      <TimelineSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
