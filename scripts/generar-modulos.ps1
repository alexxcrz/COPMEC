param()
$root = "C:\Users\alexx\Desktop\COPMEC"
$f    = "$root\frontend\src\App.jsx"
$src  = "$root\frontend\src"
$lines = [IO.File]::ReadAllLines($f, [Text.Encoding]::UTF8)
Write-Host "App.jsx lines: $($lines.Count)"

# Helper: extract 0-based ranges from $lines
function Extract($ranges) {
  $out = [System.Collections.Generic.List[string]]::new()
  foreach ($r in $ranges) { foreach ($i in $r) { $out.Add($lines[$i]) } }
  return ,$out
}

# ─── CONSTANTES.JS ────────────────────────────────────────────────────────────
$constContent = [System.Collections.Generic.List[string]]::new()
$constContent.Add("/* eslint-disable */")
$constContent.Add('import {')
$constContent.Add('  BarChart3, LayoutDashboard, ClipboardList, CalendarDays, Package,')
$constContent.Add('  Users, PieChart, BookOpen, OctagonAlert,')
$constContent.Add('} from "lucide-react";')
$constContent.Add("")

# Batch 1: lines 66-225 (0-based 65-224)
65..224 | ForEach-Object { $constContent.Add($lines[$_]) }
$constContent.Add("")
# Batch 2: lines 241-383 (0-based 240-382)
240..382 | ForEach-Object { $constContent.Add($lines[$_]) }
$constContent.Add("")
# BOARD_TEMPLATES: lines 511-812 (0-based 510-811)
510..811 | ForEach-Object { $constContent.Add($lines[$_]) }
$constContent.Add("")
# Batch 3: lines 813-909 (0-based 812-908)
812..908 | ForEach-Object { $constContent.Add($lines[$_]) }
$constContent.Add("")
# Batch 4: lines 1480-1602 (0-based 1479-1601)
1479..1601 | ForEach-Object { $constContent.Add($lines[$_]) }

[IO.File]::WriteAllLines("$src\utils\constantes.js", $constContent, [Text.Encoding]::UTF8)
Write-Host "constantes.js: $($constContent.Count) lines"

# ─── UTILIDADES.JS ─────────────────────────────────────────────────────────────
$utilContent = [System.Collections.Generic.List[string]]::new()
$utilContent.Add("/* eslint-disable */")
$utilContent.Add('import {')
# We'll add a big named import from constantes.js
$allConstNames = ($constContent | Select-String "^const ([A-Z_][A-Z0-9_]*) =" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -join ", "
$utilContent.Add("  $allConstNames")
$utilContent.Add('} from "./constantes.js";')
$utilContent.Add('import { getExcelJsModule } from "./utilidadesImportExcel.js";')
$utilContent.Add("")

# Functions batch 1: lines 226-238 (0-based 225-237) — getInitialRouteState
225..237 | ForEach-Object { $utilContent.Add($lines[$_]) }
$utilContent.Add("")
# Functions batch 2: lines 385-510 (0-based 384-509) — board column helpers
384..509 | ForEach-Object { $utilContent.Add($lines[$_]) }
$utilContent.Add("")
# Functions batch 3: lines 910-1411 (0-based 909-1410)
909..1410 | ForEach-Object { $utilContent.Add($lines[$_]) }
$utilContent.Add("")
# Functions batch 4: lines 1603-4199 (0-based 1602-4198)
1602..4198 | ForEach-Object { $utilContent.Add($lines[$_]) }

[IO.File]::WriteAllLines("$src\utils\utilidades.js", $utilContent, [Text.Encoding]::UTF8)
Write-Host "utilidades.js: $($utilContent.Count) lines"

# ─── NOTIFICACIONES.JSX ────────────────────────────────────────────────────────
$notifContent = [System.Collections.Generic.List[string]]::new()
$notifContent.Add("/* eslint-disable react/prop-types */")
$notifContent.Add('import { Bell, X } from "lucide-react";')
$notifContent.Add("")

# Lines 1412-1479 (0-based 1411-1478)
1411..1478 | ForEach-Object { $notifContent.Add($lines[$_]) }
$notifContent.Add("")
$notifContent.Add("export { AppToastStack, AppNotificationCenter };")

[IO.File]::WriteAllLines("$src\components\Notificaciones.jsx", $notifContent, [Text.Encoding]::UTF8)
Write-Host "Notificaciones.jsx: $($notifContent.Count) lines"

# ─── BUSCADORINVENTARIO.JSX ────────────────────────────────────────────────────
$buscContent = [System.Collections.Generic.List[string]]::new()
$buscContent.Add("/* eslint-disable react/prop-types */")
$buscContent.Add('import { useState, useEffect, useMemo, useRef } from "react";')
$buscContent.Add('import { createPortal } from "react-dom";')
$buscContent.Add('import { X } from "lucide-react";')
$buscContent.Add('import { normalizeKey, formatInventoryLookupLabel, findInventoryItemByQuery } from "../utils/utilidades.js";')
$buscContent.Add("")

# Lines 4200-4370 (0-based 4199-4369)
4199..4369 | ForEach-Object { $buscContent.Add($lines[$_]) }
$buscContent.Add("")
$buscContent.Add("export { InventoryLookupInput };")

[IO.File]::WriteAllLines("$src\components\BuscadorInventario.jsx", $buscContent, [Text.Encoding]::UTF8)
Write-Host "BuscadorInventario.jsx: $($buscContent.Count) lines"

Write-Host "Done creating module files."
