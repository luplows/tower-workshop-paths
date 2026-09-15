// Registers a loader hook so plain `node` can resolve this project's own
// extensionless relative imports (e.g. workshopCategories.js importing
// `./workshopUpgradeList` with no extension) -- Vite resolves these
// fine, but plain Node ESM doesn't, and scripts/ deliberately imports real
// app source modules (rather than duplicating their data) to stay accurate
// as that source changes. Preload this via `node --import` *before* the
// script that does the actual importing, so the hook is active before its
// static imports resolve (a hook registered from within the same file it's
// meant to protect is too late -- static imports are already resolved by
// the time that file's own top-level code runs).
import { register } from 'node:module'

register(
  'data:text/javascript,' +
    encodeURIComponent(`
      export async function resolve(specifier, context, nextResolve) {
        try {
          return await nextResolve(specifier, context)
        } catch (err) {
          if (specifier.startsWith('.') && !/\\.[a-zA-Z]+$/.test(specifier)) {
            return nextResolve(specifier + '.js', context)
          }
          throw err
        }
      }
    `),
  import.meta.url,
)
