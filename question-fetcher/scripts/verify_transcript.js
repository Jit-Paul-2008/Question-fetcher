#!/usr/bin/env node
import fs from 'fs/promises';
import crypto from 'crypto';

async function main(){
  const arg = process.argv[2];
  if(!arg){
    console.error('Usage: verify_transcript.js <path-to-transcript.md>');
    process.exit(2);
  }
  const raw = await fs.readFile(arg,'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if(!m){
    console.error('File missing frontmatter signature');
    process.exit(3);
  }
  const fm = m[1];
  const body = m[2].trim();
  const sigMatch = fm.match(/signature:\s*([0-9a-fA-F]+)/i);
  if(!sigMatch){
    console.error('No signature in frontmatter');
    process.exit(4);
  }
  const sig = sigMatch[1];
  const hash = crypto.createHash('sha256').update(body).digest('hex');
  if(hash === sig){
    console.log('OK: signature matches');
    process.exit(0);
  } else {
    console.error('MISMATCH: expected', sig, 'got', hash);
    process.exit(5);
  }
}

main();
