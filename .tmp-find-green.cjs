const fs = require("fs");
const path = require("path");
const root = path.join(process.cwd(), "frontend", "src");
const exts = new Set([".css", ".js", ".jsx"]);
const out = [];
function scanFile(file){
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
  const lines = text.split(/\r?\n/);
  const hexRe = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const rgbRe = /rgba?\(([^)]+)\)/g;
  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    let m;
    while((m = hexRe.exec(line))){
      let h = m[1];
      if(h.length===3) h = h.split("").map(c=>c+c).join("");
      const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
      if(g > r + 8 && g > b + 8) out.push(`${rel}:${i+1}: ${m[0]}`);
    }
    while((m = rgbRe.exec(line))){
      const parts = m[1].split(",").map(s=>s.trim());
      if(parts.length < 3) continue;
      const r = Number(parts[0]), g = Number(parts[1]), b = Number(parts[2]);
      if(Number.isNaN(r)||Number.isNaN(g)||Number.isNaN(b)) continue;
      if(g > r + 8 && g > b + 8) out.push(`${rel}:${i+1}: ${m[0]}`);
    }
  }
}
function walk(dir){
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir,name);
    const st = fs.statSync(p);
    if(st.isDirectory()) walk(p);
    else if(exts.has(path.extname(p))) scanFile(p);
  }
}
walk(root);
console.log(out.join("\n"));
console.log(`TOTAL:${out.length}`);
