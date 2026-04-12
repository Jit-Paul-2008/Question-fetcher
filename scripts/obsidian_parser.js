#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const NOTES_DIR = path.resolve('.github/obsidian-sync/notes');
const OUT_DIR = path.resolve('.github/obsidian-sync/for-apply');

function slugify(s){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

async function parseFrontmatter(content){
  if(!content.startsWith('---')) return null;
  const end = content.indexOf('\n---',3);
  if(end===-1) return null;
  const fm = content.slice(3,end).trim();
  const body = content.slice(end+4).trim();
  const lines = fm.split(/\n/);
  const out = {};
  for(const line of lines){
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if(m){
      out[m[1].toLowerCase()] = m[2].replace(/^"|"$/g,'').trim();
    }
  }
  return {fm: out, body};
}

async function main(){
  try{
    await fs.rm(OUT_DIR,{recursive:true,force:true});
    await fs.mkdir(OUT_DIR,{recursive:true});
    const files = await fs.readdir(NOTES_DIR);
    const results = [];
    for(const f of files){
      if(!f.endsWith('.md')) continue;
      const p = path.join(NOTES_DIR,f);
      const content = await fs.readFile(p,'utf8');
      const parsed = await parseFrontmatter(content);
      if(!parsed){
        results.push({file:f,error:'no frontmatter'});
        continue;
      }
      const title = parsed.fm.title || path.basename(f, '.md');
      const type = (parsed.fm.type || 'update').toLowerCase();
      const slug = slugify(title);
      let targetPath;
      if(type==='policy'){
        targetPath = path.join('.github','instructions', `${slug}.instructions.md`);
      } else if(type==='decision'){
        targetPath = path.join('memories','repo', 'decisions', `${slug}.md`);
      } else {
        targetPath = path.join('memories','session','updates', `${slug}.md`);
      }
      const outPath = path.join(OUT_DIR, targetPath);
      await fs.mkdir(path.dirname(outPath),{recursive:true});
      const outContent = `---\nsource_note: ${f}\noriginal_path: ${p}\n---\n\n${content}`;
      await fs.writeFile(outPath,outContent,'utf8');
      results.push({file:f,parsed:{title,type,slug},out:outPath});
    }
    console.log('Parser results:\n', JSON.stringify(results,null,2));
    console.log('\nFiles prepared under .github/obsidian-sync/for-apply. To apply them create a branch and copy the prepared files into the repo root as appropriate, or run the wrapper script.');
  }catch(e){
    console.error(e);
    process.exit(1);
  }
}

main();
