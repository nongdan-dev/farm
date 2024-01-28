import { upperFirst } from 'lodash'

import { Model } from '##/nodejs/db/Model'

import { GraphqlSchemaBuilder } from '.'
import { chainById } from './initSchemaDetail'
import { InitSchemaConfig, parseFields, parseObjectFields } from './parseFields'

export type InitSchemaCreate = InitSchemaConfig

export const initSchemaCreate = <
  T,
  M extends Model,
  C extends InitSchemaConfig,
>(
  sb: GraphqlSchemaBuilder<T>,
  m: M,
  c?: C,
) => {
  const { name, args, res, customReturn } = parseMutationConfig(sb, m, {
    ...c,
    mutation: 'create',
  })
  const def = [args.length && `(${args.join(', ')})`, res]
  return chainById<T, C, 'create'>(sb, 'mutation', name, def, customReturn)
}

export const parseMutationConfig = (
  sb: GraphqlSchemaBuilder,
  m: Model,
  c: InitSchemaConfig,
) => {
  const name = c?.name || `${c.mutation}${m.name}`
  const customReturn = c?.ignore && c.return !== undefined
  const res = customReturn ? c.return : `${m.name}!`
  const args: string[] = []
  if (!c?.ignore) {
    const f = parseFields(m, {
      ...c,
      name,
      mutation: c.mutation,
    })
    const data = upperFirst(name)
    sb.addSchema('input', data).def(f)
    args.push(`data: ${data}!`)
  } else if (c.virtual) {
    args.push(...parseObjectFields(c.virtual))
  }
  return {
    name,
    args,
    res,
    customReturn,
  }
}
