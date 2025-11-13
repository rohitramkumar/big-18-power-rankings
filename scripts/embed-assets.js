#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const publicDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'dist', 'public');
const outFile = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'dist', 'embedded-assets.js');

const mime = (p) => {
  const ext = path.extname(p).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    case '.ico': return 'image/x-icon';
    case '.woff2': return 'font/woff2';
    case '.woff': return 'font/woff';
    default: return 'application/octet-stream';
  }
};

async function walk(dir) {
  let entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const res = path.resolve(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...await walk(res));
    } else if (ent.isFile()) {
      files.push(res);
    }
  }
  return files;
}

async function main(){
  try {
    // ensure public dir exists
    await fs.access(publicDir);
  } catch (err) {
    console.error('Public build not found at', publicDir);
    process.exit(1);
  }

  const files = await walk(publicDir);
  const assets = {};

  for (const f of files) {
    const rel = path.relative(publicDir, f).split(path.sep).join('/');
    const key = '/' + rel;
    const buf = await fs.readFile(f);
    const b64 = buf.toString('base64');
    assets[key] = { data: b64, type: mime(f) };
    if (key === '/index.html') {
      // also expose root
      assets['/'] = assets[key];
    }
  }

  const out = `export const ASSETS = ${JSON.stringify(assets, null, 2)};\n`;
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, out, 'utf8');
  console.log('Wrote embedded assets to', outFile);
  // Also embed rankings JSON files
  try {
    const rankingsDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'rankings');
    await fs.access(rankingsDir);
    const rankingFiles = await fs.readdir(rankingsDir);
    const rankings = {};
    for (const rf of rankingFiles) {
      if (!rf.endsWith('.json')) continue;
      const full = path.join(rankingsDir, rf);
      const content = await fs.readFile(full, 'utf8');
      try {
        rankings[rf] = JSON.parse(content);
      } catch (e) {
        console.warn('Skipping invalid JSON', rf);
      }
    }

    const outRankingsFile = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'dist', 'embedded-rankings.js');
    const out2 = `export const RANKINGS = ${JSON.stringify(rankings, null, 2)};\n`;
    await fs.writeFile(outRankingsFile, out2, 'utf8');
    console.log('Wrote embedded rankings to', outRankingsFile);
  } catch (err) {
    console.log('No rankings directory found to embed');
  }
}

main();

