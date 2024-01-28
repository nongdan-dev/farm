import { Op } from '##/nodejs/db'

import { DbW } from './parseFilter'

export const combineAnd = (w1?: DbW, w2?: DbW) => {
  if (!w1 && !w2) {
    return
  }
  if (!w1) {
    return w2
  }
  if (!w2) {
    return w1
  }
  if (pushAnd(w1, w2)) {
    return w1
  }
  if (pushAnd(w2, w1)) {
    return w2
  }
  w1[Op.and] = [w2]
  return w1
}

const pushAnd = (to: DbW, w: DbW) => {
  const and = to[Op.and]
  if (!and) {
    return false
  }
  if (Array.isArray(and)) {
    and.push(w)
  } else {
    to[Op.and] = [and, w]
  }
  return true
}
