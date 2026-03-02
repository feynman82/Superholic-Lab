import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { 
  generateQuestionPrompt, 
  generateCacheKey,
  curriculumTopics 
} from '@/lib/gemini/prompts'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Rate limit: 50 requests per day per user
const DAILY_LIMIT = 50

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { level, subject, topic, difficulty = 'medium', count = 1 } = body

    // Validate inputs
    if (!level || !subject || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: level, subject, topic' },
        { status: 400 }
      )
    }

    // Check rate limit
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData, error: usageError } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error checking API usage:', usageError)
    }

    const currentCount = usageData?.request_count || 0

    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily rate limit exceeded. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Check cache first
    const cacheKey = generateCacheKey(level, subject, topic, difficulty)
    const { data: cachedQuestion, error: cacheError } = await supabase
      .from('questions_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cachedQuestion && !cacheError) {
      // Update usage count
      await supabase
        .from('api_usage')
        .upsert({
          user_id: user.id,
          date: today,
          request_count: currentCount + 1
        })

      // Increment cache usage
      await supabase
        .from('questions_cache')
        .update({ usage_count: cachedQuestion.usage_count + 1 })
        .eq('id', cachedQuestion.id)

      return NextResponse.json({
        questions: cachedQuestion.question_data,
        cached: true
      })
    }

    // Generate new questions using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = generateQuestionPrompt(level, subject, topic, difficulty, count)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    let questions
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || 
                       text.match(/```\s*([\s\S]*?)```/) ||
                       [null, text]
      const jsonStr = jsonMatch[1] || text
      questions = JSON.parse(jsonStr.trim())
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.log('Raw response:', text)
      return NextResponse.json(
        { error: 'Failed to parse question data' },
        { status: 500 }
      )
    }

    // Cache the generated questions
    await supabase
      .from('questions_cache')
      .upsert({
        cache_key: cacheKey,
        level,
        subject,
        topic,
        difficulty,
        question_data: questions,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

    // Update API usage
    await supabase
      .from('api_usage')
      .upsert({
        user_id: user.id,
        date: today,
        request_count: currentCount + 1
      })

    return NextResponse.json({
      questions,
      cached: false
    })

  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get available topics
export async function GET() {
  return NextResponse.json({ topics: curriculumTopics })
}
