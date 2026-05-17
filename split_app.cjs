const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

// 1. Get all imports at the top
let importEndLine = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// --- Constants ---')) {
    importEndLine = i;
    break;
  }
}
const imports = lines.slice(0, importEndLine).join('\n');

// 2. Identify the boundary between Types/Constants and Components
let appStartLine = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('function App()') || lines[i].startsWith('export default function App()') || lines[i].startsWith('export function App()')) {
    appStartLine = i;
    break;
  }
}

// 3. Extract types and constants -> src/shared.tsx
const typesAndConstants = lines.slice(importEndLine, appStartLine).join('\n');

// Make shared variables exportable
let sharedCode = typesAndConstants
  .replace(/^const (\w+) =/gm, 'export const $1 =')
  .replace(/^interface (\w+)/gm, 'export interface $1')
  .replace(/^function (\w+)/gm, 'export function $1');

fs.writeFileSync('src/shared.tsx', imports + '\n' + sharedCode);
console.log("Wrote src/shared.tsx");

// 4. Extract the components
let componentsExtracted = [];

function findEndBrace(start) {
  let openBraces = 0;
  let started = false;
  for (let i = start; i < lines.length; i++) {
    openBraces += (lines[i].match(/\{/g) || []).length;
    openBraces -= (lines[i].match(/\}/g) || []).length;
    if (lines[i].includes('{')) started = true;
    if (started && openBraces <= 0) return i;
  }
  return lines.length - 1;
}

const componentRegex = /^(?:export )?(?:default )?function ([A-Z][a-zA-Z0-9_]*)/;

let components = [];
let i = appStartLine;
while (i < lines.length) {
  const match = lines[i].match(componentRegex);
  if (match) {
    const name = match[1];
    const start = i;
    const end = findEndBrace(i);
    components.push({ name, start, end });
    i = end + 1;
  } else {
    i++;
  }
}

if (!fs.existsSync('src/views')) fs.mkdirSync('src/views');

let appImports = [];
let appRemainder = [];

for (const comp of components) {
  let compCode = lines.slice(comp.start, comp.end + 1).join('\n');
  compCode = compCode.replace(/^(?:export )?function /, 'export default function ');

  if (comp.name === 'App' || comp.name === 'WrappedApp' || comp.name === 'ErrorBoundary') {
    appRemainder.push(compCode);
  } else {
    // Generate full file code
    // Extract exported names from shared.tsx
    const sharedExports = ['SURAHS', 'getAstronautRank', 'BADGES', 'MeteorEffect', 'RECITERS', 'UserData', 'Fleet', 'Discussion', 'Reply', 'ScheduleItem', 'Room', 'Challenge', 'AwarenessSignal', 'Message'];
    
    // Some components might rely on other components, we'll import them all to be safe!
    const otherComps = components.filter(c => c.name !== comp.name && c.name !== 'App' && c.name !== 'WrappedApp' && c.name !== 'ErrorBoundary');
    const compImports = otherComps.map(c => `import ${c.name} from './${c.name}';`).join('\n');
    
    const header = imports + `\nimport { ${sharedExports.join(', ')} } from '../shared';\n` + compImports + `\n\n`;
    
    fs.writeFileSync(`src/views/${comp.name}.tsx`, header + compCode + '\n');
    appImports.push(`import ${comp.name} from './views/${comp.name}';`);
    console.log(`Extracted ${comp.name}`);
  }
}

// 5. Rewrite App.tsx
const appTsxNew = imports + `\nimport { ${['SURAHS', 'getAstronautRank', 'BADGES', 'MeteorEffect', 'RECITERS', 'UserData', 'Fleet', 'Discussion', 'Reply', 'ScheduleItem', 'Room', 'Challenge', 'AwarenessSignal', 'Message'].join(', ')} } from './shared';\n` + appImports.join('\n') + '\n\n' + appRemainder.join('\n\n');

fs.writeFileSync('src/App.tsx', appTsxNew);
console.log("Rewrote src/App.tsx");
