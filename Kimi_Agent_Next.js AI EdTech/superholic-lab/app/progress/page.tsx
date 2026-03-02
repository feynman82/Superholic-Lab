"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  Flame, 
  Trophy,
  ArrowLeft,
  Loader2,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

export default function ProgressPage() {
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [mistakes, setMistakes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Fetch progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)

      setProgress(progressData || [])

      // Fetch recent activities
      const { data: activityData } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setActivities(activityData || [])

      // Fetch mistakes
      const { data: mistakeData } = await supabase
        .from('mistake_bank')
        .select('*')
        .eq('user_id', user.id)
        .eq('mastered', false)
        .limit(5)

      setMistakes(mistakeData || [])
      setLoading(false)
    }

    getData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const totalXP = progress.reduce((sum, p) => sum + (p.xp || 0), 0)
  const totalQuestions = progress.reduce((sum, p) => sum + (p.questions_attempted || 0), 0)
  const totalCorrect = progress.reduce((sum, p) => sum + (p.questions_correct || 0), 0)
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  const chartData = progress.map(p => ({
    subject: p.subject,
    xp: p.xp || 0,
    accuracy: p.accuracy_rate || 0,
    attempted: p.questions_attempted || 0,
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Your Progress</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                <span className="text-sm">Best Streak</span>
              </div>
              <div className="text-2xl font-bold">
                {Math.max(...progress.map(p => p.longest_streak || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>XP by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="xp" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accuracy by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
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
              const attempted = subjectProgress?.questions_attempted || 0

              return (
                <Card key={subject}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold capitalize">{subject}</span>
                      <Badge variant="secondary">{xp} XP</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span>{accuracy}%</span>
                      </div>
                      <Progress value={accuracy} />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Questions</span>
                        <span>{attempted}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activities yet. Start playing to track your progress!
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {activity.activity_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {activity.subject} • {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{activity.score}/{activity.max_score}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((activity.score / activity.max_score) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Mistakes to Review */}
        {mistakes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold mb-4">Mistakes to Review</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  You have {mistakes.length} questions waiting for review
                </p>
                <Link href="/play?mode=mistake_review">
                  <Button>Review Mistakes</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}
