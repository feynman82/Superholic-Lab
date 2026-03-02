"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Zap, 
  Timer, 
  BookOpen, 
  Trophy,
  Flame,
  ArrowRight,
  CheckCircle2,
  Star,
  Users,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Target,
    title: 'Daily Sprint',
    description: '30 questions daily with mixed topics. Build consistency and track your progress.',
    color: 'bg-blue-500',
  },
  {
    icon: Flame,
    title: 'Mistake Dojo',
    description: 'Smart spaced repetition. Master your mistakes with AI-powered review scheduling.',
    color: 'bg-orange-500',
  },
  {
    icon: Zap,
    title: 'Top Speed',
    description: '3-minute rapid-fire challenges. Test your speed and accuracy under pressure.',
    color: 'bg-yellow-500',
  },
]

const subjects = [
  { name: 'Mathematics', levels: 'P1-P6', color: 'bg-blue-500', icon: '🔢' },
  { name: 'English', levels: 'P1-P6', color: 'bg-green-500', icon: '📚' },
  { name: 'Science', levels: 'P3-P6', color: 'bg-purple-500', icon: '🔬' },
]

const pricing = [
  {
    name: 'Individual',
    price: '$7.99',
    period: '/month',
    description: 'Perfect for single students',
    features: [
      'All subjects and levels',
      'Unlimited daily sprints',
      'Mistake tracking',
      'Progress analytics',
      'Leaderboard access',
    ],
    highlighted: false,
  },
  {
    name: 'Family',
    price: '$12.99',
    period: '/month',
    description: 'Up to 4 family members',
    features: [
      'Everything in Individual',
      'Multiple student profiles',
      'Parent dashboard',
      'Progress reports',
      'Priority support',
    ],
    highlighted: true,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Superholic Lab</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4" variant="secondary">
                🚀 MOE 2026 Syllabus Aligned
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                The Future of{' '}
                <span className="text-primary">PSLE Revision</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                AI-powered personalized learning for Singapore Primary School students. 
                Master Math, English, and Science with questions calibrated 15-20% above PSLE standard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="gap-2">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>7-day free trial</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Image Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🇸🇬</div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Singapore Primary Students
                  </p>
                  <p className="text-sm text-muted-foreground">
                    White shirts, red/blue shorts/pinafores
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Collaborating at HDB void deck
                  </p>
                </div>
              </div>
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3"
              >
                <Trophy className="w-6 h-6 text-yellow-500" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3"
              >
                <Star className="w-6 h-6 text-primary" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Questions Generated' },
              { value: '5,000+', label: 'Active Students' },
              { value: '95%', label: 'Accuracy Improvement' },
              { value: '4.9/5', label: 'Parent Rating' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Game Modes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multiple ways to learn and practice, designed to keep students engaged and motivated
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Curriculum Coverage</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aligned with MOE 2026 Syllabus for Primary 1 to Primary 6
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl">{subject.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{subject.name}</h3>
                        <Badge variant="secondary">{subject.levels}</Badge>
                      </div>
                    </div>
                    <div className={`h-2 ${subject.color} rounded-full`} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Trusted by Parents Across Singapore</h2>
          <p className="text-muted-foreground mb-8">
            From Tampines to Jurong to Bishan, parents trust Superholic Lab to help their children excel
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Tampines', 'Jurong', 'Bishan', 'Ang Mo Kio', 'Bedok', 'Clementi'].map((area) => (
              <Badge key={area} variant="outline" className="text-lg py-2 px-4">
                {area}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Choose the plan that works for your family</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup">
                      <Button className="w-full mt-6" variant={plan.highlighted ? 'default' : 'outline'}>
                        Get Started
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Excel in PSLE?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of Singapore students already using Superholic Lab to achieve their best
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Superholic Lab</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Superholic Lab. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
