import {
  LoginForm,
  SignupForm,
} from 'wasp/client/auth'
import { Link } from 'react-router-dom'
import './auth.css'

import type { CustomizationOptions } from 'wasp/client/auth'

export const authAppearance: CustomizationOptions['appearance'] = {
  colors: {
    brand: 'hsl(var(--brand-primary))',
    brandAccent: 'hsl(var(--brand-accent))',
    submitButtonText: 'hsl(var(--brand-primary-foreground))',
  },
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='mx-auto flex max-w-xl flex-col px-12 py-24 pt-12 font-sans animate-in fade-in sm:px-0 2xl:py-48'>
      {children}
    </div>
  )
}

export function Login() {
  return (
    <Layout>
      <div className='login'>
        <LoginForm appearance={authAppearance} />
      </div>
      <br />
      <span className='login-text text-sm font-medium'>
        Don&apos;t have an account yet?{' '}
        <Link to='/signup' className='underline'>
          go to signup
        </Link>
        .
      </span>
      <br />
      <span className='login-text text-sm font-medium'>
        Forgot your password?{' '}
        <Link to='/request-password-reset' className='underline'>
          reset it
        </Link>
        .
      </span>
    </Layout>
  )
}

export function Signup() {
  return (
    <Layout>
      <div className='login login-text'>
        <SignupForm appearance={authAppearance} />
      </div>
      <br />
      <span className='login-text text-sm font-medium'>
        I already have an account (
        <Link to='/login' className='underline'>
          go to login
        </Link>
        ).
      </span>
    </Layout>
  )
}
