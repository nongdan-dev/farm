import CircularJson from 'circular-json'

import { ExpressErrorResponse } from '##/nodejs/express'

export const thenAxiosError = (response?: any) => {
  const json = response?.data as ExpressErrorResponse | undefined
  if (json?.error) {
    throw IntentionalError.fromJson(json)
  }
  return json
}
export const catchAxiosError = (err?: any) => {
  if (!err) {
    return
  }
  thenAxiosError(err.response)
  throw new IntentionalError(err.message, CircularJson.stringify(err.response))
}

export class IntentionalError extends Error {
  isIntentionalError = true

  code = 500
  detail?: string
  extra?: unknown

  constructor(message: string, err?: Error | string) {
    super(message)
    if (err) {
      this.detail = err instanceof Error ? err.message : `${err}`
    }
  }

  static fromJson = (json: ExpressErrorResponse) => {
    const err = new IntentionalError(json.error)
    err.isIntentionalError = json.isIntentionalError || false
    err.code = json.code || 500
    err.detail = json.detail
    err.extra = json.extra
  }
  json = (): ExpressErrorResponse => ({
    error: this.message,
    isIntentionalError: this.isIntentionalError,
    code: this.code,
    detail: this.detail,
    extra: this.extra,
  })
}

export class Error404 extends IntentionalError {
  code = 404
  constructor(detail?: string) {
    super(
      'Unavailable',
      detail ||
        'The data is no longer available or you dont have permission to perform this action',
    )
  }
}
