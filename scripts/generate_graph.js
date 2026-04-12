#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

async function walk(dir, out){
  try{
    const items = await fs.readdir(dir, {withFileTypes:true});
    for(const it of items){
      const p = path.join(dir, it.name);
      if(it.isDirectory()) await walk(p,out);
      else if(it.isFile() && p.endsWith('.md')) out.push(p);
    }
  }catch(e){}
}

function extractLinks(content){
  const re = /\[\[([^\]|#]+)(?:\|[^\]]+)?(?:#[^\]]+)?\]\]/g;
  const out = [];
  let m;
  while((m=re.exec(content))){ out.push(m[1].trim()); }
  return out;
}

function basenameNoExt(p){ return path.basename(p).replace(/\.md$/i,''); }

async function main(){
  const root = path.resolve('memories','repo');
  const files = [];
  await walk(root, files);
  const nodes = [];
  const edges = [];
  const mapByName = new Map();
  for(const f of files){
    const nid = path.relative(root, f);
    nodes.push({id: nid, title: basenameNoExt(f)});
    mapByName.set(basenameNoExt(f).toLowerCase(), nid);
    // also try frontmatter title
    try{
      const content = await fs.readFile(f,'utf8');
      const fm = content.startsWith('---') ? content.split('---')[1] : null;
      if(fm){
        const m = fm.match(/title:\s*"?([^"]+)"?/i);
        if(m) mapByName.set(m[1].trim().toLowerCase(), nid);
      }
    }catch(e){}
  }
  for(const f of files){
    try{
      const content = await fs.readFile(f,'utf8');
      const src = path.relative(root, f);
      const links = extractLinks(content);
      for(const l of links){
        const key = l.toLowerCase();
        const target = mapByName.get(key);
        if(target) edges.push({source: src, target});
      }
    }catch(e){}
  }
  const outdir = path.join('tools','vault-watcher');
  await fs.mkdir(outdir,{recursive:true});
  await fs.writeFile(path.join(outdir,'graph.json'), JSON.stringify({nodes,edges},null,2),'utf8');
  console.log('Wrote', path.join(outdir,'graph.json'));
}

main();
