import {build} from 'esbuild';
await build({
  entryPoints: ['entry.jsx'], bundle: true, minify: true, format: 'iife', target: ['es2020'],
  define: {'process.env.NODE_ENV': '"production"'},
  outfile: '../../assets/home/process-readout.js', legalComments: 'none',
  banner: {js: '/*! Potenciar Pymes: Cómo trabajamos (React 19, MIT). */'}
});
