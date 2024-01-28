import {
  createSlice as originalCreateSlice,
  CreateSliceOptions,
  PayloadAction,
  Slice,
  SliceCaseReducers,
  SliceSelectors,
} from '@reduxjs/toolkit'
import { upperFirst } from 'lodash'

import { arrToMap } from '##/shared/arrToMap'
import { UpperFirst } from '##/shared/ts'

import { Id, IdsMap } from './IdsMap'

export const createSlice = <
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Name extends string,
  Selectors extends SliceSelectors<State>,
  ReducerPath extends string = Name,
  A extends readonly string[] = [],
  I = A extends readonly [infer K1 extends string]
    ? Im<State, K1>
    : A extends readonly [infer K1 extends string, infer K2 extends string]
      ? Im<State, K1> & Im<State, K2>
      : A extends readonly [
            infer K1 extends string,
            infer K2 extends string,
            infer K3 extends string,
          ]
        ? Im<State, K1> & Im<State, K2> & Im<State, K3>
        : A extends readonly [
              infer K1 extends string,
              infer K2 extends string,
              infer K3 extends string,
              infer K4 extends string,
            ]
          ? Im<State, K1> & Im<State, K2> & Im<State, K3> & Im<State, K4>
          : A extends readonly [
                infer K1 extends string,
                infer K2 extends string,
                infer K3 extends string,
                infer K4 extends string,
                infer K5 extends string,
              ]
            ? Im<State, K1> &
                Im<State, K2> &
                Im<State, K3> &
                Im<State, K4> &
                Im<State, K5>
            : A extends readonly [
                  infer K1 extends string,
                  infer K2 extends string,
                  infer K3 extends string,
                  infer K4 extends string,
                  infer K5 extends string,
                  infer K6 extends string,
                ]
              ? Im<State, K1> &
                  Im<State, K2> &
                  Im<State, K3> &
                  Im<State, K4> &
                  Im<State, K5> &
                  Im<State, K6>
              : A extends readonly [
                    infer K1 extends string,
                    infer K2 extends string,
                    infer K3 extends string,
                    infer K4 extends string,
                    infer K5 extends string,
                    infer K6 extends string,
                    infer K7 extends string,
                  ]
                ? Im<State, K1> &
                    Im<State, K2> &
                    Im<State, K3> &
                    Im<State, K4> &
                    Im<State, K5> &
                    Im<State, K6> &
                    Im<State, K7>
                : A extends readonly [
                      infer K1 extends string,
                      infer K2 extends string,
                      infer K3 extends string,
                      infer K4 extends string,
                      infer K5 extends string,
                      infer K6 extends string,
                      infer K7 extends string,
                      infer K8 extends string,
                    ]
                  ? Im<State, K1> &
                      Im<State, K2> &
                      Im<State, K3> &
                      Im<State, K4> &
                      Im<State, K5> &
                      Im<State, K6> &
                      Im<State, K7> &
                      Im<State, K8>
                  : A extends readonly [
                        infer K1 extends string,
                        infer K2 extends string,
                        infer K3 extends string,
                        infer K4 extends string,
                        infer K5 extends string,
                        infer K6 extends string,
                        infer K7 extends string,
                        infer K8 extends string,
                        infer K9 extends string,
                      ]
                    ? Im<State, K1> &
                        Im<State, K2> &
                        Im<State, K3> &
                        Im<State, K4> &
                        Im<State, K5> &
                        Im<State, K6> &
                        Im<State, K7> &
                        Im<State, K8> &
                        Im<State, K9>
                    : never,
>(
  options: Omit<
    CreateSliceOptions<State, CaseReducers, Name, ReducerPath, Selectors>,
    'reducers'
  > &
    Pick<
      Partial<
        CreateSliceOptions<State, CaseReducers, Name, ReducerPath, Selectors>
      >,
      'reducers'
    > & {
      im?: A
    },
): Slice<
  State,
  CaseReducers &
    ImP<I, 'reducers'> & {
      thunk: (s: State, a: PayloadAction<(s: State) => void>) => void
    },
  Name,
  ReducerPath,
  Selectors & ImP<I, 'selectors'>
> => {
  const r: any = options.reducers || {}
  const s: any = options.selectors || {}
  options.reducers = r
  options.selectors = s
  // add crud for IdsMap
  options.im?.forEach(k => im(k, r, s))
  // add thunk
  r.thunk = (state: State, action: PayloadAction<(state: State) => void>) => {
    action.payload(state)
  }
  return originalCreateSlice(options as any)
}

