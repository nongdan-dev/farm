import qs from 'qs'

export { qs }

type Options = Omit<qs.IStringifyOptions, 'sort'>

const sort = (a: string, b: string) => a.localeCompare(b)
export const qsStableStringify = (q: object, o?: Options) =>
  qs.stringify(q, { ...o, sort })
