import { uniq } from 'lodash'
import { col, fn, Op, WhereOptions } from 'sequelize'
import { ulid } from 'ulidx'

import { arrToMap } from '##/shared/arrToMap'
import { IntentionalError } from '##/shared/error'
import { qsStableStringify } from '##/shared/qs'

import { Model } from './Model'

export const extendModel = (m: Model) => {
  //
  // CREATE

  m.xCreate = (record, options) => {
    return m.create(record, options).then(r => r.toJSON())
  }
  m.xBulkCreate = async (records, options) => {
    if (!records.length) {
      return []
    }
    records.forEach(r => {
      if (!r.id) {
        r.id = ulid()
      }
    })
    return m.bulkCreate(records, options).then(arr => arr.map(r => r.toJSON()))
  }
  m.xBulkUpsert = async (records, options) => {
    if (!records.length) {
      return []
    }
    // prepare options
    const { keys, ...o } = options
    if (!keys.length) {
      throw new Error('Missing options.keys')
    }
    o.updateOnDuplicate = o.ignoreDuplicates
      ? undefined
      : o.updateOnDuplicate || Object.keys(records[0])
    // get the values for each key
    const values = keys
      .map(k => String(k))
      .map(k => uniq(records.map(r => r[k])))
    // find existed rows in db based on those keys and their values
    const where: { [k: string]: any } = {}
    keys.forEach((k, i) => {
      where[k] = { [Op.in]: values[i] }
    })
    const existings = await m.xFind(where)
    // build key-id by using stringify of the value
    // then convert the existed rows into a map of their id
    const key = (r: any) => JSON.stringify(keys.map(k => r[k]))
    const existingsMapId = arrToMap(existings, r => key(r), 'id')
    // set the id from existed rows
    records.forEach(r => {
      r.id = existingsMapId[key(r)]
    })
    // check if ignore duplicates and perform bulk create
    const create = o.ignoreDuplicates ? records.filter(r => !r.id) : records
    const justCreated = await m.xBulkCreate(create, o)
    const justCreatedMapId = arrToMap(justCreated, r => key(r), 'id')
    // then set again the new id from db to records
    records.forEach(r => {
      r.id = r.id || justCreatedMapId[key(r)]
    })
    // check if any record has no data returned from db
    const existingsMap = arrToMap(existings, 'id', r => r)
    const justCreatedMap = arrToMap(justCreated, 'id', r => r)
    return records.map(r => {
      const d = r.id && (existingsMap[r.id] || justCreatedMap[r.id])
      if (!d) {
        const missing = !r.id ? 'id' : 'data'
        throw new Error(`Missing ${missing} for ${key(r)}`)
      }
      return d
    })
  }

  //
  // READ

  m.xFind = (w, options) => {
    const where = (w || {}) as WhereOptions
    return m
      .findAll({ ...options, where })
      .then(arr => arr.map(r => r.toJSON()))
  }
  m.xFindBy = (k, v, options) => {
    const w = mustBuildWhereBy(k, v)
    return m.xFind(w, options)
  }
  m.xFindById = (id, options) => {
    const w = mustBuildWhereBy('id', id)
    return m.xFind(w, options)
  }

  m.xFind1 = (w, options) => {
    const where = (w || {}) as WhereOptions
    return m.findOne({ ...options, where }).then(r => r?.toJSON())
  }
  m.xFind1By = (k, v, options) => {
    const w = mustBuildWhereBy(k, v)
    return m.xFind1(w, options)
  }
  m.xFind1ById = id => {
    const w = mustBuildWhereBy('id', id)
    return m.xFind1(w)
  }

  m.xMustFind1 = async w => {
    const r = await m.xFind1(w)
    return mustCheckReturn(r, m, w)
  }
  m.xMustFind1By = (k, v) => {
    const w = mustBuildWhereBy(k, v)
    return m.xMustFind1(w)
  }
  m.xMustFind1ById = id => {
    const w = mustBuildWhereBy('id', id)
    return m.xMustFind1(w)
  }

  m.xExists = w => {
    const where = (w || {}) as WhereOptions
    return m.findOne({ where }).then(i => !!i)
  }
  m.xExistsBy = (k, v) => {
    const w = mustBuildWhereBy(k, v)
    return m.xExists(w)
  }
  m.xExistsById = id => {
    const w = mustBuildWhereBy('id', id)
    return m.xExists(w)
  }

  m.xMustExists = async w => {
    const r = await m.xExists(w)
    mustCheckReturn(r, m, w)
  }
  m.xMustExistsBy = (k, v) => {
    const w = mustBuildWhereBy(k, v)
    return m.xMustExists(w)
  }
  m.xMustExistsById = id => {
    const w = mustBuildWhereBy('id', id)
    return m.xMustExists(w)
  }

  m.xCount = w => {
    const where = (w || {}) as WhereOptions
    return m.count({ where })
  }
  m.xCountBy = (k, v) => {
    const w = mustBuildWhereBy(k, v)
    return m.xCount(w)
  }
  m.xCountById = ids => {
    return m.xCountBy('id', ids)
  }

  m.xSum = (colName, w) => {
    const where = (w || {}) as WhereOptions
    return m
      .findAll({
        where,
        attributes: [[fn('sum', col(colName)), 'sum']],
      })
      .then(arr => arr.map(r => r.toJSON()))
      .then(r => Number(r[0].sum) || 0)
  }

  //
  // UPDATE

  m.xUpdate = (w, data) => {
    const where = (w || {}) as WhereOptions
    return m.update(data, { where }).then(r => r[0])
  }
  m.xUpdateBy = (k, v, data) => {
    const w = mustBuildWhereBy(k, v)
    return m.xUpdate(w, data)
  }
  m.xUpdateById = (id, data) => {
    const w = mustBuildWhereBy('id', id)
    return m.xUpdate(w, data)
  }

  //
  // DELETE

  m.xDestroy = w => {
    const where = (w || {}) as WhereOptions
    return m.destroy({ where })
  }
  m.xDestroyBy = (k, v) => {
    const w = mustBuildWhereBy(k, v)
    return m.xDestroy(w)
  }
  m.xDestroyById = id => {
    const w = mustBuildWhereBy('id', id)
    return m.xDestroy(w)
  }
}

const mustBuildWhereBy = (
  k: string | number | symbol,
  v: unknown | unknown[],
) => {
  if (!v) {
    throw new Error(`Empty value in where by ${k as string}`)
  }
  const w = Array.isArray(v) ? { [Op.in]: v } : v
  return { [k]: w }
}
const mustCheckReturn = <
  M extends Model,
  R extends M['$M'] | boolean | undefined,
>(
  r: R,
  m: M,
  w?: object,
) => {
  if (!r) {
    w = w || { where: true }
    const q = qsStableStringify(w, { delimiter: ' ' })
    throw new IntentionalError(
      'Data not found',
      `${m.name} ${q} was not found in database`,
    )
  }
  return r
}
