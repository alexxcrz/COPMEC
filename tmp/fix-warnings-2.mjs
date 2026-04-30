/**
 * Fix round 2:
 * - Multi-line empty catch blocks en ChatPro.jsx
 * - Quitar disable comments no usados en HistorialSemanas.jsx
 * - Quitar eslint-disable obsoletos en utils
 * - Arreglar blank line antes de JSX disable en ChatPro.jsx
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const srcDir = resolve(fileURLToPath(import.meta.url), '../../frontend/src');

function readFile(rel) {
  return readFileSync(resolve(srcDir, rel), 'utf8');
}
function writeFile(rel, content) {
  writeFileSync(resolve(srcDir, rel), content, 'utf8');
  console.log(`  ✅ ${rel}`);
}

// ─── ChatPro.jsx ─────────────────────────────────────────────────────────────
{
  let c = readFile('components/ChatPro.jsx');

  // 1. Multi-line empty catch blocks: } catch (X) {\n   (optional \r)\n   } 
  //    Patrón: catch (...) {\r?\n\s+}\r?(\n|$)
  //    Hay que añadir /* noop */ dentro del bloque vacío
  c = c.replace(
    /(\bcatch \([^)]*\) \{)(\r?\n)(\s*\})/g,
    (match, open, nl, close) => {
      // Verificar que entre open y close solo hay whitespace
      const indent = close.match(/^(\s*)/)[1];
      return `${open}${nl}${indent}  /* noop */${nl}${close}`;
    }
  );

  // 2. Bare catch multi-line: catch {\r?\n\s+}
  c = c.replace(
    /(\bcatch \{)(\r?\n)(\s*\})/g,
    (match, open, nl, close) => {
      const indent = close.match(/^(\s*)/)[1];
      return `${open}${nl}${indent}  /* noop */${nl}${close}`;
    }
  );

  // 3. Empty if/else blocks that aren't catch: just if/else bodies
  //    La línea 1099 es un if (...) {} multi-línea vacío
  c = c.replace(
    /(if\s*\([^)]*\)\s*\{)(\r?\n)(\s*\})/g,
    (match, open, nl, close) => {
      const indent = close.match(/^(\s*)/)[1];
      return `${open}${nl}${indent}  /* noop */${nl}${close}`;
    }
  );

  // 4. Quitar la línea en blanco entre el JSX disable comment y {menuAbierto && false && (
  //    Patrón: {/* eslint-disable-next-line no-constant-binary-expression */}\n\r\n
  c = c.replace(
    /(\{\/\* eslint-disable-next-line no-constant-binary-expression \*\/\})(\r?\n)(\s*\r?\n)(\s*\{menuAbierto && false && \()/,
    '$1$2$4'
  );

  writeFile('components/ChatPro.jsx', c);
}

// ─── HistorialSemanas.jsx ─────────────────────────────────────────────────────
// Eliminar todos los disable comments set-state-in-effect insertados (innecesarios)
{
  let c = readFile('paginas/HistorialSemanas.jsx');
  // Quitar líneas que contienen solo el disable comment (pueden tener \r al inicio)
  const lines = c.split('\n');
  const filtered = lines.filter(line => 
    !line.trim().match(/^\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect$/)
  );
  c = filtered.join('\n');
  writeFile('paginas/HistorialSemanas.jsx', c);
}

// ─── utils/constantes.js ─────────────────────────────────────────────────────
// Quitar /* eslint-disable */ obsoleto
{
  let c = readFile('utils/constantes.js');
  c = c.replace(/^\/\* eslint-disable \*\/\r?\n/, '');
  writeFile('utils/constantes.js', c);
}

// ─── utils/utilidadesFormulas.js ─────────────────────────────────────────────
{
  let c = readFile('utils/utilidadesFormulas.js');
  c = c.replace(/^\/\* eslint-disable \*\/\r?\n/, '');
  writeFile('utils/utilidadesFormulas.js', c);
}

console.log('\n✅ Round 2 completado.');
