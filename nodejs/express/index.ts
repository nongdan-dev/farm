import 'express-async-errors'

import express, { NextFunction, Request, Response } from 'express'

import { log } from '##/nodejs/log'
import { Error404, IntentionalError } from '##/shared/error'

export { express }

export type ExpressErrorResponse = { error: string } & Pick<
  IntentionalError,
  'isIntentionalError' | 'code' | 'detail' | 'extra'
>

export const expressErrorHandler = (
  err: IntentionalError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!err) {
    err = new Error404('The requested url was not found')
  } else if (typeof err.json !== 'function') {
    log.stack(err)
    err = new IntentionalError('An error occurred', err)
  }
  res.status(err.code).json(err.json())
}
