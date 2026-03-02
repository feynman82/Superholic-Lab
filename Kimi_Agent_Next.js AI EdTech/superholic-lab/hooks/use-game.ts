"use client"

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type GameMode = 'daily_sprint' | 'top_speed' | 'topic_quest' | 'exam_mode' | 'mistake_review'

export interface GameState {
  mode: GameMode
  subject: 'math' | 'english' | 'science'
  level: number
  topic?: string
  questions: any[]
  currentQuestionIndex: number
  score: number
  maxScore: number
  answers: { questionId: string; answer: string; isCorrect: boolean; timeSpent: number }[]
  startTime: number
  endTime: number | null
  powerUps: {
    fiftyFifty: boolean
    hint: boolean
    extraTime: boolean
  }
  streak: number
  isComplete: boolean
}

interface UseGameProps {
  mode: GameMode
  subject: 'math' | 'english' | 'science'
  level: number
  topic?: string
  userId: string
}

export function useGame({ mode, subject, level, topic, userId }: UseGameProps) {
  const supabase = createClient()

  const [state, setState] = useState<GameState>({
    mode,
    subject,
    level,
    topic,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    maxScore: 0,
    answers: [],
    startTime: Date.now(),
    endTime: null,
    powerUps: {
      fiftyFifty: true,
      hint: true,
      extraTime: true,
    },
    streak: 0,
    isComplete: false,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch questions based on game mode
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true)

        // Determine question parameters based on game mode
        let count = 10
        let difficultyDistribution = { easy: 0.4, medium: 0.5, hard: 0.1 }

        switch (mode) {
          case 'daily_sprint':
            count = 30
            difficultyDistribution = { easy: 0.4, medium: 0.5, hard: 0.1 }
            break
          case 'top_speed':
            count = 20
            difficultyDistribution = { easy: 0.7, medium: 0.3, hard: 0 }
            break
          case 'topic_quest':
            count = 999 // Unlimited
            difficultyDistribution = { easy: 0.3, medium: 0.5, hard: 0.2 }
            break
          case 'exam_mode':
            count = 50
            difficultyDistribution = { easy: 0.2, medium: 0.6, hard: 0.2 }
            break
        }

        // Call API to generate questions
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            subject,
            topic: topic || 'mixed',
            difficulty: 'mixed',
            count,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch questions')
        }

        const data = await response.json()

        setState(prev => ({
          ...prev,
          questions: data.questions,
          maxScore: data.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [mode, subject, level, topic])

  // Handle answer submission
  const handleAnswer = useCallback((answer: string, isCorrect: boolean) => {
    setState(prev => {
      const currentQuestion = prev.questions[prev.currentQuestionIndex]
      const timeSpent = Math.floor((Date.now() - prev.startTime) / 1000)

      const newAnswers = [...prev.answers, {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        timeSpent,
      }]

      const newStreak = isCorrect ? prev.streak + 1 : 0
      const points = isCorrect ? (currentQuestion.marks || 1) * (1 + Math.floor(newStreak / 3) * 0.1) : 0

      const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1

      return {
        ...prev,
        score: prev.score + points,
        answers: newAnswers,
        streak: newStreak,
        currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        isComplete: isLastQuestion,
        endTime: isLastQuestion ? Date.now() : null,
      }
    })
  }, [])

  // Handle power-up usage
  const handlePowerUp = useCallback((type: 'fifty_fifty' | 'hint' | 'extra_time') => {
    setState(prev => ({
      ...prev,
      powerUps: {
        ...prev.powerUps,
        [type === 'fifty_fifty' ? 'fiftyFifty' : type === 'extra_time' ? 'extraTime' : type]: false,
      },
    }))
  }, [])

  // Save game results
  const saveResults = useCallback(async () => {
    try {
      const duration = Math.floor((Date.now() - state.startTime) / 1000)
      const correctAnswers = state.answers.filter(a => a.isCorrect).length

      // Save activity log
      await supabase.from('activity_log').insert({
        user_id: userId,
        activity_type: mode,
        subject,
        score: Math.round(state.score),
        max_score: state.maxScore,
        duration_seconds: duration,
      })

      // Update progress
      const { data: existingProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .single()

      if (existingProgress) {
        const totalAttempted = existingProgress.questions_attempted + state.answers.length
        const totalCorrect = existingProgress.questions_correct + correctAnswers
        const newAccuracy = Math.round((totalCorrect / totalAttempted) * 100)

        await supabase
          .from('progress')
          .update({
            xp: existingProgress.xp + Math.round(state.score),
            accuracy_rate: newAccuracy,
            questions_attempted: totalAttempted,
            questions_correct: totalCorrect,
            current_streak: state.streak,
            longest_streak: Math.max(existingProgress.longest_streak, state.streak),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id)
      } else {
        await supabase.from('progress').insert({
          user_id: userId,
          subject,
          xp: Math.round(state.score),
          accuracy_rate: Math.round((correctAnswers / state.answers.length) * 100),
          questions_attempted: state.answers.length,
          questions_correct: correctAnswers,
          current_streak: state.streak,
          longest_streak: state.streak,
        })
      }

      // Save mistakes
      const wrongAnswers = state.answers.filter(a => !a.isCorrect)
      for (const wrong of wrongAnswers) {
        const question = state.questions.find(q => q.id === wrong.questionId)
        if (question) {
          await supabase.from('mistake_bank').insert({
            user_id: userId,
            question_data: question,
            wrong_answer: wrong.answer,
            correct_answer: question.correctAnswer,
            next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      }

      // Update leaderboard
      await supabase.from('leaderboard').insert({
        user_id: userId,
        user_name: 'Anonymous', // Will be updated with actual name
        score: Math.round(state.score),
        subject,
        level,
        game_mode: mode,
      })

    } catch (err) {
      console.error('Error saving results:', err)
    }
  }, [state, userId, mode, subject, supabase])

  return {
    state,
    isLoading,
    error,
    handleAnswer,
    handlePowerUp,
    saveResults,
    currentQuestion: state.questions[state.currentQuestionIndex],
    progress: ((state.currentQuestionIndex + 1) / state.questions.length) * 100,
  }
}
