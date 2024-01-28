import { AbstractDataType } from '##/nodejs/db'
import { Association, AssociationTypes } from '##/nodejs/db/Associations'
import { Model } from '##/nodejs/db/Model'

import { getFieldType } from './getFieldType'

export const getFilterName = (m: Model) => {
  return `${m.name}Filter`
}

export const getFilterFields = (m: Model) => {
  const dialect = m.sequelize.getDialect()
  const fields: { [k: string]: string } = {
    AND: `[${getFilterName(m)}!]`,
    OR: `[${getFilterName(m)}!]`,
    NOT: `${getFilterName(m)}`,
  }
  Object.entries(m.rawAttributes).forEach(([f, a]) => {
    if (f.indexOf('_') >= 0) {
      throw new Error(`Invalid character _ in ${m.name}.${f}`)
    }
    const t = getFieldType(f, (a.type as AbstractDataType).key)
    if (t === 'Json') {
      return
    }
    fields[f] = t
    fields[`${f}_ne`] = t
    if (t === 'Boolean') {
      return
    }
    fields[`${f}_in`] = `[${t}!]`
    fields[`${f}_notIn`] = `[${t}!]`
    if (t === 'ID') {
      return
    }
    fields[`${f}_lt`] = t
    fields[`${f}_lte`] = t
    fields[`${f}_gt`] = t
    fields[`${f}_gte`] = t
    if (t !== 'String') {
      return
    }
    fields[`${f}_like`] = t
    fields[`${f}_notLike`] = t
    fields[`${f}_startsWith`] = t
    fields[`${f}_endsWith`] = t
    fields[`${f}_substring`] = t
    if (dialect !== 'postgres') {
      return
    }
    fields[`${f}_iLike`] = t
    fields[`${f}_notILike`] = t
  })
  Object.entries(m.$associations).forEach(e => {
    const [, arr] = e as [AssociationTypes, Association[]]
    arr.forEach(a => {
      fields[`${a.as}_some`] = `${a.to.name}Filter`
      fields[`${a.as}_none`] = `${a.to.name}Filter`
    })
  })
  return fields
}
