export const Debugger = {
  logInterval: (name: string, id: NodeJS.Timeout | number) => {
    console.log(`[DEBUG] Interval Started: ${name} (ID: ${id})`);
  },
  logClearInterval: (name: string, id: NodeJS.Timeout | number | null) => {
    console.log(`[DEBUG] Interval Cleared: ${name} (ID: ${id})`);
  },
  logXP: (amount: number, reason: string) => {
    console.log(`[DEBUG] XP Gained: +${amount} (${reason})`);
  },
  logWrite: (collection: string, docId: string, action: string) => {
    console.log(`[DEBUG] Write to ${collection}/${docId}: ${action}`);
  },
  logCleanupError: (message: string) => {
    console.warn(`[DEBUG] Cleanup Failure: ${message}`);
  },
  logSuspicious: (message: string) => {
    console.warn(`[DEBUG] Suspicious Activity: ${message}`);
  }
};
