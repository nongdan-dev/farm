const whitelist = [
  'change-case',
  //
]
const exts = ['.jsx', '.ts', '.tsx']

const es6 = p => {
  const m = require(p)
  return m.default || m
}

module.exports = {
  plugins: [
    [es6('@babel/plugin-transform-modules-commonjs'), { loose: true }],
    es6('@babel/plugin-proposal-optional-chaining'),
    es6('@babel/plugin-syntax-class-properties'),
    es6('@babel/plugin-transform-typescript'),
  ],
  retainLines: true,
  extensions: ['.js', ...exts, '.esm', '.mjs'],
  ignore: [
    p => !(exts.some(e => p.endsWith(e)) || whitelist.some(m => p.includes(m))),
  ],
  whitelist,
}
