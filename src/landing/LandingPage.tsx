import { staggerContainer, slideInUp } from '../motion/transitionPresets'
import { motion } from 'framer-motion'
import { Button } from '../client/components/ui/button'
import { Link } from 'react-router-dom'
import { routes } from 'wasp/client/router'
import { useState, useEffect } from 'react'

const quotes = [
  {
    quote:
      'Wealth consists not in having great possessions, but in having few wants.',
    author: 'Epictetus',
  },
  {
    quote: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
  },
  {
    quote: 'The greatest wealth is to live content with little.',
    author: 'Plato',
  },
  { quote: 'Enough is as good as a feast.', author: 'Proverb' },
  {
    quote: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    quote: 'Beware of little expenses. A small leak will sink a great ship.',
    author: 'Benjamin Franklin',
  },
  {
    quote:
      "It's not the man who has too little, but the man who craves more, that is poor.",
    author: 'Seneca',
  },
]

export default function Landing() {
  const [dailyQuote, setDailyQuote] = useState<{
    quote: string
    author: string
  } | null>(null)

  useEffect(() => {
    const dayOfWeek = new Date().getDay()
    setDailyQuote(quotes[dayOfWeek % quotes.length])
  }, [])

  return (
    <div className='text-center'>
      <motion.section
        variants={staggerContainer}
        initial='initial'
        animate='animate'
        exit='exit'
        className='space-y-6'
      >
        <motion.h1
          variants={slideInUp}
          className='text-5xl font-thin tracking-tighter md:text-6xl lg:text-7xl'
        >
          what i spent
        </motion.h1>
        <motion.p
          variants={slideInUp}
          className='text-xl text-muted-foreground md:text-2xl'
        >
          this day. this week. this month.
        </motion.p>
        <motion.p
          variants={slideInUp}
          className='mx-auto max-w-xl text-pretty text-lg text-muted-foreground'
        >
          Connect your bank accounts securely via Plaid, automatically track
          your transactions, and gain clear insights into your daily, weekly,
          and monthly spending habits.
        </motion.p>
        <motion.div
          variants={slideInUp}
          className='flex justify-center space-x-4'
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild size='lg' className='font-light'>
              <Link to={routes.SignupRoute.to}>Get Started</Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild variant='outline' size='lg' className='font-light'>
              <Link to={routes.LoginRoute.to}>Log In</Link>
            </Button>
          </motion.div>
        </motion.div>
        {dailyQuote && (
          <motion.figure
            variants={slideInUp}
            className='pt-12 text-sm italic text-muted-foreground'
            initial='initial'
            animate='animate'
            key={dailyQuote.quote}
          >
            <blockquote>&ldquo;{dailyQuote.quote}&rdquo;</blockquote>
            <figcaption className='mt-2 text-pretty text-center text-xs text-muted-foreground'>
              {dailyQuote.author}
            </figcaption>
          </motion.figure>
        )}
      </motion.section>
    </motion.div>
  )
}
