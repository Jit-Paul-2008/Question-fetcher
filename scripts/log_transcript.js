#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {execSync} from 'child_process';

async function readStdin(){
  if(process.stdin.isTTY) return null;
  let s='';
  for await(const c of process.stdin) s+=c;
  return s;
}

function shortHex(h){return h.slice(0,8);} 

async function main(){
  const fileArgIdx = process.argv.indexOf('--file');
  let raw;
  if(fileArgIdx!==-1 && fileArgIdx+1<process.argv.length){
    raw = await fs.readFile(process.argv[fileArgIdx+1],'utf8');
  } else {
    raw = await readStdin();
  }
  if(!raw){
    console.error('Usage: log_transcript.js --file path OR pipe transcript into stdin');
    process.exit(2);
  }
  const canonical = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  const sig = hash;
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const short = shortHex(hash);
  const dir = path.resolve('memories','session');
  await fs.mkdir(dir,{recursive:true});
  const fname = path.join(dir, `${ts}-${short}.md`);
  const out = `---\nsignature: ${sig}\ncreated: ${new Date().toISOString()}\n---\n\n${canonical}\n`;
  await fs.writeFile(fname, out, 'utf8');
  try{
    execSync(`git add ${fname}`);
    execSync(`git commit -m "chore(transcript): add ${short}" --no-verify`);
    console.log('Logged transcript to', fname);
  }catch(e){
    console.log('Wrote transcript to', fname, '(git commit may have failed)');
  }
}

main();
