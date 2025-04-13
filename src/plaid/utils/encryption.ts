import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For GCM
const AUTH_TAG_LENGTH = 16 // For GCM

const ENCRYPTION_KEY_ENV = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY_ENV) {
  throw new Error('ENCRYPTION_KEY is not set in the environment variables.')
}

// Ensure the key is the correct length for AES-256 (32 bytes)
const key = Buffer.from(ENCRYPTION_KEY_ENV, 'hex')
if (key.length !== 32) {
  throw new Error(
    'ENCRYPTION_KEY must be a 64-character hex string (32 bytes).',
  )
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  // Prepend IV and authTag to the encrypted data for storage
  return iv.toString('hex') + authTag.toString('hex') + encrypted
}

export function decrypt(encryptedText: string): string {
  try {
    const iv = Buffer.from(encryptedText.substring(0, IV_LENGTH * 2), 'hex')
    const authTag = Buffer.from(
      encryptedText.substring(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
      'hex',
    )
    const encrypted = encryptedText.substring((IV_LENGTH + AUTH_TAG_LENGTH) * 2)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    // It's often better not to reveal specific error details externally
    // You might want to throw a generic error or handle it differently
    throw new Error('Failed to decrypt data.')
  }
}
