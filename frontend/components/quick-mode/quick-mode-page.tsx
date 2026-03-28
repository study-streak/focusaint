'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Sun, Moon } from 'lucide-react'
import {  PlayCircle, MessageCircle, ListChecks, BookOpen, Image, Code2, TerminalSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { extractYouTubeVideoId, toYouTubeEmbedUrl } from '@/lib/quick-mode'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import TokenUsageIndicator from '@/components/dashboard/token-usage-indicator'
import TokenLimitModal from '@/components/dashboard/token-limit-modal'

type QuickModePageProps = {
  initialUrl?: string
}

type StudyPack = {
  summary: string[]
  quiz: string[]
  flashcards: { front: string; back: string }[]
  infographics: string[]
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const initialStudyPack: StudyPack = {
  summary: [],
  quiz: [],
  flashcards: [],
  infographics: [],
}

export default function QuickModePage({ initialUrl = "" }: QuickModePageProps) {
  // Theme state
  // Dummy user and stats for header (replace with real data if available)
  const user = { name: "User" };
  const stats = { currentStreak: 0 };
  const [theme, setTheme] = useState<'light' | 'dark'>(typeof window !== 'undefined' && window.localStorage.getItem('theme') === 'light' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    window.localStorage.setItem('theme', theme)
  }, [theme])
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('assistant')
  const [authorized, setAuthorized] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [urlInput, setUrlInput] = useState(initialUrl || "")
  const [activeUrl, setActiveUrl] = useState(initialUrl || "")
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [studyPack, setStudyPack] = useState<StudyPack>(initialStudyPack)
  const [loadingPack, setLoadingPack] = useState(false)
  const [sendingChat, setSendingChat] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [loadingFlashcards, setLoadingFlashcards] = useState(false)
  const [loadingInfographics, setLoadingInfographics] = useState(false)
  const [aiError, setAiError] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [terminalInput, setTerminalInput] = useState('npm run build')
  const [showTokenLimitModal, setShowTokenLimitModal] = useState(false)
  const [tokenLimitData, setTokenLimitData] = useState<{
    used: number
    limit: number
    resetAt: string
  } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      const nextPath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/study'
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`)
      setAuthChecked(true)
      return
    }

    setAuthorized(true)
    setAuthChecked(true)
  }, [router])

  const videoId = useMemo(() => extractYouTubeVideoId(activeUrl), [activeUrl])
  const embedUrl = videoId ? toYouTubeEmbedUrl(videoId) : ''
  const canGeneratePack = Boolean(videoId)

  const openVideo = () => {
    setActiveUrl(urlInput.trim())
    setAiError('')
  }

  const applyStudyPack = (data: any) => {
    setStudyPack({
      summary: Array.isArray(data?.summary) ? data.summary : [],
      quiz: Array.isArray(data?.quiz) ? data.quiz : [],
      flashcards: Array.isArray(data?.flashcards) ? data.flashcards : [],
      infographics: Array.isArray(data?.infographics) ? data.infographics : [],
    })
  }

  const getAuthToken = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return null
    }
    return token
  }

  const postAi = useCallback(
    async (endpoint: string, payload: Record<string, unknown>) => {
      const token = getAuthToken()
      if (!token) return null

      const response = await fetch(`${API_BASE_URL}/ai/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        // Check if it's a token limit error
        if (data?.error === 'TOKEN_LIMIT_EXCEEDED' && data?.details) {
          setTokenLimitData({
            used: data.details.used || 0,
            limit: data.details.limit || 0,
            resetAt: data.details.resetAt || new Date().toISOString(),
          })
          setShowTokenLimitModal(true)
        }
        throw new Error(data?.error || data?.message || 'AI request failed')
      }

      return data
    },
    [router],
  )

  const loadSummary = useCallback(
    async (targetUrl?: string) => {
      const url = (targetUrl || activeUrl).trim()
      if (!extractYouTubeVideoId(url)) return

      setLoadingSummary(true)
      setAiError('')
      try {
        const data = await postAi('summary', { videoUrl: url })
        if (!data) return
        setStudyPack((prev) => ({
          ...prev,
          summary: Array.isArray(data?.summary) ? data.summary : [],
        }))
      } catch (error) {
        setAiError(error instanceof Error ? error.message : 'Unable to load summary right now.')
      } finally {
        setLoadingSummary(false)
      }
    },
    [activeUrl, postAi],
  )

  const loadQuiz = useCallback(async () => {
    if (!canGeneratePack || studyPack.quiz.length) return

    setLoadingQuiz(true)
    setAiError('')
    try {
      const data = await postAi('quiz', { videoUrl: activeUrl })
      if (!data) return
      setStudyPack((prev) => ({
        ...prev,
        quiz: Array.isArray(data?.quiz) ? data.quiz : [],
      }))
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to load quiz right now.')
    } finally {
      setLoadingQuiz(false)
    }
  }, [activeUrl, canGeneratePack, postAi, studyPack.quiz.length])

  const loadFlashcards = useCallback(async () => {
    if (!canGeneratePack || studyPack.flashcards.length) return

    setLoadingFlashcards(true)
    setAiError('')
    try {
      const data = await postAi('flashcards', { videoUrl: activeUrl })
      if (!data) return
      setStudyPack((prev) => ({
        ...prev,
        flashcards: Array.isArray(data?.flashcards) ? data.flashcards : [],
      }))
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to load flashcards right now.')
    } finally {
      setLoadingFlashcards(false)
    }
  }, [activeUrl, canGeneratePack, postAi, studyPack.flashcards.length])

  const loadInfographics = useCallback(async () => {
    if (!canGeneratePack || studyPack.infographics.length) return

    setLoadingInfographics(true)
    setAiError('')
    try {
      const data = await postAi('infographics', { videoUrl: activeUrl })
      if (!data) return
      setStudyPack((prev) => ({
        ...prev,
        infographics: Array.isArray(data?.infographics) ? data.infographics : [],
      }))
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to load infographics right now.')
    } finally {
      setLoadingInfographics(false)
    }
  }, [activeUrl, canGeneratePack, postAi, studyPack.infographics.length])

  const generateStudyPack = useCallback(async (targetUrl?: string) => {
    const url = (targetUrl || activeUrl).trim()

    if (!extractYouTubeVideoId(url)) {
      setAiError('Please enter a valid YouTube URL before generating a study pack.')
      return
    }

    const token = getAuthToken()
    if (!token) return

    setLoadingPack(true)
    setAiError('')
    try {
      const data = await postAi('study-pack', { videoUrl: url })
      if (!data) return

      applyStudyPack(data)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to generate study pack right now.')
    } finally {
      setLoadingPack(false)
    }
  }, [activeUrl, postAi])

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed) return
    if (!canGeneratePack) {
      setAiError('Open a valid YouTube video first.')
      return
    }

    const token = getAuthToken()
    if (!token) return

    setChatInput('')
    setSendingChat(true)
    setAiError('')
    setChatHistory((prev) => [...prev, { role: 'user', content: trimmed }])

    try {
      const data = await postAi('chat', {
        videoUrl: activeUrl,
        message: trimmed,
        summary: studyPack.summary,
      })
      if (!data) return

      const reply = typeof data?.reply === 'string' ? data.reply : 'I can help with this topic—ask for a concept breakdown or revision plan.'
      setChatHistory((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send message right now.'
      
      // Check if it's a token limit error
      if (message.includes('TOKEN_LIMIT_EXCEEDED') || message.includes('token limit')) {
        setAiError('Daily AI token limit reached. Resets at midnight UTC. Upgrade to premium for extended limits.')
      } else {
        setAiError(message)
      }
      
      setChatHistory((prev) => [...prev, { role: 'assistant', content: `Error: ${message}` }])
    } finally {
      setSendingChat(false)
    }
  }

  useEffect(() => {
    if (!authorized || !authChecked || !extractYouTubeVideoId(activeUrl)) {
      return
    }

    setStudyPack(initialStudyPack)
    void loadSummary(activeUrl)
  }, [activeUrl, authChecked, authorized, loadSummary])

  useEffect(() => {
    if (!authorized || !authChecked || !extractYouTubeVideoId(activeUrl)) {
      return
    }

    if (activeTab === 'quiz') {
      void loadQuiz()
      return
    }

    if (activeTab === 'flashcards') {
      void loadFlashcards()
      return
    }

    if (activeTab === 'infographics') {
      void loadInfographics()
    }
  }, [activeTab, activeUrl, authChecked, authorized, loadFlashcards, loadInfographics, loadQuiz])

  if (!authChecked || !authorized) {
    return <main className="min-h-screen bg-slate-950" />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <DashboardHeader user={user} stats={stats} />
      
      {/* Token Limit Modal */}
      <TokenLimitModal
        isOpen={showTokenLimitModal}
        onClose={() => setShowTokenLimitModal(false)}
        onUpgrade={() => router.push('/pricing')}
        resetAt={tokenLimitData?.resetAt}
        used={tokenLimitData?.used}
        limit={tokenLimitData?.limit}
      />
      
      {/* Theme toggle button */}
      {/* <div className="flex justify-end p-4">
        <Button
          variant="outline"
          size="icon"
          className="border-white/15 text-white hover:bg-white/10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div> */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-indigo-700/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-700/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-4 md:p-6">
        

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <Card className="border-slate-800/90 bg-slate-900/75 py-4 backdrop-blur">
              
              <CardContent>
                {embedUrl ? (
                  <motion.div
                    initial={{ opacity: 0.85, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="aspect-video overflow-hidden rounded-xl border border-slate-700 bg-black shadow-2xl"
                  >
                    <iframe
                      title="Quick Study Video"
                      src={embedUrl}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </motion.div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/80 p-8 text-sm text-slate-300">
                    Add a valid YouTube link to open the video player.
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 }}
                  className="mt-4 rounded-xl border border-slate-700 bg-slate-950/80 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">AI Summary</p>
                    {loadingSummary || loadingPack ? <Loader2 className="animate-spin text-slate-400" size={14} /> : null}
                  </div>
                  <ul className="space-y-2 text-sm text-slate-200">
                    {(studyPack.summary.length ? studyPack.summary : ['AI summary will load automatically for the opened video.']).map((point, index) => (
                      <motion.li
                        key={point}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}
                      >
                        • {point}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="h-fit border-slate-800/90 bg-slate-900/75 py-4 backdrop-blur lg:sticky lg:top-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-6 h-6 text-indigo-400" /> Study Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-3 mb-4">
                  {/* <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-slate-800/90 p-1 md:grid-cols-6 rounded-xl mb-2"> */}
                    <TabsList
                      className="grid h-auto w-full grid-cols-3 grid-rows-2 gap-1 bg-slate-800/90 p-1 rounded-xl mb-2"
                    >
                    <TabsTrigger value="assistant" className="flex items-center gap-1 px-2 py-1 rounded-lg data-[state=active]:bg-indigo-700/80 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                      <MessageCircle className="w-4 h-4" /> Assistant
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="flex items-center gap-1 px-2 py-1 rounded-lg data-[state=active]:bg-indigo-700/80 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                      <ListChecks className="w-4 h-4" /> Quiz
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="flex items-center gap-1 px-2 py-1 rounded-lg data-[state=active]:bg-indigo-700/80 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                      <BookOpen className="w-4 h-4" /> Flash Cards
                    </TabsTrigger>
                    <TabsTrigger value="infographics" className="flex items-center gap-1 px-2 py-1 rounded-lg data-[state=active]:bg-indigo-700/80 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                      <Image className="w-4 h-4" /> Infographics
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center gap-1 px-2 py-1 rounded-lg data-[state=active]:bg-indigo-700/80 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                      <Code2 className="w-4 h-4" /> Code
                    </TabsTrigger>
                   
                  </TabsList>

                  <TabsContent value="assistant" className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                    {/* Token Usage Indicator */}
                    <div className="mb-3">
                      <TokenUsageIndicator compact={true} showUpgradePrompt={false} />
                    </div>
                    
                    <div className="flex flex-col h-80 max-h-96">
                      <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                        {chatHistory.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400">
                            <MessageCircle className="w-8 h-8 mb-2 text-indigo-400 animate-pulse" />
                            Ask anything about the video, concepts, or revision plans.
                          </div>
                        ) : (
                          chatHistory.map((msg, idx) => (
                            <div key={idx} className={`rounded-lg px-3 py-2 text-sm whitespace-pre-line flex items-center gap-2 ${msg.role === 'assistant' ? 'bg-indigo-900/40 text-indigo-100 self-start' : 'bg-slate-800/60 text-slate-100 self-end'}`}>
                              {msg.role === 'assistant' ? <Sparkles className="w-4 h-4 text-indigo-400" /> : <PlayCircle className="w-4 h-4 text-slate-400" />}
                              <span className="font-semibold mr-2">{msg.role === 'assistant' ? 'Assistant:' : 'You:'}</span>
                              {msg.content}
                            </div>
                          ))
                        )}
                      </div>
                      <form
                        className="flex gap-2 mt-auto"
                        onSubmit={e => {
                          e.preventDefault();
                          if (!sendingChat) sendChatMessage();
                        }}
                      >
                        <Input
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          className="flex-1 border-slate-700 bg-slate-900"
                          placeholder="Ask the assistant..."
                          disabled={sendingChat}
                          autoFocus
                        />
                        <Button type="submit" disabled={sendingChat || !chatInput.trim()}>
                          {sendingChat ? <Loader2 className="animate-spin w-4 h-4" /> : <MessageCircle className="w-4 h-4" />} Send
                        </Button>
                      </form>
                    </div> 
                    {aiError && <div className="mt-2 text-xs text-red-400">{aiError}</div>}
                  </TabsContent>

  

                  <TabsContent value="quiz" className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ListChecks className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs text-slate-400">Quick Quiz</span>
                    </div>
                    {loadingQuiz ? <p className="mb-2 text-xs text-indigo-400 animate-pulse">Loading quiz...</p> : null}
                    <ul className="space-y-2 text-sm text-slate-200">
                      {(studyPack.quiz.length ? studyPack.quiz : ['Generate study pack to create quiz questions.']).map((question) => (
                        <li key={question} className="rounded-lg border border-slate-700 p-2 bg-slate-900/60">{question}</li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="flashcards" className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs text-slate-400">Flash Cards</span>
                    </div>
                    {loadingFlashcards ? <p className="mb-2 text-xs text-indigo-400 animate-pulse">Loading flashcards...</p> : null}
                    <div className="space-y-2">
                      {(studyPack.flashcards.length
                        ? studyPack.flashcards
                        : [{ front: 'No flashcards yet', back: 'Generate study pack to create flash cards.' }]
                      ).map((card) => (
                        <div key={card.front} className="rounded-lg border border-slate-700 p-2 bg-slate-900/60 text-sm">
                          <p className="font-semibold text-indigo-100">Front: {card.front}</p>
                          <p className="text-slate-300">Back: {card.back}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="infographics" className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs text-slate-400">Infographics</span>
                    </div>
                    {loadingInfographics ? <p className="mb-2 text-xs text-indigo-400 animate-pulse">Loading infographics...</p> : null}
                    <ul className="space-y-2">
                      {(studyPack.infographics.length
                        ? studyPack.infographics
                        : ['Generate study pack to get infographic ideas and visual map prompts.']
                      ).map((idea) => (
                        <li key={idea} className="rounded-lg border border-dashed border-indigo-400/40 bg-slate-900/60 p-3">
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="code" className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                    <p className="mb-2 text-xs text-slate-400">Code Editor</p>
                    <Textarea
                      value={codeInput}
                      onChange={(event) => setCodeInput(event.target.value)}
                      className="min-h-40 border-slate-700 bg-slate-900 font-mono"
                      placeholder="Write code snippets or notes here..."
                    />
                    {/* Show terminal below code editor when in code mode */}
                    <div className="mt-4">
                      <p className="mb-2 text-xs text-slate-400">Terminal</p>
                      <div className="space-y-2">
                        <Input
                          value={terminalInput}
                          onChange={(event) => setTerminalInput(event.target.value)}
                          className="border-slate-700 bg-slate-900 font-mono"
                        />
                        <div className="rounded-lg border border-slate-800 bg-black p-3 font-mono text-sm text-emerald-300">
                          $ {terminalInput}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="terminal" className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                    <p className="mb-2 text-xs text-slate-400">Terminal</p>
                    <div className="space-y-2">
                      <Input
                        value={terminalInput}
                        onChange={(event) => setTerminalInput(event.target.value)}
                        className="border-slate-700 bg-slate-900 font-mono"
                      />
                      <div className="rounded-lg border border-slate-800 bg-black p-3 font-mono text-sm text-emerald-300">
                        $ {terminalInput}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

