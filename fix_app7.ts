import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add isAdmin to StationCard props
content = content.replace(
  `  room: Room;
  activeUsers?: UserData[];
  onEnter: () => void;
  key?: string;
}) {`,
  `  room: Room;
  activeUsers?: UserData[];
  onEnter: () => void;
  key?: string;
  isAdmin?: boolean;
}) {`
);

// 2. Pass isAdmin from HomeView
content = content.replace(
  `                <StationCard
                  key={room.id}
                  room={room}
                  activeUsers={activeUsers}
                  onEnter={() => onEnterStation(room.id)}
                />`,
  `                <StationCard
                  key={room.id}
                  room={room}
                  activeUsers={activeUsers}
                  onEnter={() => onEnterStation(room.id)}
                  isAdmin={user.role === 'admin'}
                />`
);

// 3. Add delete button in StationCard
content = content.replace(
  `      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      <div className="flex items-center justify-between w-full relative z-10">`,
  `      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {isAdmin && (
         <button
            onClick={async (e) => {
               e.stopPropagation();
               if(window.confirm('هل أنت متأكد من حذف هذه المحطة؟')) {
                  await deleteDoc(doc(db, "rooms", room.id)).catch(() => {});
               }
            }}
            className="absolute top-4 left-4 z-50 p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-colors"
         >
            <Trash2 size={14} />
         </button>
      )}

      <div className="flex items-center justify-between w-full relative z-10">`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Delete station button added to StationCard");
