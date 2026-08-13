const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app/admin');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Reemplazar text-gray-900 dark:text-white con text-white
  // Solo cuando el botón o elemento tiene un background oscuro (ej: bg-blue-600, bg-green-500, bg-gradient-to-r from-blue-500)
  const regex1 = /(bg-[a-z]+-[567]00[^"']*)text-(?:gray|slate)-900 dark:text-white/g;
  const regex2 = /(from-[a-z]+-[567]00[^"']*)text-(?:gray|slate)-900 dark:text-white/g;
  
  let newContent = content.replace(regex1, '$1text-white');
  newContent = newContent.replace(regex2, '$1text-white');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log('Modificado:', file);
  }
});

console.log(`Total archivos modificados: ${changedCount}`);
