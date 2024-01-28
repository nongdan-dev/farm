const path = require('path')

let repoRoot = path.join(process.cwd(), '../')

module.exports = {
  get repoRoot() {
    return repoRoot
  },
  setRepoRoot: r => {
    repoRoot = r
  },
}
