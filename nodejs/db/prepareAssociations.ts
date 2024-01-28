import { get, lowerFirst, set } from 'lodash'
import { plural } from 'pluralize'

import { log } from '##/nodejs/log'

import {
  Association,
  Associations,
  AssociationTypes,
  associationTypes,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
} from './Associations'
import { Db, Options } from './Db'
import { Model } from './Model'

export const prepareAssociations = (db: Db) => {
  if (db.$options.ignoreAllAssociations) {
    prepareEmptyAssociations(db)
    return
  }
  Object.values(db.models).forEach(m => {
    const a = m.associationsOptions?.(db.models) || {}
    m.$associations = a as Associations
  })
  prepareEmptyAssociations(db)
  const warns: string[] = []
  // generate, assign and check default values
  checkDefaultGenerated(db, warns)
  checkLinked(db, warns)
  // check for other constrains after assigned
  checkConflictedAs(db, warns)
  checkMultipleAs(db, warns)
  checkForeignKey(db, warns)
  checkMissingField(db, warns)
  checkInvalidIgnore(db, warns)
  log.warn('schema associations warnings:', warns.join('\n'))
}

const prepareEmptyAssociations = (db: Db) => {
  Object.values(db.models).forEach(m => {
    associationTypes.forEach(t => {
      if (!m.$associations[t]) {
        m.$associations[t] = []
      }
    })
  })
}

const checkDefaultGenerated = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    Object.entries(m.$associations).forEach(e => {
      const [type, arr] = e as [AssociationTypes, Association[]]
      arr.forEach((a, i) =>
        defaultGeneratedMap[type](
          m,
          a as any,
          (k: string, defaultGeneratedValue: string) => {
            let v = get(a, k) as string | Model
            if (
              v === defaultGeneratedValue ||
              (k === 'through' && get(v, 'name') === defaultGeneratedValue)
            ) {
              warns.push(
                `${m.name}.${type}.${i}.${k} can be omitted since it has the same value with default '${defaultGeneratedValue}'`,
              )
            }
            // this option already set value
            if (k in a) {
              return
            }
            // otherwise set this option with the default generated value
            v = defaultGeneratedValue
            // in case of junction through, convert the generated value to model
            // also check if the junction table exists
            if (k === 'through' && typeof defaultGeneratedValue === 'string') {
              v = db.models[defaultGeneratedValue]
              if (!v) {
                warns.push(
                  `${m.name}.${type}.${i}.${k} cannot find junction table ${defaultGeneratedValue}`,
                )
              }
            }
            set(a, k, v)
          },
        ),
      )
    })
  })
}
const defaultGeneratedMap = {
  belongsTo: (
    m: Model,
    a: BelongsTo,
    fn: (k: keyof BelongsTo, v: string) => void,
  ) => {
    fn('foreignKey', `${lowerFirst(a.to.name)}Id`)
    a.allowNull = !!m.rawAttributes[a.foreignKey]?.allowNull
    fn('as', a.foreignKey.replace(/Id$/, ''))
  },
  hasOne: (m: Model, a: HasOne, fn: (k: keyof HasOne, v: string) => void) => {
    fn('foreignKey', `${lowerFirst(m.name)}Id`)
    fn('as', lowerFirst(a.to.name))
  },
  hasMany: (
    m: Model,
    a: HasMany,
    fn: (k: keyof HasMany, v: string) => void,
  ) => {
    fn('foreignKey', `${lowerFirst(m.name)}Id`)
    fn('as', plural(lowerFirst(a.to.name)))
  },
  belongsToMany: (
    m: Model,
    a: BelongsToMany,
    fn: (k: keyof BelongsToMany, v: string) => void,
  ) => {
    fn('through', `${m.name}In${a.to.name}`)
    fn('foreignKey', `${lowerFirst(m.name)}Id`)
    fn('otherKey', `${lowerFirst(a.to.name)}Id`)
    fn('as', plural(lowerFirst(a.to.name)))
  },
}

const checkLinked = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    Object.entries(m.$associations).forEach(e => {
      const [type, arr] = e as [AssociationTypes, Association[]]
      arr.forEach((a, i) => {
        a.linked = linkedMap[type](m, a as any)
        if (a.linked) {
          return
        }
        if (
          a.to.associationsIgnore === true ||
          (type === 'belongsTo' &&
            a.to.associationsIgnore?.includes(`${m.name}.${a.foreignKey}`)) ||
          ((type === 'hasOne' || type === 'hasMany') &&
            a.to.associationsIgnore?.includes(`${a.foreignKey}`)) ||
          (type === 'belongsToMany' &&
            a.to.associationsIgnore?.includes(
              `${(a as BelongsToMany).through.name}.${a.foreignKey}`,
            ))
        ) {
          return
        }
        const missing =
          type === 'belongsTo'
            ? 'hasOne/hasMany'
            : type === 'hasOne' || type === 'hasMany'
              ? 'belongsTo'
              : 'belongsToMany'
        warns.push(
          `${m.name}.${type}.${i} linked association not found in ${a.to.name}, expect ${missing}`,
        )
      })
    })
  })
}
const linkedMap = {
  belongsTo: (m: Model, a: BelongsTo) => {
    return [...a.to.$associations.hasOne, ...a.to.$associations.hasMany].find(
      at => at.to === m && a.foreignKey === at.foreignKey,
    )
  },
  hasOne: (m: Model, a: HasOne) => {
    return a.to.$associations.belongsTo.find(
      at => at.to === m && a.foreignKey === at.foreignKey,
    )
  },
  hasMany: (m: Model, a: HasMany) => {
    return a.to.$associations.belongsTo.find(
      at => at.to === m && a.foreignKey === at.foreignKey,
    )
  },
  belongsToMany: (m: Model, a: BelongsToMany) => {
    return a.to.$associations.belongsToMany.find(
      at =>
        at.to === m &&
        at.through === a.through &&
        at.foreignKey === a.otherKey &&
        at.otherKey === a.foreignKey,
    )
  },
}

