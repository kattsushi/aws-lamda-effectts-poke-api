import { build } from 'esbuild'
import { glob } from 'glob'

const entryPoints = await glob('./src/handler.ts')

await build({
  entryPoints,
  bundle: true,
  minify: true,
  sourcemap: false,
  target: 'node20',
  platform: 'node',
  outdir: 'dist',
  format: 'esm',
  external: [
    '@aws-sdk/*',
    'aws-sdk'
  ],
  banner: {
    js: `
    import { createRequire } from "node:module";
    import { fileURLToPath } from "node:url";
    import { dirname } from "node:path";
    const require = createRequire(import.meta.url);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    `
  }
})

console.log('✅ Build completed with esbuild')
