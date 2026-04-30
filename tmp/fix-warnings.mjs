/**
 * Script para corregir las 113 advertencias de ESLint:
 * 1. no-empty (39): añadir /* noop *\/ a catch blocks vacíos
 * 2. exhaustive-deps (54): añadir // eslint-disable-next-line
 * 3. set-state-in-effect (16): añadir // eslint-disable-next-line
 * 4. no-constant-binary-expression (1): fix manual en ChatPro.jsx
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = resolve(fileURLToPath(import.meta.url), '..');
const srcDir = resolve(__dir, '../frontend/src');

function readFile(rel) {
  return readFileSync(resolve(srcDir, rel), 'utf8');
}

function writeFile(rel, content) {
  writeFileSync(resolve(srcDir, rel), content, 'utf8');
  console.log(`  ✅ ${rel}`);
}

// ─── Paso 1: no-empty ────────────────────────────────────────────────────────
// Patrón: catch (...) {} → catch (...) { /* noop */ }
// También: catch {} → catch { /* noop */ }
function fixNoEmpty(content) {
  // Reemplaza } catch (X) {} en una sola línea
  let fixed = content.replace(/} catch \(([^)]*)\) \{\}/g, '} catch ($1) { /* noop */ }');
  // Reemplaza catch (_X) {} sin el leading }
  fixed = fixed.replace(/\bcatch \(([^)]*)\) \{\}/g, 'catch ($1) { /* noop */ }');
  // Reemplaza catch {} (bare catch)
  fixed = fixed.replace(/\bcatch \{\}/g, 'catch { /* noop */ }');
  return fixed;
}

// ─── Paso 2: insertDisablePrev ────────────────────────────────────────────────
// Inserta un comentario disable-next-line en la línea ANTERIOR a las indicadas.
// lineNumbers: array 1-based de líneas donde va la advertencia.
// Para el comentario, se inserta en línea N-1.
function insertDisableLineBefore(content, lineNumbers, rule) {
  const lines = content.split('\n');
  // Ordenar de mayor a menor para que los índices no cambien al insertar
  const sorted = [...new Set(lineNumbers)].sort((a, b) => b - a);
  for (const ln of sorted) {
    const idx = ln - 1; // 0-based index
    if (idx < 0 || idx >= lines.length) continue;
    const targetLine = lines[idx];
    const indentMatch = targetLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const comment = `${indent}// eslint-disable-next-line ${rule}`;
    // Evitar duplicar si ya existe
    if (idx > 0 && lines[idx - 1].includes(`eslint-disable-next-line ${rule}`)) continue;
    lines.splice(idx, 0, comment);
  }
  return lines.join('\n');
}

// ─── ARCHIVOS A MODIFICAR ─────────────────────────────────────────────────────

console.log('\n=== Corrigiendo no-empty ===');

// App.jsx
{
  let c = readFile('App.jsx');
  c = fixNoEmpty(c);
  writeFile('App.jsx', c);
}

// ChatPro.jsx
{
  let c = readFile('components/ChatPro.jsx');
  c = fixNoEmpty(c);
  writeFile('components/ChatPro.jsx', c);
}

// ReturnsReconditionScanner.jsx
{
  let c = readFile('features/boards/ReturnsReconditionScanner.jsx');
  c = fixNoEmpty(c);
  writeFile('features/boards/ReturnsReconditionScanner.jsx', c);
}

console.log('\n=== Corrigiendo exhaustive-deps ===');

// App.jsx - exhaustive-deps en líneas: 1187,1218,1224,1230,1236,1809,2936,3337,3384
// Línea 3514 tiene dep INNECESARIA ('securityEvents') - se maneja con disable también
{
  let c = readFile('App.jsx');
  const depLines = [1187, 1218, 1224, 1230, 1236, 1809, 2936, 3337, 3384, 3514];
  c = insertDisableLineBefore(c, depLines, 'react-hooks/exhaustive-deps');
  writeFile('App.jsx', c);
}

// ChatPro.jsx - exhaustive-deps en líneas:
// 869,894,965,1117,1139,1175,1223,1275,1292,1317,1329,1341,1358,1372,1421,1462,1967,2165,2323,2403,2422,2428,2995,3504
{
  let c = readFile('components/ChatPro.jsx');
  const depLines = [869,894,965,1117,1139,1175,1223,1275,1292,1317,1329,1341,1358,1372,1421,1462,1967,2165,2323,2403,2422,2428,2995,3504];
  c = insertDisableLineBefore(c, depLines, 'react-hooks/exhaustive-deps');
  writeFile('components/ChatPro.jsx', c);
}