const checkConflictedAs = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    Object.entries(m.$associations).forEach(e => {
      const [type, arr] = e as [AssociationTypes, Association[]]
      arr.forEach((a, i) => {
        if (m.rawAttributes[a.as]) {
          warns.push(
            `${m.name}.${type}.${i}.as is conflicted with atrribute name '${a.as}'`,
          )
        }
      })
    })
  })
}

const checkMultipleAs = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    const count: { [k: string]: number } = {}
    Object.entries(m.$associations).forEach(e => {
      const [, arr] = e as [AssociationTypes, Association[]]
      arr.forEach((a, i) => {
        count[a.as] = count[a.as] || 0
        count[a.as]++
      })
    })
    Object.entries(count).forEach(([k, v]) => {
      if (v > 1) {
        warns.push(
          `${m.name} has multiple associations with the same "as: '${k}'"`,
        )
      }
    })
  })
}

const checkForeignKey = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    const foreignKeys: { [k: string]: boolean } = {}
    Object.entries(m.$associations).forEach(e => {
      const [, arr] = e as [AssociationTypes, Association[]]
      arr.forEach((a, i) => {
        if (a.foreignKey) {
          foreignKeys[a.foreignKey] = true
        }
      })
    })
    Object.keys(m.rawAttributes).forEach(k => {
      if (
        k.endsWith('Id') &&
        !foreignKeys[k] &&
        m.associationsIgnore !== true &&
        !m.associationsIgnore?.includes(k)
      ) {
        warns.push(
          `${m.name} has no association for key ${k}, expect belongsTo`,
        )
      }
    })
  })
}

const checkMissingField = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    Object.entries(m.$associations).forEach(e => {
      const [type, arr] = e as [AssociationTypes, Association[]]
      arr.forEach((a, i) => {
        if (type === 'belongsTo') {
          const { foreignKey } = a
          if (!m.rawAttributes[foreignKey]) {
            warns.push(
              `${m.name}.${type}.${i}.${foreignKey} field not found in this model`,
            )
          }
        } else if (type === 'hasOne' || type === 'hasMany') {
          const { foreignKey } = a
          if (!a.to.rawAttributes[foreignKey]) {
            warns.push(
              `${m.name}.${type}.${i}.${foreignKey} field not found in ${a.to.name}`,
            )
          }
        } else {
          const { foreignKey, otherKey, through } = a as BelongsToMany
          if (!through.rawAttributes[foreignKey]) {
            warns.push(
              `${m.name}.${type}.${i}.${foreignKey} field not found in ${through.name}`,
            )
          }
          if (!through.rawAttributes[otherKey]) {
            warns.push(
              `${m.name}.${type}.${i}.${otherKey} field not found in ${through.name}`,
            )
          }
        }
      })
    })
  })
}

const checkInvalidIgnore = (db: Db, warns: string[]) => {
  Object.values(db.models).forEach(m => {
    const o1: keyof Pick<Options, 'ignoreAllAssociations'> =
      'ignoreAllAssociations'
    const o2: keyof Pick<Model, 'associationsOptions'> = 'associationsOptions'
    if (db.$options[o1] && m[o2]) {
      warns.push(`${m.name}.${o2} will be discard since db.${o1} set to true`)
    }
    const o3: keyof Pick<Model, 'associationsIgnore'> = 'associationsIgnore'
    if (db.$options[o1] && m[o3]) {
      warns.push(`${m.name}.${o3} will be discard since db.${o1} set to true`)
    }
    if (!Array.isArray(m[o3])) {
      return
    }
    m[o3].forEach(k => {
      const p = k.split('.')
      if (p.length > 2) {
        warns.push(`${m.name}.${o3}.${k} is invalid with too many separators`)
        return
      }
      // association fields in this table
      if (p.length === 1) {
        if (!k.endsWith('Id')) {
          warns.push(`${m.name}.${o3}.${k} field not ending with Id`)
        }
        if (!m.rawAttributes[k]) {
          warns.push(`${m.name}.${o3}.${k} field not found in this model`)
        }
        return
      }
      // associations linked to this table
      if (!db.models[p[0]]) {
        warns.push(`${m.name}.${o3}.${k} can not find associated model ${p[0]}`)
      } else if (!db.models[p[0]].rawAttributes[p[1]]) {
        warns.push(
          `${m.name}.${o3}.${k} can not find field ${p[1]} in associated model ${p[0]}`,
        )
      }
    })
  })
}