type Im<
  S = any,
  T extends string = string,
  V extends Id = S extends { [k in `${T}Im`]: unknown }
    ? S[`${T}Im`] extends IdsMap<infer _ extends Id>
      ? _
      : never
    : never,
> = {
  reducers: V extends never
    ? never
    : {} & {
        [k in `set${UpperFirst<T>}Im`]: (
          // setTIm
          s: S,
          a: PayloadAction<V[]>,
        ) => void
      } & {
        [k in `clear${UpperFirst<T>}Im`]: (
          // clearTIm
          s: S,
        ) => void
      } & {
        [k in `add${UpperFirst<T>}`]: (
          // addT
          s: S,
          a: PayloadAction<V>,
        ) => void
      } & {
        [k in `update${UpperFirst<T>}`]: (
          // updateT
          s: S,
          a: PayloadAction<Pick<V, 'id'> & Omit<Partial<V>, 'id'>>,
        ) => void
      } & {
        [k in `delete${UpperFirst<T>}`]: (
          // deleteT
          s: S,
          a: PayloadAction<string>,
        ) => void
      } & {
        [k in `bulkAdd${UpperFirst<T>}`]: (
          // bulkAddT
          s: S,
          a: PayloadAction<V[]>,
        ) => void
      } & {
        [k in `bulkDelete${UpperFirst<T>}`]: (
          // bulkDeleteT
          s: S,
          a: PayloadAction<string[]>,
        ) => void
      }
  selectors: V extends never
    ? never
    : {} & {
        [k in `${T}Ids`]: (
          // TIds
          s: S,
        ) => string[]
      } & {
        [k in T]: (
          // T
          s: S,
          id: string,
        ) => V | undefined
      }
}
type ImP<I, K extends 'reducers' | 'selectors'> = I extends {
  [k in K]: unknown
}
  ? I[K]
  : {}

const im = <
  T extends string,
  V extends Id,
  S extends { [k in `${T}Im`]: IdsMap<V> },
>(
  name: T,
  reducers: { [k in keyof Im['reducers']]: Function },
  selectors: { [k in keyof Im['selectors']]: Function },
) => {
  const uname = upperFirst(name) as UpperFirst<T>
  const mname = `${name}Im` as const
  reducers[`set${uname}Im`] = (
    // setTIm
    s: S,
    a: PayloadAction<V[]>,
  ) => {
    s[mname].ids = a.payload.map(v => v.id)
    s[mname].map = arrToMap(a.payload, 'id', v => v)
  }
  reducers[`clear${uname}Im`] = (
    // clearTIm
    s: S,
  ) => {
    s[mname].ids = []
    s[mname].map = {}
  }
  reducers[`add${uname}`] = (
    // addT
    s: S,
    a: PayloadAction<V>,
  ) => {
    const { ids, map } = s[mname]
    const v = a.payload
    const v0 = map[v.id]
    if (v0) {
      Object.assign(v0, v)
      return
    }
    ids.push(v.id)
    map[v.id] = v
  }
  reducers[`update${uname}`] = (
    // updateT
    s: S,
    a: PayloadAction<Pick<V, 'id'> & Omit<Partial<V>, 'id'>>,
  ) => {
    const { map } = s[mname]
    const v = a.payload
    const v0 = map[v.id]
    if (!v0) {
      return
    }
    Object.assign(v0, v)
  }
  reducers[`delete${uname}`] = (
    // deleteT
    s: S,
    a: PayloadAction<string>,
  ) => {
    const { ids, map } = s[mname]
    const id = a.payload
    s[mname].ids = ids.filter(_ => _ !== id)
    delete map[id]
  }
  reducers[`bulkAdd${uname}`] = (
    // bulkAddT
    s: S,
    a: PayloadAction<V[]>,
  ) => {
    const { ids, map } = s[mname]
    a.payload.forEach(v => {
      const v0 = map[v.id]
      if (v0) {
        Object.assign(v0, v)
        return
      }
      ids.push(v.id)
      map[v.id] = v
    })
  }
  reducers[`bulkDelete${uname}`] = (
    // bulkDeleteT
    s: S,
    a: PayloadAction<string[]>,
  ) => {
    const { ids, map } = s[mname]
    const del = arrToMap(a.payload)
    s[mname].ids = ids.filter(id => !del[id])
    a.payload.forEach(id => {
      delete map[id]
    })
  }
  selectors[`${name}Ids`] = (
    // TIds
    s: S,
  ) => {
    const { ids } = s[mname]
    return ids
  }
  selectors[name] = (
    // T
    s: S,
    id: string,
  ) => {
    const { map } = s[mname]
    return map[id]
  }
}
