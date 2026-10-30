import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['entry.jsx'],bundle:true,minify:true,format:'iife',target:['es2020'],
  define:{'process.env.NODE_ENV':'"production"'},outfile:'../../assets/home/hero-threads.js',legalComments:'linked',
  banner:{js:'/*! React Bits Threads adapted for Potenciar Pymes. Notices: /assets/home/hero-threads.NOTICES.txt */'}});
const notices = await readFile('LICENSE.react-bits.md','utf8');
await writeFile('../../assets/home/hero-threads.NOTICES.txt', 'Threads: https://reactbits.dev/backgrounds/threads\nSource: https://github.com/DavidHDev/react-bits\n\n'+notices);
