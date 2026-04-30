import { readFileSync, writeFileSync } from 'fs';

let src = readFileSync('src/components/ChatPro.jsx', 'utf8');

// The problem: we globally renamed all catch (e) -> catch (_e) and catch (err) -> catch (_err)
// But many of those catches DO use the variable in the body.
// We need to: 
//   - For catches where body USES the variable: revert to original name (keep e, err, error)
//   - For catches where body does NOT use the variable: rename to _e, _err, _error (keep as is)
// 
// The list of catch blocks whose body still uses the old name (from previous run):
// These need to be reverted: the catch binding should use the ORIGINAL name and body references stay

const revertList = [
  // [catchLine (1-based), bindingToRevert, oldBinding]
  // Line 670: catch (_err) -> catch (err)  (body at 671 uses err)
  670,
  // Line 1093: catch (_e) -> catch (e)     (body at 1095 uses e)
  1093,
  // Line 1257: catch (_e) -> catch (e)     (body at 1259 uses e)
  1257,
  // Line 3268: catch (_err) -> catch (err)  (body at 3270 uses err)
  3268,
  // Line 3785: catch (_err) -> catch (err)  (body at 3786-3787 uses err)
  3785,
  // Line 4142: catch (_err) -> catch (err)  (body at 4143 uses err)
  4142,
  // Line 4284: catch (_e) -> catch (e)      (body at 4287-4301 uses e)
  4284,
  // Line 4345: catch (_e) -> catch (e)      (body at 4346 uses e)
  4345,
  // Line 4374: catch (_e) -> catch (e)      (body at 4375 uses e)
  4374,
  // Line 4564: catch (_err) -> catch (err)  (body at 4565 uses err)
  4564,
  // Line 4600: catch (_err) -> catch (err)  (body at 4601 uses err)
  4600,
  // Line 4645: catch (_err) -> catch (err)  (body at 4646 uses err)
  4645,
  // Line 4765: catch (_err) -> catch (err)  (body at 4766 uses err)
  4765,
  // Line 5030: catch (_err) -> catch (err)  (body at 5031 uses err)
  5030,
  // Line 5159: catch (_err) -> catch (err)  (body at 5160 uses err)
  5159,
  // Line 5221: catch (_err) -> catch (err)  (body at 5222 uses err)
  5221,
  // Line 5378: catch (_err) -> catch (err)  (body at 5379 uses err)
  5378,
  // Line 5431: catch (_err) -> catch (err)  (body at 5432-5435 uses err)
  5431,
  // Line 5529: catch (_e) -> catch (e)      (body at 5530 uses e)
  5529,
  // Line 6879: catch (_e) -> catch (e)      (body at 6881 uses e)
  6879,
  // Line 6905: catch (_e) -> catch (e)      (body at 6907 uses e)
  6905,
];

const lines = src.split('\n');
for (const lineNum of revertList) {
  const idx = lineNum - 1;
  if (lines[idx].includes('catch (_e)')) {
    lines[idx] = lines[idx].replace('catch (_e)', 'catch (e)');
    console.log(`Reverted line ${lineNum}: catch (_e) -> catch (e)`);
  } else if (lines[idx].includes('catch (_err)')) {
    lines[idx] = lines[idx].replace('catch (_err)', 'catch (err)');
    console.log(`Reverted line ${lineNum}: catch (_err) -> catch (err)`);
  } else if (lines[idx].includes('catch (_error)')) {
    lines[idx] = lines[idx].replace('catch (_error)', 'catch (error)');
    console.log(`Reverted line ${lineNum}: catch (_error) -> catch (error)`);
  } else {
    console.log(`WARNING: Line ${lineNum} not matched: ${lines[idx].trim()}`);
  }
}

// Also fix the line 671 tono saliente (a different catch from line 670)
// and any other specific body references to err/e that need updating (only where catch was kept as _err)
// The only ones remaining after revert should be catches where binding is _err/_e and body is empty

src = lines.join('\n');
writeFileSync('src/components/ChatPro.jsx', src);
console.log('Done');
