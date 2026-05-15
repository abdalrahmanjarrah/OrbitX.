import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  useEffect(() => {
    // Auto-toggle focus mode based on timer status so we hide non-essentials
    if (room?.timerStatus === "focus") {
      setIsFocusMode(true);
    } else {
      setIsFocusMode(false);
    }
  }, [room?.timerStatus]);`,
  `  // Removed auto-toggle focus mode requested by user`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Removed auto-focus mode");
