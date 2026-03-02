"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { GameInterface } from '@/components/game-interface'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { GameMode } from '@/hooks/use-game'
import { curriculumTopics } from '@/lib/gemini/prompts'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

function PlayContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') as GameMode || 'daily_sprint'

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [subject, setSubject] = useState<'math' | 'english' | 'science'>('math')
  const [level, setLevel] = useState<number>(1)
  const [topic, setTopic] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Get user level from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single()

      if (profile) {
        setLevel(profile.level)
      }

      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleStartGame = () => {
    setGameStarted(true)
  }

  const handleGameComplete = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (gameStarted) {
    return (
      <GameInterface
        mode={mode}
        subject={subject}
        level={level}
        topic={topic}
        userId={user.id}
        onComplete={handleGameComplete}
        onExit={() => setGameStarted(false)}
      />
    )
  }

  const getModeTitle = () => {
    switch (mode) {
      case 'daily_sprint': return 'Daily Sprint'
      case 'top_speed': return 'Top Speed'
      case 'topic_quest': return 'Topic Quest'
      case 'exam_mode': return 'Exam Mode'
      case 'mistake_review': return 'Mistake Dojo'
    }
  }

  const getModeDescription = () => {
    switch (mode) {
      case 'daily_sprint': return '30 questions with mixed topics. 40% Easy, 50% Medium, 10% Hard.'
      case 'top_speed': return '3-minute rapid-fire MCQ. 70% Easy, 30% Medium. Speed is key!'
      case 'topic_quest': return 'Unlimited questions on a specific topic. Adaptive difficulty.'
      case 'exam_mode': return 'Full paper simulation with PSLE timing. 20/60/20 difficulty split.'
      case 'mistake_review': return 'Review and master your mistakes with spaced repetition.'
    }
  }

  const availableTopics = curriculumTopics[subject]?.[level as keyof typeof curriculumTopics.math] || []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="font-bold text-lg">{getModeTitle()}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <p className="text-muted-foreground">{getModeDescription()}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['math', 'english', 'science'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={subject === s ? 'default' : 'outline'}
                      onClick={() => {
                        setSubject(s)
                        setTopic('')
                      }}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Level Selection */}
              <div className="space-y-2">
                <Label>Primary Level</Label>
                <Select 
                  value={level.toString()} 
                  onValueChange={(v) => {
                    setLevel(parseInt(v))
                    setTopic('')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <SelectItem key={l} value={l.toString()}>
                        Primary {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic Selection (for Topic Quest mode) */}
              {mode === 'topic_quest' && availableTopics.length > 0 && (
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopics.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleStartGame}
                disabled={mode === 'topic_quest' && !topic}
              >
                Start Game
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <PlayContent />
    </Suspense>
  )
}
