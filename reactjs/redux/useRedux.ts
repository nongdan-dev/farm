import { UnknownAction } from '@reduxjs/toolkit'
import { upperFirst } from 'lodash'
import { useEffect, useRef } from 'react'
import { shallowEqual, useSelector, useStore } from 'react-redux'

import { UpperFirst } from '##/shared/ts'

type InS<R, T> = {
  [k: string]: T extends 'get'
    ? (s: R, ...a: any[]) => unknown
    : (s: R) => unknown
}
type OutS<R, T, S extends InS<R, T>> = T extends 'get'
  ? {
      [k in `get${UpperFirst<keyof S>}`]: k extends `get${UpperFirst<
        infer _ extends keyof S
      >}`
        ? S[_] extends (s: R, ...a: infer A) => infer V
          ? (...a: A) => V
          : never
        : never
    }
  : {
      [k in keyof S]: S[k] extends (s: R) => infer V
        ? V
        : S[k] extends () => infer V
          ? V
          : never
    }

type InA = {
  [k: string]: (...a: any[]) => unknown
}
type OutA<A extends InA> = {
  [k in keyof A]: (...a: Parameters<A[k]>) => void
}

type InH = {
  [k: string]: (...a: any[]) => unknown
}
type OutH<H extends InH> = {
  [k in keyof H]: (
    ...a: Parameters<H[k]> extends [GetReduxUntyped, ...infer P] ? P : never
  ) => void
}

type In1<S, A, H> = {
  selectors: S
  actions: A
  handlers: H
}
type Out1<R, T, S extends InS<R, T>, A extends InA, H extends InH> = {} & OutS<
  R,
  T,
  S
> &
  OutA<A> &
  OutH<H>

type In2<S, A> = {
  selectors: S
  actions: A
}
type Out2<R, T, S extends InS<R, T>, A extends InA> = {} & OutS<R, T, S> &
  OutA<A>

type In3<S, H> = {
  selectors: S
  handlers: H
}
type Out3<R, T, S extends InS<R, T>, H extends InH> = {} & OutS<R, T, S> &
  OutH<H>

type In4<A, H> = {
  actions: A
  handlers: H
}
type Out4<A extends InA, H extends InH> = {} & OutA<A> & OutH<H>

type In5<S> = {
  selectors: S
}
type Out5<R, T, S extends InS<R, T>> = OutS<R, T, S>

type In6<A> = {
  actions: A
}
type Out6<A extends InA> = OutA<A>

type In7<H> = {
  handlers: H
}
type Out7<H extends InH> = OutH<H>

type UseOrGetRedux<R = any, T extends 'use' | 'get' = 'use'> = {
  <S extends InS<R, T>, A extends InA, H extends InH>(
    p: In1<S, A, H>,
  ): Out1<R, T, S, A, H>
  <S extends InS<R, T>, A extends InA>(p: In2<S, A>): Out2<R, T, S, A>
  <S extends InS<R, T>, H extends InH>(p: In3<S, H>): Out3<R, T, S, H>
  <A extends InA, H extends InH>(p: In4<A, H>): Out4<A, H>
  <S extends InS<R, T>>(p: In5<S>): Out5<R, T, S>
  <A extends InA>(p: In6<A>): Out6<A>
  <H extends InH>(p: In7<H>): Out7<H>
}
export type UseReduxUntyped<R = any> = UseOrGetRedux<R>
export type GetReduxUntyped<R = any> = UseOrGetRedux<R, 'get'> & {
  thunk: <K extends string & keyof R>(k: K, f: (s: R[K]) => void) => void
}

export const useReduxUntyped: UseReduxUntyped = (p: {
  selectors?: FuncM
  actions?: FuncM
  handlers?: FuncM
}) => {
  let s = useSelector(
    r =>
      p.selectors
        ? Object.entries(p.selectors).reduce<AnyM>((m, [k, v]) => {
            m[k] = v(r)
            return m
          }, {})
        : {},
    shallowEqual,
  )
  // clone s to have shallowEqual working
  // below we will assign actions and handlers into s
  // which will make shallowEqual always return false if not clone
  s = { ...s }

  const store = useStore()
  const unmountR = useRef(false)
  useEffect(
    () => () => {
      unmountR.current = true
    },
    [],
  )
  const dispatchWithUnmountCheck = (a: UnknownAction) => {
    if (unmountR.current) {
      return
    }
    store.dispatch(a)
  }

  wrapActions(s, dispatchWithUnmountCheck, p.actions)

  const getRedux =
    p.handlers && createGetRedux(store.getState, dispatchWithUnmountCheck)
  wrapHandlers(s, getRedux, p.handlers)

  return s
}

export const createGetRedux = <R>(
  getState: () => R,
  dispatch: (a: UnknownAction) => void,
): GetReduxUntyped<R> => {
  const getRedux = ((p: {
    selectors?: FuncM
    actions?: FuncM
    handlers?: FuncM
  }) => {
    const s = p.selectors
      ? Object.entries(p.selectors).reduce<AnyM>((m, [k, v]) => {
          m[`get${upperFirst(k)}`] = (...a: any[]) => v(getState(), ...a)
          return m
        }, {})
      : {}

    wrapActions(s, dispatch, p.actions)
    wrapHandlers(s, getRedux, p.handlers)

    return s
  }) as GetReduxUntyped<R>

  getRedux.thunk = (k, payload) => {
    dispatch({ type: `${k}/thunk`, payload })
  }

  return getRedux
}

const wrapActions = (s: AnyM, dispatch: Function, actions?: FuncM) => {
  if (!actions) {
    return
  }
  Object.keys(actions).forEach(k => {
    s[k] = (...a: any[]) => dispatch(actions[k](...a))
  })
}
const wrapHandlers = (s: AnyM, getRedux?: Function, handlers?: FuncM) => {
  if (!getRedux || !handlers) {
    return
  }
  Object.keys(handlers).forEach(k => {
    s[k] = (...a: any[]) => handlers[k](getRedux, ...a)
  })
}

type AnyM = { [k: string]: any }
type FuncM = { [k: string]: Function }
