import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Also Admins chat stopping (I won't do it now, too complex without a global settings).
// I will increase rooms limit from 12 to 50
content = content.replace(
  `      orderBy("createdAt", "desc"),
      limit(12),`,
  `      orderBy("createdAt", "desc"),
      limit(50),`
);

// We need to fix Admin panel users query.
// Look at Admin panel loading users:
// `const usersQuery = query(collection(db, "users"), limit(50));` maybe?

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Rooms limit increased to 50");