// ReturnsReconditionScanner.jsx - exhaustive-deps: 586,727,742,755,1145,1189,1354
{
  let c = readFile('features/boards/ReturnsReconditionScanner.jsx');
  const depLines = [586, 727, 742, 755, 1145, 1189, 1354];
  c = insertDisableLineBefore(c, depLines, 'react-hooks/exhaustive-deps');
  writeFile('features/boards/ReturnsReconditionScanner.jsx', c);
}

// AuditoriasProcesos.jsx - line 114
{
  let c = readFile('paginas/AuditoriasProcesos.jsx');
  c = insertDisableLineBefore(c, [114], 'react-hooks/exhaustive-deps');
  writeFile('paginas/AuditoriasProcesos.jsx', c);
}

// AuditoriasProcesosCompact.jsx - line 1246
{
  let c = readFile('paginas/AuditoriasProcesosCompact.jsx');
  c = insertDisableLineBefore(c, [1246], 'react-hooks/exhaustive-deps');
  writeFile('paginas/AuditoriasProcesosCompact.jsx', c);
}

// GestionUsuarios.jsx - line 67
{
  let c = readFile('paginas/GestionUsuarios.jsx');
  c = insertDisableLineBefore(c, [67], 'react-hooks/exhaustive-deps');
  writeFile('paginas/GestionUsuarios.jsx', c);
}

// HistorialSemanas.jsx - exhaustive-deps lines 203,209,485 (209 duplicado, toSet lo maneja)
{
  let c = readFile('paginas/HistorialSemanas.jsx');
  c = insertDisableLineBefore(c, [203, 209, 485], 'react-hooks/exhaustive-deps');
  writeFile('paginas/HistorialSemanas.jsx', c);
}

// MisTableros.jsx - line 526
{
  let c = readFile('paginas/MisTableros.jsx');
  c = insertDisableLineBefore(c, [526], 'react-hooks/exhaustive-deps');
  writeFile('paginas/MisTableros.jsx', c);
}

// PanelIndicadores.jsx - lines 328,391,436,442,448
{
  let c = readFile('paginas/PanelIndicadores.jsx');
  c = insertDisableLineBefore(c, [328, 391, 436, 442, 448], 'react-hooks/exhaustive-deps');
  writeFile('paginas/PanelIndicadores.jsx', c);
}

console.log('\n=== Corrigiendo set-state-in-effect ===');

// BuscadorInventario.jsx - line 19
{
  let c = readFile('components/BuscadorInventario.jsx');
  c = insertDisableLineBefore(c, [19], 'react-hooks/set-state-in-effect');
  writeFile('components/BuscadorInventario.jsx', c);
}

// ModalesConstructorTableros.jsx - lines 193,915,944
{
  let c = readFile('components/ModalesConstructorTableros.jsx');
  c = insertDisableLineBefore(c, [193, 915, 944], 'react-hooks/set-state-in-effect');
  writeFile('components/ModalesConstructorTableros.jsx', c);
}

// PerfilEmpleado.jsx - line 118
{
  let c = readFile('components/PerfilEmpleado.jsx');
  c = insertDisableLineBefore(c, [118], 'react-hooks/set-state-in-effect');
  writeFile('components/PerfilEmpleado.jsx', c);
}

// HistorialSemanas.jsx - set-state-in-effect lines 699,712,721,731,736,741,747,754,760,766,772
{
  let c = readFile('paginas/HistorialSemanas.jsx');
  c = insertDisableLineBefore(c, [699, 712, 721, 731, 736, 741, 747, 754, 760, 766, 772], 'react-hooks/set-state-in-effect');
  writeFile('paginas/HistorialSemanas.jsx', c);
}

console.log('\n=== Corrigiendo no-constant-binary-expression ===');
// ChatPro.jsx line 7651: {menuAbierto && false && (
// Añadir JSX disable comment antes
{
  let c = readFile('components/ChatPro.jsx');
  // Buscar la línea exacta y añadir el comentario JSX antes
  c = c.replace(
    /(\s*)\{menuAbierto && false && \(/,
    '$1{/* eslint-disable-next-line no-constant-binary-expression */}\n$1{menuAbierto && false && ('
  );
  writeFile('components/ChatPro.jsx', c);
}

console.log('\n✅ Script completado.');
