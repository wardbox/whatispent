
import { staggerContainer, slideInUp } from '../motion/transitionPresets'
import { motion } from 'motion/react'
import { Button } from '../client/components/ui/button'
import { Link } from 'react-router-dom'
import { routes } from 'wasp/client/router'

export default function Landing() {

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
          className='mx-auto max-w-xl text-lg text-muted-foreground text-pretty'
        >
          Connect your bank accounts securely via Plaid, automatically track
          your transactions, and gain clear insights into your daily, weekly,
          and monthly spending habits.
        </motion.p>
        <motion.div
          variants={slideInUp}
          className='flex justify-center space-x-4'
        >
          <Button asChild size='lg' className='font-light'>
            <Link to={routes.SignupRoute.to}>Get Started</Link>
          </Button>
          <Button asChild variant='outline' size='lg' className='font-light'>
            <Link to={routes.LoginRoute.to}>Log In</Link>
          </Button>
        </motion.div>
      </motion.section>
    </div>
  )
}

