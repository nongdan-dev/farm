import { GraphQLResolveInfo } from 'graphql'
import { set } from 'lodash'

import { Db } from '##/nodejs/db/Db'
import { Model } from '##/nodejs/db/Model'
import { JmCtx } from '##/nodejs/db/rawSqlPaginate'

import { addScalars } from './addScalars'
import { build } from './build'
import { createChain, CreateChainType } from './Chain'
import { InitSchema, initSchema } from './initSchema'
import { InitSchemaCount, initSchemaCount } from './initSchemaCount'
import { InitSchemaCreate, initSchemaCreate } from './initSchemaCreate'
import { InitSchemaDelete, initSchemaDelete } from './initSchemaDelete'
import { InitSchemaDetail, initSchemaDetail } from './initSchemaDetail'
import { InitSchemaSearch, initSchemaSearch } from './initSchemaSearch'
import { InitSchemaUpdate, initSchemaUpdate } from './initSchemaUpdate'
import { jm } from './jm'
import { JmOption } from './JmOption'
import { Filter, parseFilter } from './parseFilter'

export class GraphqlSchemaBuilder<T = any> {
  private defs: string[] = []
  private jms: JmOption[] = []
  private fns: any[] = []

  constructor(private db: Db) {
    addScalars(this)
  }

  resolver = (k: string, fn: any) => {
    this.fns.push(set({}, k, fn))
  }

  addSchema = <R = any>(type: CreateChainType, name: string) =>
    createChain<T, R>(this.defs, this.jms, this.fns, type, name)

  initSchema = <M extends Model, C extends InitSchema>(m: M, c?: C) =>
    initSchema(this, m, c)
  initSchemaCreate = <M extends Model, C extends InitSchemaCreate>(
    m: M,
    c?: C,
  ) => initSchemaCreate(this, m, c)
  initSchemaSearch = <M extends Model, C extends InitSchemaSearch>(
    m: M,
    c?: C,
  ) => initSchemaSearch(this, m, c)
  initSchemaCount = <M extends Model, C extends InitSchemaCount>(m: M, c?: C) =>
    initSchemaCount(this, m, c)
  initSchemaDetail = <M extends Model, C extends InitSchemaDetail>(
    m: M,
    c?: C,
  ) => initSchemaDetail(this, m, c)
  initSchemaUpdate = <M extends Model, C extends InitSchemaUpdate>(
    m: M,
    c?: C,
  ) => initSchemaUpdate(this, m, c)
  initSchemaDelete = <M extends Model, C extends InitSchemaDelete>(
    m: M,
    c?: C,
  ) => initSchemaDelete(this, m, c)

  parseFilter = (m: Model, filter: Filter) => parseFilter(m, filter)

  jm = (info: GraphQLResolveInfo, data?: JmCtx) => jm(this.db, info, data)
  jmWhereById = (jmTbl: string, args: any, id: string) => {
    id = typeof id === 'string' ? id : args.id
    if (!id) {
      throw new Error('Empty id in jmWhereById')
    }
    return this.db.rawSqlWhere(jmTbl, { id })
  }

  build = () => build(this.defs, this.jms, this.fns)
}

export * from 'graphql'
