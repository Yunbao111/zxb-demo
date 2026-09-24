import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
mkdirSync('.sites-runtime/tests',{recursive:true});
await build({entryPoints:['tests/free-report.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/tests/free-report.mjs'});
await import('../.sites-runtime/tests/free-report.mjs?run='+Date.now());
