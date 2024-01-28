import { Op } from '##/nodejs/db'
import {
  Association,
  AssociationTypes,
  BelongsToMany,
} from '##/nodejs/db/Associations'
import { Model } from '##/nodejs/db/Model'

type FilterW = {
  // where from graphql codegen k_op: value
  [k: string]: unknown
}
export type Filter = FilterW & {
  AND?: FilterW[]
  OR?: FilterW[]
  NOT?: FilterW
}

export type DbW = {
  // where to pass to sequelize
  [k: string | symbol]: unknown
}

export const parseFilter = (m: Model, filter?: Filter): DbW | undefined => {
  if (!filter || !Object.keys(filter).length) {
    return
  }
  const db = m.sequelize
  if (typeof m === 'string') {
    m = db.models[m] as Model
  }
  const and: DbW[] = []
  Object.entries(filter).forEach(([k, v]) => {
    if (k === 'AND' || k === 'OR' || k === 'NOT') {
      return
    }
    const i = k.indexOf('_')
    let op = i < 0 ? 'eq' : k.substr(i + 1)
    k = i < 0 ? k : k.substr(0, i)
    if (op === 'some' || op === 'none') {
      const a = handleAssociation(m, op, k, v)
      op = a.op
      k = a.k
      v = a.v
    }
    and.push({ [k]: { [Op[op as keyof typeof Op]]: v } })
  })
  // and
  filter.AND?.map(f => parseFilter(m, f))
    .filter(w => w)
    .forEach((w: any) => {
      const arr = w[Op.and]
      arr ? and.push(...arr) : and.push(w)
    })
  // or
  const or = filter.OR?.map(f => parseFilter(m, f)).filter(w => w)
  if (!or?.length) {
  } else if (or.length === 1) {
    and.push(or[0] as any)
  } else {
    and.push({ [Op.or]: or })
  }
  // not
  const not = parseFilter(m, filter.NOT)
  if (not) {
    and.push(not)
  }
  // return
  if (!and.length) {
    return
  }
  if (and.length === 1) {
    return and[0]
  }
  return { [Op.and]: and }
}

const handleAssociation = (
  m: Model,
  op: 'some' | 'none',
  k: string,
  v: unknown,
) => {
  const db = m.sequelize
  //
  const [a0, type] = Object.keys(m.$associations)
    .map(t => [
      (m.$associations[t as AssociationTypes] as Association[]).find(
        a => k === a.as,
      ),
      t,
    ])
    .find(([a]) => a) as any as [Association, AssociationTypes]
  //
  k = type.substr(0, 3) === 'has' ? 'id' : a0.foreignKey
  //
  let childTbl = db.q(a0.to.name)
  let w = parseFilter(a0.to, v as any)
  if (type === 'belongsToMany') {
    const a = a0 as BelongsToMany
    k = 'id'
    w = {
      [a.otherKey]: {
        [Op.in]: m.sequelize.rawSqlSelectLiteral(db.q(childTbl, 'id'), w),
      },
    }
    childTbl = db.q(a.through.name)
  }
  const childId = db.q(type === 'belongsTo' ? 'id' : a0.foreignKey)
  v = m.sequelize.rawSqlSelectLiteral(`${childTbl}.${childId}`, w)
  //
  return {
    op: op === 'some' ? 'in' : 'notIn',
    k,
    v,
  }
}
