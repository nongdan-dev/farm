import { AbstractDataType } from '##/nodejs/db'
import { Model } from '##/nodejs/db/Model'
import { log } from '##/nodejs/log'
import { arrToMap } from '##/shared/arrToMap'

import { getFieldType } from './getFieldType'

export type InitSchemaConfig = ParseFields &
  Partial<{
    ignore: true
    return: string | false
  }>

type ParseFields = ParseModelFields &
  Partial<{
    name: string
    include: string[]
    exclude: string[]
    ignoreMutationExclude: boolean
    virtual: object
  }>
export const builtinMutationExclude = ['id', 'createdAt', 'updatedAt']

export const parseFields = (m: Model, c?: InitSchemaConfig) => {
  if (c?.mutation && !c.ignoreMutationExclude) {
    if (!c.exclude) {
      c.exclude = []
    }
    c.exclude.push(...builtinMutationExclude)
  }
  if (c?.include?.length && c.exclude?.length) {
    const name = c?.name || m.name
    log.warn(
      `found both include and exclude in ${name}, it should contain only one of them`,
    )
    if (c.mutation && !c.ignoreMutationExclude) {
      log.warn(
        'exclude was added automatically on mutation, use ignoreMutationExclude to ignore them',
      )
    }
  }
  return parseModelFields(m, c).concat(parseObjectFields(c?.virtual))
}

export type ParseModelFields = Partial<{
  include: string[]
  exclude: string[]
  mutation: MutationType
}>
export type MutationType = 'create' | 'update'

export const parseModelFields = (m: Model, c?: ParseModelFields) => {
  const imap = c?.include && arrToMap(c.include)
  const emap = c?.exclude && arrToMap(c.exclude)
  const o: { [k: string]: string } = {}
  Object.entries(m.rawAttributes).forEach(([name, a]) => {
    if ((imap && !imap[name]) || emap?.[name]) {
      return
    }
    const type = getFieldType(name, (a.type as AbstractDataType).key)
    const nullable =
      a.allowNull ||
      c?.mutation === 'update' ||
      (c?.mutation && a.defaultValue !== undefined)
    o[name] = `${type}${nullable ? '' : '!'}`
  })
  return parseObjectFields(o)
}

export const parseObjectFields = (o?: object) => {
  if (!o) {
    return []
  }
  return Object.entries(o).reduce<string[]>(
    (a: string[], v: string[]) => [...a, v.join(': ')],
    [],
  )
}
