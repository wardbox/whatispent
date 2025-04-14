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

const googleDataSchema = z.object({
  profile: z.object({
    email: z.string(),
    email_verified: z.boolean(),
  }),
})

export const getGoogleUserFields = defineUserSignupFields({
  email: data => {
    const googleData = googleDataSchema.parse(data)
    return googleData.profile.email
  },
  username: data => {
    const googleData = googleDataSchema.parse(data)
    return googleData.profile.email
  },
  isAdmin: data => {
    const googleData = googleDataSchema.parse(data)
    if (!googleData.profile.email_verified) {
      return false
    }
    return adminEmails.includes(googleData.profile.email)
  },
  trialEndsAt: () => dayjs().add(7, 'days').toDate(),
})

export function getGoogleAuthConfig() {
  return {
    scopes: ['profile', 'email'], // must include at least 'profile' for Google
  }
}
