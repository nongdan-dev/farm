import { DataTypes } from 'sequelize'
import { ulid } from 'ulidx'

import { log } from '##/nodejs/log'

import { Db } from './Db'
import { extendModel } from './extendModel'
import { Attributes } from './Model'

export const xDefine = (db: Db, name: string, attrs: Attributes) => {
  Object.assign(attrs, {
    id: {
      type: 'STRING',
      primaryKey: true,
      defaultValue: ulid,
    },
  })
  Object.entries(attrs).forEach(([k, a]) => {
    if (!a.allowNull) {
      a.allowNull = false
    }
    if (
      a.allowNull &&
      !k.endsWith('Id') &&
      !(a.type === 'DATE' || a.type === 'JSON') &&
      !db.$options.ignoreAllowNull
    ) {
      log.warn(
        `Found allowNull=true in ${name}.${k} type=${a.type}, only allow null in id/date/json`,
      )
    }
    a.type = DataTypes[a.type] as any
  })
  const m = db.define(name, attrs) as any
  extendModel(m)
  return m
}
