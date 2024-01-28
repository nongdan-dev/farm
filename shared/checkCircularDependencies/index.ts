export type CheckCircularDependenciesMap = {
  [parent: string]: {
    [child: string]: boolean
  }
}

export const checkCircularDependencies = (
  map: CheckCircularDependenciesMap,
) => {
  const circular: string[] = []
  Object.keys(map).forEach(parent => recursive(map, parent, [], circular))
  return circular
}

const recursive = (
  map: CheckCircularDependenciesMap,
  name: string,
  traveled: string[],
  circular: string[],
) => {
  const i = traveled.indexOf(name)
  if (i > 0) {
    return
  }
  traveled.push(name)
  if (i === 0) {
    circular.push(traveled.join(' > '))
    return
  }
  Object.keys(map[name]).forEach(child => {
    if (child in map) {
      recursive(map, child, [...traveled], circular)
    }
  })
}
