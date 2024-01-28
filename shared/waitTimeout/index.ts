export const waitTimeout = (t = 300) =>
  new Promise(resolve => setTimeout(resolve, t))
