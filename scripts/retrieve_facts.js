#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

function getArgStr(){
  const a = process.argv.slice(2).join(' ').trim();
  return a;
}

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

function scoreContent(content, tokens){
  const lc = content.toLowerCase();
  let s = 0;
  for(const t of tokens){
    if(!t) continue;
    s += (lc.split(t).length - 1);
  }
  return s;
}

async function snippetFor(content, tokens){
  const lc = content.toLowerCase();
  for(const t of tokens){
    const i = lc.indexOf(t);
    if(i!==-1){
      const start = Math.max(0,i-120);
      return content.slice(start, start+400).replace(/\n/g,'\n');
    }
  }
  return content.slice(0,200);
}

async function main(){
  const q = getArgStr();
  if(!q){
    console.error('Usage: retrieve_facts.js <query>');
    process.exit(2);
  }
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const root = path.resolve('memories','repo');
  const files = [];
  await walk(root, files);
  const results = [];
  for(const f of files){
    try{
      const content = await fs.readFile(f,'utf8');
      const s = scoreContent(content, tokens);
      if(s>0){
        const snip = await snippetFor(content, tokens);
        results.push({file: path.relative(process.cwd(), f), score: s, snippet: snip});
      }
    }catch(e){/*skip*/}
  }
  results.sort((a,b)=>b.score-a.score);
  console.log(JSON.stringify(results.slice(0,10), null, 2));
}

main();
