const fs = require('fs');

const code = `
import React, { useState, useEffect } from "react";
import {
  Shield, Users, Activity, Terminal as TerminalIcon, AlertTriangle, ShieldAlert,
  Zap, Database, Cpu, Globe2, Radio, Server, Trash2, CheckCircle, Settings,
  MessageSquare, MessageCircle, ImageIcon, Plus, X, Lock, Unlock, Eye, BarChart3,
  Search, Crosshair
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, updateDoc, deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import { UserData, Discussion } from "../shared";

export default function AdminView({ user }: { user: UserData }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isChatEnabled, setIsChatEnabled] = useState(true);

  // Anomaly Data Simulation
  const systemData = [
    { time: '00:00', load: 30, anomalies: 0 },
    { time: '04:00', load: 45, anomalies: 1 },
    { time: '08:00', load: 80, anomalies: 5 },
    { time: '12:00', load: 60, anomalies: 2 },
    { time: '16:00', load: 90, anomalies: 8 },
    { time: '20:00', load: 50, anomalies: 0 },
  ];

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "profiles"), (snap) => setUsers(snap.docs.map(doc => doc.data() as UserData)));
    const unsubSuggestions = onSnapshot(collection(db, "suggestions"), (snap) => setSuggestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubExhibitions = onSnapshot(collection(db, "exhibitions"), (snap) => setExhibitions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDiscussions = onSnapshot(collection(db, "discussions"), (snap) => setDiscussions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Discussion)));
    const unsubSettings = onSnapshot(doc(db, "system", "settings"), (docSnap) => { if (docSnap.exists()) setIsChatEnabled(docSnap.data().isChatEnabled !== false); });

    return () => { unsubUsers(); unsubSuggestions(); unsubExhibitions(); unsubDiscussions(); unsubSettings(); };
  }, []);

  const toggleChat = async () => {
    try {
      await updateDoc(doc(db, "system", "settings"), { isChatEnabled: !isChatEnabled }).catch(async () => {
         await setDoc(doc(db, "system", "settings"), { isChatEnabled: !isChatEnabled });
      });
    } catch(e) {}
  };

  const activeUsers = users.filter((u) => Date.now() - (u.lastActiveTime || 0) < 300000).length;
  const totalUsers = users.length;
  const sysHealth = activeUsers > 50 ? 85 : 98;

  const handleBanUser = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", uid), { banned: !currentStatus });
      await updateDoc(doc(db, "profiles", uid), { banned: !currentStatus });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, \`users/\${uid}\`);
    }
  };

  const handleDeleteDoc = async (col: string, id: string) => {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, \`\${col}/\${id}\`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020308] text-cyan-50 font-mono p-4 md:p-8 space-y-8 relative overflow-hidden">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,#020308_100%)] z-0" />
      
      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-center border-b border-cyan-500/30 pb-6 mb-8 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Shield className="w-12 h-12 text-cyan-400" />
            <div className="absolute inset-0 animate-ping opacity-50"><Shield className="w-12 h-12 text-cyan-400" /></div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
              ORBITX OVERSEER
            </h1>
            <p className="text-cyan-500/80 text-sm tracking-widest uppercase">Global Command & Control Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="flex flex-col items-end">
            <span className="text-xs text-cyan-600 uppercase">System Time</span>
            <span className="text-xl font-bold font-mono text-cyan-300">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-cyan-600 uppercase">Admin Clearance</span>
            <span className="text-xl font-bold font-mono text-fuchsia-500">LEVEL OMEGA</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Core System Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#050B14] border border-cyan-500/30 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.1)_inset]">
            <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><Server size={18}/> Core Telemetry</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                <span className="text-cyan-600 uppercase text-xs">System Health</span>
                <span className="text-green-400 font-bold">{sysHealth}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                <span className="text-cyan-600 uppercase text-xs">Active Sessions</span>
                <span className="text-cyan-400 font-bold">{activeUsers}</span>
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                <span className="text-cyan-600 uppercase text-xs">Total Users</span>
                <span className="text-blue-400 font-bold">{totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-cyan-600 uppercase text-xs">Global Chat</span>
                <button onClick={toggleChat} className={cn("px-3 py-1 rounded text-xs font-bold uppercase transition-all shadow-[0_0_10px_currentColor]", isChatEnabled ? "bg-green-500/20 text-green-400 border border-green-500" : "bg-red-500/20 text-red-400 border border-red-500")}>
                  {isChatEnabled ? 'Online' : 'Offline'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#050B14] border border-fuchsia-500/30 p-6 rounded-xl shadow-[0_0_30px_rgba(255,0,255,0.05)_inset]">
             <h3 className="text-fuchsia-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={18}/> Server Anomaly Sensor</h3>
             <div className="h-40">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={systemData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#00FFFF" opacity={0.1} />
                   <XAxis dataKey="time" stroke="#00FFFF" opacity={0.5} fontSize={10} />
                   <YAxis stroke="#00FFFF" opacity={0.5} fontSize={10} />
                   <Tooltip contentStyle={{ backgroundColor: '#050B14', borderColor: '#00FFFF', color: '#00FFFF' }} />
                   <Line type="monotone" dataKey="anomalies" stroke="#FF00FF" strokeWidth={2} dot={{ r: 2, fill: '#FF00FF' }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Global User Monitoring */}
        <div className="lg:col-span-3 bg-[#050B14] border border-cyan-500/30 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.1)_inset] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2"><Crosshair size={18}/> Active Personnel Tracking</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
              <input type="text" placeholder="Trace ID or Handle..." className="bg-[#020308] border border-cyan-500/50 rounded text-cyan-300 px-10 py-1 text-sm focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {users.map(u => (
              <div key={u.uid} className="bg-[#020308] border border-cyan-900 hover:border-cyan-500 transition-colors rounded p-3 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={u.photoURL} alt="Avatar" className="w-10 h-10 rounded border border-cyan-700 object-cover" />
                    {Date.now() - (u.lastActiveTime || 0) < 300000 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_lime]"></div>}
                  </div>
                  <div>
                    <div className="font-bold text-cyan-100 flex items-center gap-2">
                      {u.displayName}
                      <span className="text-[9px] px-1.5 py-0.5 border border-cyan-800 rounded bg-cyan-950 text-cyan-400">LVL {u.level}</span>
                    </div>
                    <div className="text-xs text-cyan-600 font-mono mt-1">STATUS: <span className="text-cyan-400">{u.currentActivity || 'IDLE'}</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingUser(u)} className="p-2 border border-blue-900 text-blue-500 hover:border-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-all" title="Modify Clearance">
                    <Settings size={16} />
                  </button>
                  <button onClick={() => handleBanUser(u.uid, !!u.banned)} className={cn("p-2 border rounded transition-all", u.banned ? "border-green-900 text-green-500 hover:bg-green-900/30" : "border-red-900 text-red-500 hover:bg-red-900/30 hover:border-red-500")} title={u.banned ? "Restore Access" : "Revoke Access"}>
                     {u.banned ? <Unlock size={16}/> : <Lock size={16}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signals Intercept */}
        <div className="bg-[#050B14] border border-cyan-500/30 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.1)_inset] lg:col-span-2">
           <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Radio size={18}/> Signals Intercept (Reports & Ideas)</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 <h4 className="text-[10px] text-cyan-600 uppercase border-b border-cyan-900 pb-1 mb-2">Suggestions Stream</h4>
                 {suggestions.map(s => (
                   <div key={s.id} className="bg-[#020308] border-l-2 border-l-yellow-500 p-2 text-xs flex justify-between group">
                     <span className="text-cyan-300 truncate pr-4">{s.text}</span>
                     <button onClick={() => handleDeleteDoc('suggestions', s.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                   </div>
                 ))}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 <h4 className="text-[10px] text-cyan-600 uppercase border-b border-cyan-900 pb-1 mb-2">Hivemind Nexus (Discussions)</h4>
                 {discussions.map(d => (
                   <div key={d.id} className="bg-[#020308] border-l-2 border-l-blue-500 p-2 text-xs flex justify-between group">
                     <span className="text-cyan-300 truncate pr-4">{d.title}</span>
                     <button onClick={() => handleDeleteDoc('discussions', d.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Neural Network Surveillance */}
        <div className="bg-[#050B14] border border-cyan-500/30 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.1)_inset]">
           <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Eye size={18}/> Media Surveillance</h3>
           <div className="grid grid-cols-3 gap-2 h-60 overflow-y-auto custom-scrollbar pr-1">
             {exhibitions.map(ex => (
               <div key={ex.id} className="relative group aspect-square border border-cyan-900 overflow-hidden">
                 <img src={ex.url} alt="Media" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                 <div className="absolute inset-0 bg-transparent border-2 border-transparent group-hover:border-cyan-400 pointer-events-none transition-all"></div>
                 <button onClick={() => handleDeleteDoc('exhibitions', ex.id)} className="absolute top-1 right-1 bg-red-900/80 text-white p-1 rounded opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity:0, scale: 0.9 }} animate={{ opacity:1, scale: 1 }} exit={{ opacity:0, scale: 0.9 }} className="bg-[#050B14] border border-cyan-400 p-6 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.2)] w-full max-w-md space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-900 pb-2 mb-4">
                <h3 className="text-cyan-300 font-bold uppercase tracking-widest">Override Parameter: {editingUser.displayName}</h3>
                <button onClick={() => setEditingUser(null)} className="text-cyan-600 hover:text-cyan-300"><X size={20}/></button>
              </div>
              
              <div className="space-y-3 font-mono text-sm">
                 <div>
                    <label className="text-cyan-600 text-xs uppercase block mb-1">XP Value</label>
                    <input type="number" value={editingUser.xp} onChange={e => setEditingUser({...editingUser, xp: parseInt(e.target.value)||0})} className="w-full bg-[#020308] border border-cyan-900 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400" />
                 </div>
                 <div>
                    <label className="text-cyan-600 text-xs uppercase block mb-1">Clearance Level (LVL)</label>
                    <input type="number" value={editingUser.level} onChange={e => setEditingUser({...editingUser, level: parseInt(e.target.value)||1})} className="w-full bg-[#020308] border border-cyan-900 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400" />
                 </div>
                 <div>
                    <label className="text-cyan-600 text-xs uppercase block mb-1">Status Override (Activity)</label>
                    <input type="text" value={editingUser.currentActivity||''} onChange={e => setEditingUser({...editingUser, currentActivity: e.target.value})} className="w-full bg-[#020308] border border-cyan-900 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400" />
                 </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button onClick={async () => {
                   await updateDoc(doc(db, "users", editingUser.uid), { xp: editingUser.xp, level: editingUser.level, currentActivity: editingUser.currentActivity });
                   await updateDoc(doc(db, "profiles", editingUser.uid), { xp: editingUser.xp, level: editingUser.level });
                   setEditingUser(null);
                }} className="flex-1 bg-cyan-600/20 border border-cyan-500 text-cyan-400 py-2 uppercase font-bold hover:bg-cyan-500 hover:text-[#020308] transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                  Execute Protocol
                </button>
                <button onClick={() => setEditingUser(null)} className="px-4 border border-cyan-900 text-cyan-600 hover:border-cyan-500 hover:text-cyan-400 uppercase text-xs transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
`;

fs.writeFileSync('src/views/AdminView.tsx', code);
`;

fs.writeFileSync('replace_admin.cjs', code);
