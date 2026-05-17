const fs = require('fs');

const originalCode = fs.readFileSync('src/App.tsx', 'utf8');

const newHomeView = `function HomeView({
  user,
  onEnterStation,
  onSelectUser,
}: {
  user: UserData;
  onEnterStation: (id: string) => void;
  onSelectUser: (id: string) => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [advice, setAdvice] = useState<string>("");
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTask, setNewRoomTask] = useState("");
  const [newRoomImageUrl, setNewRoomImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    const roomsQuery = query(
      collection(db, "rooms"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsubscribeRooms = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const fetchedRooms: Room[] = [];
        const now = Date.now();
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Room;
          if (data.participants?.length === 0 && data.emptyAt) {
            const emptyMs = data.emptyAt.toMillis
              ? data.emptyAt.toMillis()
              : data.emptyAt.seconds * 1000;
            if (now - emptyMs > 300000) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
          }
          fetchedRooms.push({ id: docSnap.id, ...data });
        });
        setRooms(fetchedRooms);
      },
      (e) => handleFirestoreError(e, OperationType.GET, "rooms"),
    );

    const adviceQuery = query(
      collection(db, "advices"),
      orderBy("timestamp", "desc"),
      limit(1),
    );
    const unsubscribeAdvice = onSnapshot(
      adviceQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setAdvice(snapshot.docs[0].data().text);
        }
      },
      (e) => handleFirestoreError(e, OperationType.GET, "advices"),
    );

    const usersQuery = query(collection(db, "profiles"), limit(10));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setActiveUsers(
        snapshot.docs
          .map((doc) => doc.data() as UserData)
          .filter((u) => u.uid !== user.uid),
      );
    });

    const challengesQuery = query(
      collection(db, "challenges"),
      where("challengedId", "==", user.uid),
      where("status", "==", "pending"),
    );
    const unsubscribeChallenges = onSnapshot(
      challengesQuery,
      (snapshot) => {
        setPendingChallenges(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Challenge,
          ),
        );
      },
      (e) => handleFirestoreError(e, OperationType.GET, "challenges"),
    );

    return () => {
      unsubscribeRooms();
      unsubscribeAdvice();
      unsubscribeUsers();
      unsubscribeChallenges();
    };
  }, [user.uid]);

  const PREDEFINED_IMAGES = [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
  ];

  const handleCreateRoom = async () => {
    if (!newRoomName) return;
    setIsCreating(true);

    try {
      const roomData = {
        name: newRoomName,
        task: "محطة مشتركة",
        imageUrl: newRoomImageUrl || null,
        creatorId: user.uid,
        creatorName: user.displayName,
        participants: [user.uid],
        maxParticipants: 5,
        timerStatus: "idle",
        timerDuration: 25,
        breakDuration: 5,
        createdAt: serverTimestamp(),
      };

      const roomRef = await addDoc(collection(db, "rooms"), roomData);
      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomTask("");
      setNewRoomImageUrl("");
      onEnterStation(roomRef.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "rooms");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full relative min-h-screen pb-32">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
      
      <motion.div
        variants={bentoContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-10 max-w-7xl mx-auto w-full z-10 relative"
      >
        {/* Welcome Section / Deep Focus Overview */}
        <motion.div variants={bentoItem} className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-l from-white via-indigo-100 to-indigo-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              أهلاً {user.displayName}... جاهز للتركيز؟
            </h1>
            <p className="text-lg text-indigo-200/80 max-w-lg shadow-sm">
              محطتك الفضائية بانتظارك. انطلق في رحلة جديدة من الإنتاجية واخترق حدود المعرفة.
            </p>
            
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative px-6 py-3 rounded-2xl bg-[#1a1b32]/80 backdrop-blur-xl border border-indigo-500/30 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 to-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-3 text-white font-bold">
                  <Plus size={18} className="text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
                  <span>برمجة محطة جديدة</span>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 shrink-0">
             <div className="flex flex-col justify-center px-6 py-4 rounded-3xl bg-[#0b0c1b]/60 backdrop-blur-md border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Flame size={12} className="text-orange-500" /> سلسلة النشاط
                </span>
                <div className="text-3xl font-black text-white">{user.streak || 1} <span className="text-sm font-medium text-gray-500">أيام</span></div>
             </div>
             
             <div className="flex flex-col justify-center px-6 py-4 rounded-3xl bg-[#0b0c1b]/60 backdrop-blur-md border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Timer size={12} className="text-cyan-400" /> إجمالي التركيز
                </span>
                <div className="text-3xl font-black text-white">{Math.floor(((user.totalFocusSessions || 0) * 25) / 60)} <span className="text-sm font-medium text-gray-500">ساعة</span></div>
             </div>
          </div>
        </motion.div>

        {/* Primary Content: Active Stations */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black font-display text-white flex items-center gap-3">
                 <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                 </div>
                 المحطات المدارية النشطة
              </h2>
           </div>

           {rooms.length === 0 ? (
             <motion.div variants={bentoItem} className="w-full flex flex-col items-center justify-center p-12 md:p-24 rounded-3xl bg-gradient-to-br from-[#0c0d1e]/50 to-[#050510]/50 backdrop-blur-xl border border-white/5 text-center">
                 <div className="w-24 h-24 mb-6 relative">
                     <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin opacity-50" style={{ animationDuration: '3s' }} />
                     <div className="absolute inset-2 rounded-full border-r-2 border-cyan-400 animate-spin opacity-30" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
                     <Rocket size={40} className="absolute inset-0 m-auto text-indigo-400 opacity-40" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">المدار هادئ تماماً</h3>
                 <p className="text-indigo-200/50 max-w-sm">لا يوجد أحد في المدار حالياً. لتكن أنت أول من يطلق محطته ويبدأ جلسة تركيز عميقة.</p>
             </motion.div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <StationCard
                    key={room.id}
                    room={room}
                    activeUsers={activeUsers}
                    onEnter={() => onEnterStation(room.id)}
                    isAdmin={user.role === 'admin'}
                  />
                ))}
             </div>
           )}
        </div>

        {/* Secondary Content: Missions & Cosmic Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
           {/* Daily Missions */}
           <motion.div variants={bentoItem} className="flex flex-col bg-[#0b0c1b]/80 backdrop-blur-xl border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                   <Target size={18} className="text-indigo-400" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">مهام النظام</h3>
                   <p className="text-xs text-indigo-200/60 uppercase tracking-widest font-bold">Daily Objectives</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="p-4 rounded-2xl bg-[#131526]/80 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-sm font-bold text-white">التركيز المفرط</span>
                       <span className="text-[10px] font-bold px-2 py-1 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-400 rounded-lg flex items-center gap-1 border border-orange-500/20">
                          <Zap size={10} /> +50 XP
                       </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5 px-1">
                       <span>التقدم الحالي</span>
                       <span>{(user.totalFocusSessions || 0) % 3} / 3</span>
                    </div>
                    <div className="w-full h-2 bg-[#0a0b16] rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-l from-orange-400 to-indigo-500 relative transition-all duration-1000"
                         style={{ width: \`\${Math.min(((user.totalFocusSessions || 0) % 3) * 33.3, 100)}%\` }}
                       >
                         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30" />
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* Cosmic Challenges */}
           <motion.div variants={bentoItem} className="flex flex-col bg-[#0b0c1b]/80 backdrop-blur-xl border border-fuchsia-500/10 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-fuchsia-500/10 transition-colors duration-700" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                     <Swords size={18} className="text-fuchsia-400" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">تحديات الأقران</h3>
                     <p className="text-xs text-fuchsia-200/60 uppercase tracking-widest font-bold">Social Combat</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="px-4 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 rounded-xl text-xs font-bold transition-all border border-fuchsia-500/20"
                >
                  تحدي جديد +
                </button>
              </div>

              <div className="space-y-3 relative z-10">
                 {pendingChallenges.length === 0 ? (
                   <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <p className="text-xs text-gray-500">لا توجد تحديات معلقة. كن أنت المبادر!</p>
                   </div>
                 ) : (
                   pendingChallenges.map((challenge) => (
                     <div key={challenge.id} className="p-4 rounded-2xl bg-[#131526]/80 flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                              <span className="text-xs">{challenge.challengerName.charAt(0)}</span>
                           </div>
                           <span className="text-sm font-bold text-white">{challenge.challengerName}</span>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={async () => {
                               await updateDoc(doc(db, "challenges", challenge.id), { status: "accepted" });
                               const roomData = {
                                 name: \`تحدي: \${challenge.challengerName} ⚔️ \${user.displayName}\`,
                                 task: "تحدي التركيز العميق",
                                 creatorId: user.uid,
                                 creatorName: user.displayName,
                                 participants: [user.uid, challenge.challengerId],
                                 maxParticipants: 2,
                                 timerStatus: "idle", timerDuration: 25, breakDuration: 5,
                                 createdAt: serverTimestamp(),
                               };
                               const roomRef = await addDoc(collection(db, "rooms"), roomData);
                               onEnterStation(roomRef.id);
                             }}
                             className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-xs font-bold transition-colors"
                           >
                             قبول
                           </button>
                           <button
                             onClick={() => updateDoc(doc(db, "challenges", challenge.id), { status: "declined" })}
                             className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold transition-colors"
                           >
                             رفض
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </motion.div>
        </div>
      </motion.div>

      {/* Modals placed identically as before */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-[#000108]/90 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md p-8 rounded-[2rem] bg-[#0c0d1e] border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.2)] relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-gray-400">تأسيس محطة</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 px-1">اسم المحطة الخاصة بك</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="مثال: مدار التركيز العميق..."
                    className="w-full p-4 rounded-2xl bg-[#060711] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-white text-lg placeholder-gray-700"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 px-1">خلفية المحطة المدارية (اختياري)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PREDEFINED_IMAGES.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewRoomImageUrl(url)}
                        className={cn(
                          "relative rounded-2xl overflow-hidden aspect-[4/3] border-2 transition-all object-cover hover:scale-105",
                          newRoomImageUrl === url
                            ? "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] opacity-100"
                            : "border-transparent opacity-40 hover:opacity-80",
                        )}
                        style={{
                          backgroundImage: \`url(\${url})\`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {newRoomImageUrl === url && (
                          <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center backdrop-blur-[2px]">
                            <CheckCircle size={24} className="text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {newRoomImageUrl && (
                    <button
                      onClick={() => setNewRoomImageUrl("")}
                      className="text-xs font-bold text-gray-500 hover:text-red-400 transition-colors w-full text-center mt-2"
                    >
                      بدون خلفية مخصصة
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !newRoomName}
                className="w-full mt-8 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-[#131526] disabled:to-[#131526] disabled:text-gray-500 disabled:border disabled:border-white/5 transition-all font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:shadow-none text-white flex justify-center items-center gap-2 group"
              >
                {isCreating ? "جاري الإطلاق الكوني..." : (
                  <> إطلاق المحطة <Rocket size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> </> 
                )}
              </button>
            </motion.div>
          </div>
        )}
        {showChallengeModal && (
          <ChallengeModal user={user} onClose={() => setShowChallengeModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StationCard({
  room,
  activeUsers,
  onEnter,
  isAdmin,
}: {
  room: Room;
  activeUsers?: UserData[];
  onEnter: () => void;
  isAdmin?: boolean;
}) {
  const [uptime, setUptime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      let accumulatedFocusSeconds = room.accumulatedFocusSeconds || 0;
      if (room.timerStatus === "focus" && room.startTime) {
        const start = room.startTime.toMillis
          ? room.startTime.toMillis()
          : room.startTime.seconds * 1000 || Date.now();
        accumulatedFocusSeconds += Math.max(0, Math.floor((Date.now() - start) / 1000));
      }
      if (accumulatedFocusSeconds < 60) setUptime("نشط الآن");
      else if (accumulatedFocusSeconds < 3600) setUptime(\`\${Math.floor(accumulatedFocusSeconds / 60)} د\`);
      else setUptime(\`\${Math.floor(accumulatedFocusSeconds / 3600)} س\`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [room.accumulatedFocusSeconds, room.timerStatus, room.startTime]);

  const isFocusing = room.timerStatus === "focus";

  return (
    <motion.div
      variants={bentoItem}
      onClick={onEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEnter(); }}
      className={cn(
        "relative rounded-[2rem] p-6 text-right flex flex-col justify-between aspect-square md:aspect-[4/5] overflow-hidden group cursor-pointer border transition-all duration-500 hover:-translate-y-2",
        room.imageUrl ? "border-transparent" : (isFocusing ? "bg-[#0c0d1e] border-indigo-500/20" : "bg-[#0b0c1b] border-white/5")
      )}
      style={
        room.imageUrl
          ? { backgroundImage: \`linear-gradient(135deg, rgba(8, 9, 20, 0.9) 0%, rgba(15, 17, 35, 0.7) 100%), url(\${room.imageUrl})\`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}
      }
    >
      {/* Dynamic Background Elements */}
      {!room.imageUrl && isFocusing && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700" />
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/5 blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-colors duration-700" />
        </div>
      )}

      {/* Header logic */}
      <div className="relative z-10 flex items-start justify-between">
         <div className={cn("px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 text-xs font-bold border", isFocusing ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-white/5 text-gray-400 border-white/10")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isFocusing ? "bg-indigo-400 animate-pulse" : "bg-gray-500")} />
            {isFocusing ? "تدفق التركيز" : "محطة مدارية"}
         </div>
         {isAdmin && (
            <button
               onClick={async (e) => { e.stopPropagation(); if(window.confirm('حذف المحطة؟')) await deleteDoc(doc(db, "rooms", room.id)).catch(()=>{}); }}
               className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors backdrop-blur-md"
            >
               <Trash2 size={14} />
            </button>
         )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 mt-auto pb-4">
         <h4 className="text-2xl sm:text-3xl font-black font-display text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 transition-all">
            {room.name}
         </h4>
         <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <Timer size={14} className="text-cyan-400/70" /> {uptime}
         </div>
      </div>

      {/* Footer / Participants */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-center bg-[#000000]/10 -mx-6 px-6 -mb-6 h-16 backdrop-blur-[2px]">
         <div className="flex flex-row-reverse items-center -space-x-3 w-1/2 justify-end">
            {room.participants.slice(0, 4).map((p, i) => {
              const userMatch = activeUsers?.find((u) => u.uid === p);
              return (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#131526] bg-gray-800 overflow-hidden relative z-10 hover:z-20 transform transition-transform hover:scale-110"
                  title={userMatch?.displayName || "رائد"}
                >
                  <img src={userMatch?.photoURL || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${p}\`} alt="user" className="w-full h-full object-cover" />
                </div>
              );
            })}
            {room.participants.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#131526] bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-white relative z-10">
                +{room.participants.length - 4}
              </div>
            )}
         </div>
         <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-cyan-300 transition-colors">
            استكشاف <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
         </div>
      </div>
    </motion.div>
  );
}`;

const updatedCode = originalCode.replace(
  /function HomeView\(\{[\s\S]*?function ExhibitionGallery\(\) \{/m,
  newHomeView + '\nfunction ExhibitionGallery() {'
);

fs.writeFileSync('src/App.tsx', updatedCode);
