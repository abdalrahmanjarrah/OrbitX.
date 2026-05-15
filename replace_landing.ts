import * as fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Find the start of function LandingPage
const startIndex = lines.findIndex(line => line.startsWith('function LandingPage'));
let endIndex = -1;

if (startIndex !== -1) {
    const notifIndex = lines.findIndex(line => line.startsWith('function NotificationsDropdown'));
    if (notifIndex !== -1) {
        endIndex = notifIndex - 1;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex + 1);
    
    // add import at top
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
        }
    }
    lines.splice(lastImportIndex + 1, 0, 'import LandingPage from "./components/LandingPage";');
    
    fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
    console.log(`Replaced lines ${startIndex} to ${endIndex}`);
} else {
    console.log(`Could not find bounds: ${startIndex}, ${endIndex}`);
}
