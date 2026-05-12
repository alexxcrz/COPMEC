$files = Get-ChildItem "frontend/src" -Recurse -File | Where-Object { $_.Extension -in ".css", ".jsx", ".js" }
$map = [ordered]@{
  "#22c55e"="#5f8fbe"; "#4ade80"="#8fb4d6"; "#16a34a"="#4f7da9"; "#166534"="#2d4f72";
  "#10b981"="#5d88b2"; "#34d399"="#8eb5d6"; "#86efac"="#b4cde3"; "#bbf7d0"="#d1deea";
  "#15803d"="#3f678f"; "#059669"="#4a7197"; "#065f46"="#2c4b6b"; "#047857"="#3b6288";
  "#14532d"="#2a4765"; "#dcfce7"="#e8eff6"; "#d1fae5"="#dfe9f4"; "#ecfdf5"="#f0f5fa";
  "#f0fdf4"="#f2f6fb"; "#34c759"="#6f98bf"; "#34a853"="#5b85ad"; "#58d88d"="#7fa6c9";
  "#20894d"="#3d6388"; "#0f766e"="#355f88"; "#52b788"="#6f94b6"; "#2d6a4f"="#385a7d";
  "#40916c"="#5d84a8"; "#74c69d"="#8eb2cf"; "#95d5b2"="#a9c2d9"; "#b7e4c7"="#c3d3e2";
  "#2aa67f"="#5a86ae"; "#62d8ab"="#88aac9"; "#61d7a9"="#89accb"; "#9cf0ca"="#b9cde0";
  "#86dbc0"="#abc4da"; "#8ed9bf"="#a8bfd6"; "#a2f7d7"="#c4d7e8"; "#ccefe3"="#d7e3ef";
  "#abd8c8"="#b9cad9"; "#35c499"="#5a83aa"; "#3fc9a2"="#6e95ba"; "#91e9c9"="#b0c8de";
  "#66d9ae"="#8eafcc"; "#6fe0b8"="#99b8d1"; "#7ce0bb"="#9dbbd3"; "#75ac92"="#7f9fbe";
  "#d4edda"="#dbe7f2";
  "rgba(220, 252, 231,"="rgba(225, 235, 245,"; "rgba(236, 253, 245,"="rgba(237, 243, 250,";
  "rgba(222, 247, 238,"="rgba(224, 234, 245,"; "rgba(240, 253, 244,"="rgba(240, 245, 251,";
  "rgba(225, 241, 234,"="rgba(224, 233, 243,"; "rgba(236, 250, 245,"="rgba(235, 242, 249,";
  "rgba(249, 252, 251,"="rgba(248, 251, 254,"; "rgba(248,251,250,"="rgba(248,250,253,";
  "rgba(242,249,246,"="rgba(242,246,251,"; "rgba(148, 210, 176,"="rgba(148, 180, 210,";
  "rgba(226, 255, 241,"="rgba(226, 238, 248,"; "rgba(110, 231, 183,"="rgba(129, 170, 210,"
}
$changed = 0
foreach($f in $files){
  $c = Get-Content $f.FullName -Raw
  $u = $c
  foreach($k in $map.Keys){ $u = $u.Replace($k, $map[$k]) }
  if($u -ne $c){ Set-Content -Path $f.FullName -Value $u -NoNewline; $changed++ }
}
Write-Output "Changed files: $changed"
