import baseX from 'base-x'
import crypto from 'crypto'
import { randomDigits } from 'n-digit-token'
import qs from 'qs'

const base62 = baseX(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
)

export const newDigitsCode = (length = 6) => randomDigits(length)

export const newBase62Secret = (bytes = 64) =>
  base62.encode(crypto.randomBytes(bytes))

export const encodeToken = (t: { id: string; secret: string }) => {
  const { id, secret } = t
  return qs.stringify({ id, secret })
}

export const decodeToken = (encoded?: string) => {
  if (!encoded) {
    return
  }
  const { id, secret } = qs.parse(encoded)
  if (!id || !secret || typeof id !== 'string' || typeof secret !== 'string') {
    return
  }
  return { id, secret }
}
