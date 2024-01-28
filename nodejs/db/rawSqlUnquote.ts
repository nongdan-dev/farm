import { arrToMap } from '##/shared/arrToMap'

const sqlUnquoteMap = arrToMap(["'", '`', '"'])

export const rawSqlUnquote = (name: string) => {
  return name
    .split('.')
    .map(w =>
      sqlUnquoteMap[w.charAt(0)] && sqlUnquoteMap[w.charAt(w.length - 1)]
        ? w.substr(1, w.length - 2)
        : w,
    )
    .join('.')
}
