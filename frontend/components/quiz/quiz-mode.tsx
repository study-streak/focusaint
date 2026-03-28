"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, Trophy, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  userAnswer?: number
  isCorrect?: boolean
}

interface QuizModeProps {
  videoUrl: string
  onComplete?: (score: number) => void
  onClose?: () => void
}

export function QuizMode({ videoUrl, onComplete, onClose }: QuizModeProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizCompleted, s