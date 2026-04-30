import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const srcDir = resolve(fileURLToPath(import.meta.url), '../../frontend/src');
const r = (f) => readFileSync(resolve(srcDir, f), 'utf8');
const w = (f, c) => { writeFileSync(resolve(srcDir, f), c, 'utf8'); console.log('OK:', f); };

// 1. ChatPro.jsx: fix empty else blocks + remove unused disable line
{
  let c = r('components/ChatPro.jsx');
  // Fix multi-line empty else blocks
  c = c.replace(/(\} else \{)(\r?\n)(\s*\})/g, (m, open, nl, close) => {
    const indent = close.match(/^(\s*)/)[1];
    return `${open}${nl}${indent}  /* noop */${nl}${close}`;
  });
  // Remove the unused eslint-disable-next-line before }, [callActivo, callExpanded]
  c = c.replace(
    /(\r?\n)\s*\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps(\r?\n)(\s*\}, \[callActivo, callExpanded\])/,
    '$1$3'
  );
  w('components/ChatPro.jsx', c);
}

// 2. constantes.js: remove stale eslint-disable
{
  let c = r('utils/constantes.js');
  console.log('constantes starts with:', JSON.stringify(c.substring(0, 40)));
  // Try removing any eslint-disable on line 1
  const lines = c.split('\n');
  if (lines[0].trim() === '/* eslint-disable */') {
    lines.shift();
    c = lines.join('\n');
    w('utils/constantes.js', c);
  } else if (lines[0].includes('eslint-disable')) {
    lines[0] = '';
    c = lines.join('\n');
    w('utils/constantes.js', c);
  } else {
    console.log('constantes: no eslint-disable found at line 1 -', JSON.stringify(lines[0]));
  }
}
