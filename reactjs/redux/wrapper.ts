import { ReactElement } from 'react'

export const wrapper =
  <P, H>(
    h: (p: P) => H,
  ): ((c: (p: H) => ReactElement) => (p: P) => ReactElement) =>
  c =>
  p =>
    c(h(p))
