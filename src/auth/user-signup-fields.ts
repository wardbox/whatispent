/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineUserSignupFields } from 'wasp/auth/providers/types'
import dayjs from 'dayjs'

const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []

export const getEmailUserFields = defineUserSignupFields({
  username: (data: any) => data.email,
  isAdmin: (data: any) => adminEmails.includes(data.email),
  email: (data: any) => data.email,
  trialEndsAt: () => dayjs().add(7, 'days').toDate(),
})
