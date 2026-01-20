"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Failed to fetch profile")

        const data = await response.json()
        const userData = data.user || data
        setUser(userData)
        setFormData(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          learningGoal: formData.learningGoal,
          preferredStudyTime: formData.preferredStudyTime,
          modePreference: formData.modePreference,
        }),
      })
      if (!response.ok) throw new Error("Failed to update profile")
      setUser(formData)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <DashboardHeader user={user} />

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your learning preferences and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData?.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData?.email || ""} disabled className="bg-muted border-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Learning Goal</Label>
              <select
                id="goal"
                value={formData?.learningGoal || "casual_learner"}
                onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-input rounded-md"
              >
                <option value="student">Student</option>
                <option value="exam_aspirant">Exam Aspirant</option>
                <option value="coding_learner">Coding Learner</option>
                <option value="casual_learner">Casual Learner</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyTime">Preferred Study Time</Label>
              <Input
                id="studyTime"
                type="time"
                value={formData?.preferredStudyTime || "09:00"}
                onChange={(e) => setFormData({ ...formData, preferredStudyTime: e.target.value })}
                className="bg-input border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Preferred Mode</Label>
              <select
                id="mode"
                value={formData?.modePreference || "habit"}
                onChange={(e) => setFormData({ ...formData, modePreference: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-input rounded-md"
              >
                <option value="habit">Habit Mode</option>
                <option value="deep">Deep Mode</option>
              </select>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
