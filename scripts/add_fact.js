#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import {execSync} from 'child_process';

function slugify(s){
  return s.toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function getArg(name){
  const idx = process.argv.indexOf(name);
  if(idx!==-1 && idx+1<process.argv.length) return process.argv[idx+1];
  return null;
}

async function readStdin(){
  if(process.stdin.isTTY) return null;
  let s='';
  for await (const chunk of process.stdin) s += chunk;
  return s;
}

async function main(){
  const title = getArg('--title') || getArg('-t');
  const slugArg = getArg('--slug') || null;
  const textArg = getArg('--text') || null;
  const text = textArg || (await readStdin()) || '';
  if(!title){
    console.error('Usage: add_fact.js --title "Title" [--slug slug] [--text "fact text"] (or pipe text)');
    process.exit(2);
  }
  const slug = slugArg || slugify(title);
  const dir = path.resolve('memories','repo','facts');
  await fs.mkdir(dir,{recursive:true});
  const file = path.join(dir, `${slug}.md`);
  const content = `---\ntitle: "${title.replace(/"/g,'\"')}"\ndate: ${new Date().toISOString()}\n---\n\n${text}\n`;
  await fs.writeFile(file, content, 'utf8');
  try{
    execSync(`git add ${file}`);
    execSync(`git commit -m "chore(fact): add ${slug}" --no-verify`);
    console.log('Added and committed', file);
  }catch(e){
    console.log('Wrote', file, '(git commit may have failed if running in detached state)');
  }
}

main();
