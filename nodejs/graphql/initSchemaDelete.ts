import { Model } from '##/nodejs/db/Model'

import { GraphqlSchemaBuilder } from '.'
import { InitSchemaConfig, parseObjectFields } from './parseFields'

export type InitSchemaDelete = Pick<
  InitSchemaConfig,
  'name' | 'ignore' | 'virtual'
>

export const initSchemaDelete = <
  T,
  M extends Model,
  C extends InitSchemaDelete,
>(
  sb: GraphqlSchemaBuilder<T>,
  m: M,
  c?: C,
) => {
  const name = c?.name || `delete${m.name}`
  const f = parseObjectFields(c?.virtual)
  if (!c?.ignore) {
    f.push('id: ID!')
  }
  const vars = f.length ? `(${f.join(', ')})` : undefined
  return sb.addSchema<void>('mutation', name).def(vars)
}
