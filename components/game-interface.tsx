"use client"

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuestionCard } from './question-card'
import { useGame, GameMode } from '@/hooks/use-game'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Flame, 
  Clock, 
  Trophy, 
  Target,
  Zap,
  Timer
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface GameInterfaceProps {
  mode: GameMode
  subject: 'math' | 'english' | 'science'
  level: number
  topic?: string
  userId: string
  onComplete: () => void
  onExit: () => void
}

export function GameInterface({
  mode,
  subject,
  level,
  topic,
  userId,
  onComplete,
  onExit,
}: GameInterfaceProps) {
  const { 
    state, 
    isLoading, 
    error, 
    handleAnswer, 
    handlePowerUp,
    saveResults,
    currentQuestion,
    progress 
  } = useGame({ mode, subject, level, topic, userId })

  // Save results when game is complete
  useEffect(() => {
    if (state.isComplete) {
      saveResults()
      onComplete()
    }
  }, [state.isComplete, saveResults, onComplete])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading questions...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">😕</div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onExit}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getModeIcon = () => {
    switch (mode) {
      case 'daily_sprint': return <Target className="w-5 h-5" />
      case 'top_speed': return <Zap className="w-5 h-5" />
      case 'topic_quest': return <Trophy className="w-5 h-5" />
      case 'exam_mode': return <Timer className="w-5 h-5" />
      case 'mistake_review': return <Target className="w-5 h-5" />
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Mode & Subject */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                {getModeIcon()}
                <span className="font-semibold">{getModeTitle()}</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className="capitalize">{subject}</span>
              <span className="text-muted-foreground">|</span>
              <span>P{level}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              {/* Streak */}
              <motion.div 
                className="flex items-center gap-1 text-orange-500"
                animate={state.streak > 2 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Flame className="w-5 h-5" />
                <span className="font-bold">{state.streak}</span>
              </motion.div>

              {/* Score */}
              <div className="flex items-center gap-1 text-primary">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">{Math.round(state.score)}</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(Math.floor((Date.now() - state.startTime) / 1000))}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                onUsePowerUp={handlePowerUp}
                powerUps={state.powerUps}
                questionNumber={state.currentQuestionIndex + 1}
                totalQuestions={state.questions.length}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit Button */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={onExit}>
            Exit Game
          </Button>
        </div>
      </main>
    </div>
  )
}
