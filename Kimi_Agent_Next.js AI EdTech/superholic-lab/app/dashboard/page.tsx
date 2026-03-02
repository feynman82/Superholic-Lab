"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Zap, 
  Timer, 
  BookOpen, 
  Trophy,
  Flame,
  TrendingUp,
  Calendar,
  User,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const gameModes = [
  {
    id: 'daily_sprint',
    name: 'Daily Sprint',
    description: '30 questions, mixed topics',
    icon: Target,
    color: 'bg-blue-500',
    href: '/play?mode=daily_sprint',
  },
  {
    id: 'top_speed',
    name: 'Top Speed',
    description: '3-minute rapid-fire',
    icon: Zap,
    color: 'bg-yellow-500',
    href: '/play?mode=top_speed',
  },
  {
    id: 'topic_quest',
    name: 'Topic Quest',
    description: 'Focus on specific topics',
    icon: BookOpen,
    color: 'bg-green-500',
    href: '/play?mode=topic_quest',
  },
  {
    id: 'exam_mode',
    name: 'Exam Mode',
    description: 'Full paper simulation',
    icon: Timer,
    color: 'bg-purple-500',
    href: '/play?mode=exam_mode',
  },
  {
    id: 'mistake_review',
    name: 'Mistake Dojo',
    description: 'Review and master mistakes',
    icon: Flame,
    color: 'bg-orange-500',
    href: '/play?mode=mistake_review',
  },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)

      setProgress(progressData || [])
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalXP = progress.reduce((sum, p) => sum + (p.xp || 0), 0)
  const totalQuestions = progress.reduce((sum, p) => sum + (p.questions_attempted || 0), 0)
  const avgAccuracy = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + (p.accuracy_rate || 0), 0) / progress.length)
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-bold text-xl">Superholic Lab</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Ready to continue your PSLE journey?</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Total XP</span>
              </div>
              <div className="text-2xl font-bold">{totalXP.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Questions</span>
              </div>
              <div className="text-2xl font-bold">{totalQuestions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Accuracy</span>
              </div>
              <div className="text-2xl font-bold">{avgAccuracy}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Flame className="w-4 h-4" />
                <span className="text-sm">Streak</span>
              </div>
              <div className="text-2xl font-bold">
                {Math.max(...progress.map(p => p.current_streak || 0), 0)} days
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subject Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Subject Progress</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {['math', 'english', 'science'].map((subject) => {
              const subjectProgress = progress.find(p => p.subject === subject)
              const xp = subjectProgress?.xp || 0
              const accuracy = subjectProgress?.accuracy_rate || 0

              return (
                <Card key={subject}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold capitalize">{subject}</span>
                      <Badge variant="secondary">{xp} XP</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span>{accuracy}%</span>
                      </div>
                      <Progress value={accuracy} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Game Modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-4">Choose Your Challenge</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameModes.map((mode, index) => (
              <Link key={mode.id} href={mode.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${mode.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <mode.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{mode.name}</h3>
                          <p className="text-sm text-muted-foreground">{mode.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
