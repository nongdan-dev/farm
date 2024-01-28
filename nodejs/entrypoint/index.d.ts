/**
 * Read env variables from `.env` and fallback to `.env.example`.
 * Register require hooks such as babel transpiler and ts config paths.
 * Check for cicular imports if running on dev.
 *
 * @example
 * require('/utils/entrypoint')   // -> prepare
 * require('/utils/entrypoint')() // -> prepare then require ./index.ts
 * @param {string} [index] optional, default path.join(process.cwd(), './index.ts')
 */
const entrypoint: (index: string) => void
export = entrypoint
