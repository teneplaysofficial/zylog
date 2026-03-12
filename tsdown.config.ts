import { banner } from 'echo-banner';
import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig([
  {
    entry: './lib/index.ts',
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    exports: true,
    banner: {
      js: banner({
        pkg,
      }),
    },
  },
]);
