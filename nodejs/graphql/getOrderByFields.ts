import { AbstractDataType } from '##/nodejs/db'
import {
  Association,
  AssociationTypes,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
} from '##/nodejs/db/Associations'
import { Model } from '##/nodejs/db/Model'
import { RawSqlOrderBy } from '##/nodejs/db/rawSqlOrderBy'

import { getFieldType } from './getFieldType'

export const getOrderByName = (m: Model) => {
  return `${m.name}OrderBy`
}

export const getOrderByFields = (m: Model) => {
  const fields: string[] = []
  Object.entries(m.rawAttributes).forEach(([f, a]) => {
    if (f.indexOf('_') >= 0) {
      throw new Error(`Invalid character _ in ${m.name}.${f}`)
    }
    const t = getFieldType(f, (a.type as AbstractDataType).key)
    if (t === 'Json') {
      return
    }
    fields.push(`${f}_asc`, `${f}_desc`)
  })
  Object.entries(m.$associations).forEach(e => {
    const [type, arr] = e as [AssociationTypes, Association[]]
    if (type.endsWith('Many')) {
      arr.forEach(a0 => {
        const a = a0 as BelongsToMany | HasMany
        fields.push(`${a.as}_count_asc`, `${a.as}_count_desc`)
      })
    } else {
      arr.forEach(a0 => {
        const a = a0 as BelongsTo | HasOne
        Object.keys(a.to.rawAttributes).forEach(f => {
          fields.push(`${a.as}_${f}_asc`, `${a.as}_${f}_desc`)
        })
      })
    }
  })
  return fields
}

export type ParseOrderBy = Pick<RawSqlOrderBy, 'as' | 'by' | 'direction'>
export const parseOrderBy = (orderBy: string): ParseOrderBy | undefined => {
  if (!orderBy || typeof orderBy !== 'string') {
    return
  }
  const parts = orderBy.split('_')
  const as = parts.length === 3 ? parts[0] : undefined
  return {
    as,
    by: parts[as ? 1 : 0],
    direction: parts[as ? 2 : 1] as any,
  }
}
