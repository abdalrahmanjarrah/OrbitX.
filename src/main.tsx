/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- DEV WARNING SYSTEM: MONKEY PATCH FIRESTORE ---
if (import.meta.env.DEV) {
  import('firebase/firestore').then((firestore) => {
    try {
      const originalUpdateDoc = firestore.updateDoc;
      (firestore as any).updateDoc = function(...args: any[]) {
        const data = args[1] || {};
        if (data.xp !== undefined || data.level !== undefined) {
          const stack = new Error().stack || '';
          if (!stack.includes('xpSystem.ts') && !stack.includes('xpSystem.js')) {
             console.warn("%c[DEV WARNING] ILLEGAL XP MUTATION DETECTED OUTSIDE xpSystem.ts!", "color: red; font-size: 16px; font-weight: bold;");
             console.warn("Direct XP mutations are forbidden. Use requestXpGrant() from xpSystem.ts.");
          }
        }
        return originalUpdateDoc.apply(this, args);
      };
      
      const originalSetDoc = firestore.setDoc;
      (firestore as any).setDoc = function(...args: any[]) {
        const data = args[1] || {};
        if (data.xp !== undefined || data.level !== undefined) {
          const stack = new Error().stack || '';
          if (!stack.includes('xpSystem')) {
             console.warn("%c[DEV WARNING] ILLEGAL XP MUTATION DETECTED DURING setDoc OUTSIDE xpSystem.ts!", "color: red; font-size: 16px; font-weight: bold;");
          }
        }
        return originalSetDoc.apply(this, args);
      };
    } catch (e) {
      // Ignored if ESM is strictly sealed
    }
  });
}
// --------------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
