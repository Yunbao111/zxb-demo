import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
mkdirSync('.sites-runtime/tests',{recursive:true});
await build({entryPoints:['tests/core.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/tests/core.mjs'});
await import('../.sites-runtime/tests/core.mjs?run='+Date.now());
