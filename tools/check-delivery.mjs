import fs from 'node:fs';
import path from 'node:path';
const root = new URL('../', import.meta.url);
const files = fs.readdirSync(root, { recursive: true }).filter(p => p !== '.git' && !p.startsWith('.git/') && !p.startsWith('node_modules/') && fs.statSync(new URL(p, root)).isFile());
const forbidden = files.filter(p => /\.(asar|node|dmg|deb|msix|map|png|webm|mp3|ttf|woff2?)$/i.test(p));
if (forbidden.length) throw Error('Vendor payload found: ' + forbidden.join(', '));
for (const file of files.filter(p => p.startsWith('evidence/') && p.endsWith('.json'))) {
  const data = fs.readFileSync(new URL(file, root), 'utf8');
  if (/"sourcesContent"\s*:/.test(data)) throw Error('Vendor source content found in ' + file);
  JSON.parse(data);
}
for (const file of files.filter(p => p.endsWith('.md'))) {
  const text = fs.readFileSync(new URL(file, root), 'utf8');
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#|mailto:)/.test(target)) continue;
    const local = path.posix.join(path.posix.dirname(file), target.split('#')[0]);
    if (!files.includes(local)) throw Error(`Missing link ${file} -> ${target}`);
  }
}
const privateMarkers = [
  /annachou5566\/wave-alpha\b/,
  /wave-alpha\.pages\.dev/,
  /chatgpt\/superchart-/,
  /wave-source-identity\.json/,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  /[a-z0-9._%+-]+@gmail\.com/i,
];
for (const file of files.filter(p => p.endsWith('.md') || p.startsWith('evidence/'))) {
  const data = fs.readFileSync(new URL(file, root), 'utf8');
  if (privateMarkers.some(pattern => pattern.test(data))) throw Error('Private operational marker found in ' + file);
}
console.log(JSON.stringify({ status: 'PASS', files: files.length, vendor_payloads: 0, known_private_markers: 0, evidence_json: 'valid', markdown_local_links: 'valid' }));
