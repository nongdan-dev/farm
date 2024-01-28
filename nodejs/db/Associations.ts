import { Model } from './Model'

export type BelongsTo = {
  to: Model
  foreignKey: string
  allowNull: boolean
  as: string
  // can be optional in junction table
  linked?: HasOne | HasMany
  ignore?: boolean
}
export type HasOne = {
  to: Model
  foreignKey: string
  allowNull: boolean
  as: string
  linked: BelongsTo
  ignore?: boolean
}
export type HasMany = {
  to: Model
  foreignKey: string
  as: string
  linked: BelongsTo
  ignore?: boolean
}
export type BelongsToMany = {
  to: Model
  through: Model
  foreignKey: string
  otherKey: string
  as: string
  linked: BelongsToMany
  ignore?: boolean
}

export type Associations = {
  belongsTo: BelongsTo[]
  hasOne: HasOne[]
  hasMany: HasMany[]
  belongsToMany: BelongsToMany[]
}

type Options<T> = Partial<Omit<T, 'allowNull' | 'linked'>>
export type AssociationsOptions = {
  belongsTo?: Options<BelongsTo>[]
  hasOne?: Options<HasOne>[]
  hasMany?: Options<HasMany>[]
  belongsToMany?: Options<BelongsToMany>[]
}

export type AssociationTypes = keyof Associations
export const associationTypes: AssociationTypes[] = [
  'belongsTo',
  'hasOne',
  'hasMany',
  'belongsToMany',
]
export type Association = BelongsTo | HasOne | HasMany | BelongsToMany
