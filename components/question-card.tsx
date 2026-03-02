"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, shuffleArray } from '@/lib/utils'
import { Lightbulb, HelpCircle } from 'lucide-react'

interface Question {
  id: string
  type: 'mcq' | 'open' | 'fill_blank'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  marks: number
  heuristic?: string
}

interface QuestionCardProps {
  question: Question
  onAnswer: (answer: string, isCorrect: boolean) => void
  onUsePowerUp: (type: 'fifty_fifty' | 'hint') => void
  powerUps: {
    fiftyFifty: boolean
    hint: boolean
  }
  questionNumber: number
  totalQuestions: number
}

export function QuestionCard({
  question,
  onAnswer,
  onUsePowerUp,
  powerUps,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)

  const handleOptionClick = (option: string) => {
    if (selectedAnswer) return

    setSelectedAnswer(option)
    const isCorrect = option === question.correctAnswer

    setTimeout(() => {
      setShowExplanation(true)
    }, 500)

    setTimeout(() => {
      onAnswer(option, isCorrect)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setEliminatedOptions([])
      setShowHint(false)
    }, 3000)
  }

  const handleFiftyFifty = () => {
    if (!question.options || eliminatedOptions.length > 0) return

    const wrongOptions = question.options.filter(o => o !== question.correctAnswer)
    const toEliminate = shuffleArray(wrongOptions).slice(0, 2)
    setEliminatedOptions(toEliminate)
    onUsePowerUp('fifty_fifty')
  }

  const handleHint = () => {
    setShowHint(true)
    onUsePowerUp('hint')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto backdrop-blur-md bg-white/90 border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Q{questionNumber}/{totalQuestions}
            </Badge>
            <Badge className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
            <Badge variant="secondary">{question.topic}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">{question.marks} marks</span>
        </div>
        <CardTitle className="text-xl leading-relaxed">
          {question.question}
        </CardTitle>
        {question.heuristic && (
          <Badge variant="outline" className="w-fit text-xs">
            Heuristic: {question.heuristic}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Power-ups */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFiftyFifty}
            disabled={!powerUps.fiftyFifty || eliminatedOptions.length > 0 || !!selectedAnswer}
            className="flex items-center gap-2"
          >
            <span className="font-bold">50:50</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHint}
            disabled={!powerUps.hint || showHint || !!selectedAnswer}
            className="flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Hint
          </Button>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Think about the key concepts in this question. 
                  {question.heuristic && ` Consider using the ${question.heuristic} method.`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options */}
        {question.options && (
          <div className="grid gap-3">
            {question.options.map((option, index) => {
              const isEliminated = eliminatedOptions.includes(option)
              const isSelected = selectedAnswer === option
              const isCorrect = option === question.correctAnswer

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isEliminated ? 0.3 : 1,
                    y: 0,
                    scale: isSelected ? 1.02 : 1
                  }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant={isSelected 
                      ? isCorrect ? 'default' : 'destructive'
                      : 'outline'
                    }
                    className={cn(
                      "w-full justify-start text-left h-auto py-4 px-6 text-lg",
                      isEliminated && "pointer-events-none"
                    )}
                    onClick={() => handleOptionClick(option)}
                    disabled={!!selectedAnswer || isEliminated}
                  >
                    <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                    {isSelected && isCorrect && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-xl"
                      >
                        ✓
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Open-ended answer input */}
        {question.type === 'open' && (
          <div className="space-y-3">
            <textarea
              className="w-full p-4 border rounded-lg min-h-[120px] text-lg"
              placeholder="Type your answer here..."
              disabled={!!selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
            <Button 
              className="w-full"
              onClick={() => selectedAnswer && handleOptionClick(selectedAnswer)}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </Button>
          </div>
        )}

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4"
            >
              <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
              <p className="text-blue-800 whitespace-pre-line">{question.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
