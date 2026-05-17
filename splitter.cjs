const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

const components = [
  { name: 'NotificationsDropdown', start: 1016 },
  { name: 'Dashboard', start: 1173 },
  { name: 'NavPill', start: 1572 },
  { name: 'MobileNavPill', start: 1587 },
  { name: 'DockButton', start: 1601 },
  { name: 'ChallengeModal', start: 1668 },
  { name: 'ArticleModal', start: 1795 },
  { name: 'HomeView', start: 1904 },
  { name: 'StationCard', start: 2337 },
  { name: 'ExhibitionGallery', start: 2455 },
  { name: 'SuggestionsSection', start: 2505 },
  { name: 'QuranPlayer', start: 2679 },
  { name: 'PersonalTasks', start: 2904 },
  { name: 'StudyRoomView', start: 3075 },
  { name: 'LeaderboardView', start: 5203 },
  { name: 'ChatView', start: 5341 },
  { name: 'FocusHeatmap', start: 5610 },
  { name: 'ProfileView', start: 5678 },
  { name: 'DiscussionsView', start: 6327 },
  { name: 'ScheduleView', start: 6722 },
  { name: 'AdminView', start: 6958 },
  { name: 'BadgeCard', start: 7451 },
  { name: 'CosmicDiary', start: 7470 },
  { name: 'FarmDisplay', start: 7605 },
  { name: 'UserModal', start: 7690 },
  { name: 'NavLink', start: 8164 },
  { name: 'BlackHolesView', start: 8628 },
  { name: 'AwarenessView', start: 8818 },
  { name: 'AnalyticsView', start: 9185 },
  { name: 'FleetsView', start: 9341 }
];

// Determine end of each block by finding the end brace of the function/class.
// Usually the next component starts right after, but there can be blank lines.
// We'll just slice from start to the next start minus some blank lines, or we can actually find the closing brace by counting braces.
// Let's use brace counting to get the exact block.
function getBlock(startLine) {
  let openBraces = 0;
  let started = false;
  let endLine = startLine;
  for (let i = startLine; i < lines.length; i++) {
    const l = lines[i];
    openBraces += (l.match(/\{/g) || []).length;
    openBraces -= (l.match(/\}/g) || []).length;
    
    if (l.includes('{')) started = true;
    
    if (started && openBraces <= 0) {
      endLine = i;
      break;
    }
  }
  return { startLine, endLine };
}

// 1. Extract types to src/types.ts
// It's manually observed that types start after imports.
// Imports are up to line 125 roughly.
console.log("Analyzing file");
