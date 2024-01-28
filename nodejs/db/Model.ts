import {
  BulkCreateOptions,
  CreateOptions,
  FindOptions,
  Model as SequelizeModel,
  ModelAttributeColumnOptions,
  ModelStatic,
} from 'sequelize'

import { DeepMerge, Optional, PickByValue } from '##/shared/ts'

import { Associations, AssociationsOptions } from './Associations'
import { Db } from './Db'

export interface Model<
  T extends Attributes = any,
  M extends {} = ModelType<T>,
  C extends {} = CreateType<T>,
  F = Omit<FindOptions<M>, 'where'>,
  W = WhereOptions<M>,
  K = Exclude<keyof M, number | symbol>,
  CO = Omit<CreateOptions<M>, 'ignoreDuplicates' | 'returning'>,
  BCO = BulkCreateOptions<M>,
  BUO = BCO & { keys: K[] },
> extends ModelStatic<SequelizeModel<M, C>> {
  sequelize: Db

  // --------------------------------------------------------------------------
  // extra configs to automatically generate graphql typedef and jm options

  associationsOptions?: (models: any) => AssociationsOptions
  associationsIgnore?: true | string[]
  $associations: Associations

  // --------------------------------------------------------------------------
  // extra CRUD sequelize implementations with convenient options
  // return values are called automatically with toJSON()

  xFind(where?: W, options?: F): Promise<M[]>
  xFindBy(k: K, v: unknown | unknown[], options?: F): Promise<M[]>
  xFindById(id: string[], options?: F): Promise<M[]>

  xFind1(where?: W, options?: F): Promise<M | undefined>
  xFind1By(k: K, v: unknown | unknown[], options?: F): Promise<M | undefined>
  xFind1ById(id: string): Promise<M | undefined>

  xMustFind1(where?: W): Promise<M>
  xMustFind1By(k: K, v: unknown | unknown[]): Promise<M>
  xMustFind1ById(id: string): Promise<M>

  xCreate(record: C, options?: CO): Promise<M>
  xBulkCreate(records: C[], options?: BCO): Promise<M[]>
  xBulkUpsert(records: C[], options: BUO): Promise<M[]>

  xExists(where?: W): Promise<boolean>
  xExistsBy(k: K, v: unknown | unknown[]): Promise<boolean>
  xExistsById(id: string | string[]): Promise<boolean>

  xMustExists(where?: W): Promise<void>
  xMustExistsBy(k: K, v: unknown | unknown[]): Promise<void>
  xMustExistsById(id: string | string[]): Promise<void>

  xUpdate(where: W, data: Partial<C>): Promise<number>
  xUpdateBy(k: K, v: unknown | unknown[], data: Partial<C>): Promise<number>
  xUpdateById(id: string | string[], data: Partial<C>): Promise<number>

  xDestroy(where?: W): Promise<number>
  xDestroyBy(k: K, v: unknown | unknown[]): Promise<number>
  xDestroyById(id: string | string[]): Promise<number>

  xCount(where?: W): Promise<number>
  xCountBy(k: K, v: unknown | unknown[]): Promise<number>
  xCountById(ids: string[]): Promise<number>
  xSum(colName: keyof PickByValue<M, number>, where?: W): Promise<number>

  // --------------------------------------------------------------------------
  // to extract typings from model
  $M: M
  $K: K
  $C: C
  $U: Partial<Omit<C, 'id'>>
  $W: W
}

export type Models = {
  [k: string]: Model
}

export type Attributes = {
  [k: string]: Attribute
}
type Attribute = Omit<ModelAttributeColumnOptions, 'type'> & {
  type: 'BOOLEAN' | 'INTEGER' | 'FLOAT' | 'STRING' | 'TEXT' | 'DATE' | 'JSON'
  tsType?: any
}

type ModelType<T> = DeepMerge<
  {
    [k in keyof T]: AttributeType<T[k]>
  } & BaseModel
>
type CreateType<T> = DeepMerge<
  Optional<
    {
      [k in keyof T]: AttributeType<T[k]> | object
    },
    {
      [K in keyof T]: T[K] extends { autoIncrement: true }
        ? K
        : T[K] extends { defaultValue: any }
          ? K
          : T[K] extends { allowNull: boolean }
            ? K
            : never
    }[keyof T]
  > &
    Partial<BaseModel>
>

type AttributeType<T> = T extends { tsType: unknown }
  ? T['tsType']
  : T extends { type: unknown }
    ?
        | (T['type'] extends 'BOOLEAN'
            ? boolean
            : T['type'] extends 'INTEGER'
              ? number
              : T['type'] extends 'FLOAT'
                ? number
                : T['type'] extends 'STRING'
                  ? string
                  : T['type'] extends 'TEXT'
                    ? string
                    : T['type'] extends 'DATE'
                      ? Date
                      : T['type'] extends 'JSON'
                        ? object
                        : never)
        | (T extends { allowNull: boolean } ? null : never)
    : never

type BaseModel = {
  id: string
  createdAt: Date
}

type WhereOptions<T> = {
  [k in keyof T]?: T[k] | null | object
} & {
  [k: symbol]: object
}
