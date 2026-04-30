import { readFileSync, writeFileSync } from 'fs';

let src = readFileSync('src/components/ChatPro.jsx', 'utf8');

// Revert state var renames - these ARE used inside guardarMiPerfil
src = src.replace('const [_editandoMiPerfil, _setEditandoMiPerfil]', 'const [editandoMiPerfil, setEditandoMiPerfil]');
src = src.replace('const [_editPerfilCargo, _setEditPerfilCargo]', 'const [editPerfilCargo, setEditPerfilCargo]');
src = src.replace('const [_editPerfilArea, _setEditPerfilArea]', 'const [editPerfilArea, setEditPerfilArea]');
src = src.replace('const [_editPerfilGuardando, _setEditPerfilGuardando]', 'const [editPerfilGuardando, setEditPerfilGuardando]');

// Fix catch body references to still use old name after binding was renamed
// In the catch(_err) blocks that log 'err' - update references
src = src.replace(
  'console.warn("Error al reproducir tono entrante:", err);',
  'console.warn("Error al reproducir tono entrante:", _err);'
);
src = src.replace(
  'console.warn("[NOTIFICATION] Error mostrando notificación de llamada:", err?.message || err);',
  'console.warn("[NOTIFICATION] Error mostrando notificación de llamada:", _err?.message || _err);'
);

// Now find remaining 'no-undef' catch body references at lines 743, 1095, 1259, 3270, 3786-3787
// Need to check those specific catch blocks
// Lines 1095, 1259: 'e' is not defined - catch blocks where body uses 'e' but binding was renamed

writeFileSync('src/components/ChatPro.jsx', src);
console.log('Reverts done. Checking remaining issues...');

// Re-read and search for remaining patterns
src = readFileSync('src/components/ChatPro.jsx', 'utf8');
const lines = src.split('\n');

// Find lines with 'catch (_e)' or 'catch (_err)' where body references old name
let issues = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/} catch \(_e\) \{/.test(line)) {
    // Find the end of this catch block
    let depth = 1;
    let j = i + 1;
    while (j < lines.length && depth > 0) {
      const l = lines[j];
      depth += (l.match(/\{/g) || []).length;
      depth -= (l.match(/\}/g) || []).length;
      if (/\be\b/.test(l) && !/\bcatch\b/.test(l) && !/\b_e\b/.test(l)) {
        issues.push(`Line ${j+1}: ${l.trim()} (catch at ${i+1})`);
      }
      j++;
    }
  }
  if (/} catch \(_err\) \{/.test(line)) {
    let depth = 1;
    let j = i + 1;
    while (j < lines.length && depth > 0) {
      const l = lines[j];
      depth += (l.match(/\{/g) || []).length;
      depth -= (l.match(/\}/g) || []).length;
      if (/\berr\b/.test(l) && !/\b_err\b/.test(l)) {
        issues.push(`Line ${j+1}: ${l.trim()} (catch at ${i+1})`);
      }
      j++;
    }
  }
}

console.log('Remaining references to old catch params in renamed catch blocks:');
issues.forEach(i => console.log(i));
