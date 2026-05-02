import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Milk, 
  Egg, 
  Sprout, 
  Plus, 
  Save,
  ArrowUpRight,
  TrendingUp,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType, LivestockEntry, PoultryEntry } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

import { isSameDay } from 'date-fns';

export default function ProductionTab() {
  const { profile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'crop' | 'livestock' | 'poultry'>('livestock');
  const [isLogging, setIsLogging] = useState(false);

  // Form states
  const [cowId, setCowId] = useState('');
  const [milkVolume, setMilkVolume] = useState('');
  const [feedLivestock, setFeedLivestock] = useState('');
  const [eggsCollected, setEggsCollected] = useState('');
  const [feedPoultry, setFeedPoultry] = useState('');

  const [recentLivestock, setRecentLivestock] = useState<LivestockEntry[]>([]);
  const [recentPoultry, setRecentPoultry] = useState<PoultryEntry[]>([]);

  // Daily totals
  const dailyMilkProduced = recentLivestock
    .filter(l => isSameDay(new Date(l.date), new Date()))
    .reduce((sum, l) => sum + l.milkVolume, 0);
  
  const dailyEggsCollected = recentPoultry
    .filter(p => isSameDay(new Date(p.date), new Date()))
    .reduce((sum, p) => sum + p.eggCount, 0);

  React.useEffect(() => {
    const qLivestock = query(collection(db, 'production_livestock'), orderBy('date', 'desc'), limit(5));
    const qPoultry = query(collection(db, 'production_poultry'), orderBy('date', 'desc'), limit(5));

    const unsubL = onSnapshot(qLivestock, (snapshot) => {
      setRecentLivestock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivestockEntry)));
    });

    const unsubP = onSnapshot(qPoultry, (snapshot) => {
      setRecentPoultry(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PoultryEntry)));
    });

    return () => { unsubL(); unsubP(); };
  }, []);

  const handleLogLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'production_livestock'), {
        date: new Date().toISOString(),
        cowId,
        milkVolume: parseFloat(milkVolume),
        feedConsumed: parseFloat(feedLivestock),
        recordedBy: profile.displayName,
        createdAt: serverTimestamp()
      });
      setCowId('');
      setMilkVolume('');
      setFeedLivestock('');
      setIsLogging(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'production_livestock');
    }
  };

  const handleLogPoultry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'production_poultry'), {
        date: new Date().toISOString(),
        eggCount: parseInt(eggsCollected),
        feedConsumed: parseFloat(feedPoultry),
        recordedBy: profile.displayName,
        createdAt: serverTimestamp()
      });
      setEggsCollected('');
      setFeedPoultry('');
      setIsLogging(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'production_poultry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 gap-8">
        {[
          { id: 'crop', label: 'Crop Cultivation', icon: Sprout },
          { id: 'livestock', label: 'Livestock Unit', icon: Milk },
          { id: 'poultry', label: 'Poultry Unit', icon: Egg },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-all relative ${
              activeSubTab === tab.id ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeSubTab === tab.id && (
              <motion.div layoutId="subtabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeSubTab === 'livestock' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-serif italic">Livestock Summary</h3>
                <button 
                  onClick={() => setIsLogging(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <Plus size={16} /> Log Milk
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Milk size={20} /></div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">Daily Avg</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tracking-tighter">142.5 L</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-sans">
                    <TrendingUp size={12} className="text-green-500" /> +5% from yesterday
                  </p>
                </div>
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><TrendingUp size={20} /></div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">Feed Efficiency</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tracking-tighter">0.82</p>
                  <p className="text-xs text-gray-500 mt-1 font-sans">Output L / Input Kg</p>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <History size={18} className="text-gray-400" />
                  <h4 className="font-bold">Recent In-take</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-50 uppercase text-[10px] tracking-widest text-gray-400">
                      <tr>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Cow ID</th>
                        <th className="pb-3 font-medium text-right">Milk (L)</th>
                        <th className="pb-3 font-medium text-right">Feed (Kg)</th>
                        <th className="pb-3 font-medium">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-sans divide-y divide-gray-50">
                      {recentLivestock.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="py-3 text-gray-600">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-3 font-mono font-bold text-gray-900">{entry.cowId}</td>
                          <td className="py-3 text-right font-mono font-medium text-green-600">{entry.milkVolume}</td>
                          <td className="py-3 text-right font-mono text-gray-600">{entry.feedConsumed}</td>
                          <td className="py-3 text-gray-500 text-xs">{entry.recordedBy}</td>
                        </tr>
                      ))}
                      {recentLivestock.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 italic">No production logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'poultry' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-serif italic">Poultry Oversight</h3>
                <button 
                  onClick={() => setIsLogging(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                >
                  <Plus size={16} /> Log Collection
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Egg size={20} /></div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">Total Eggs</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tracking-tighter">2,480</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-sans">
                    <TrendingUp size={12} className="text-green-500" /> +12% this week
                  </p>
                </div>
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">Total Feed</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tracking-tighter">350 Kg</p>
                  <p className="text-xs text-gray-500 mt-1 font-sans">Weekly consumption</p>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <History size={18} className="text-gray-400" />
                  <h4 className="font-bold">Recent Collections</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-50 uppercase text-[10px] tracking-widest text-gray-400">
                      <tr>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium text-right">Eggs Collected</th>
                        <th className="pb-3 font-medium text-right">Feed (Kg)</th>
                        <th className="pb-3 font-medium">By</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-sans divide-y divide-gray-50">
                      {recentPoultry.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 text-gray-600">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-3 text-right font-mono font-medium text-yellow-600">{entry.eggCount}</td>
                          <td className="py-3 text-right font-mono text-gray-600">{entry.feedConsumed}</td>
                          <td className="py-3 text-gray-500 text-xs uppercase tracking-tighter">{entry.recordedBy}</td>
                        </tr>
                      ))}
                      {recentPoultry.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 italic">No collection logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'crop' && (
            <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
              <Sprout size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Crop Cultivation Tracking</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Manage your seasonal cycles, soil health, and harvest predictions. Module coming soon.</p>
            </div>
          )}
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="p-6 bg-gray-900 text-white rounded-3xl overflow-hidden relative shadow-2xl shadow-gray-200">
             <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-4">Daily Yield Summary</h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Milk</p>
                         <p className="text-2xl font-black font-mono text-white">{dailyMilkProduced.toLocaleString()} L</p>
                      </div>
                      <Milk size={20} className="text-green-500 mb-1" />
                   </div>
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Eggs</p>
                         <p className="text-2xl font-black font-mono text-white">{dailyEggsCollected.toLocaleString()} Units</p>
                      </div>
                      <Egg size={20} className="text-yellow-500 mb-1" />
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                   <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-relaxed">
                      Real-time production monitoring for Shachaal Units.
                   </p>
                </div>
             </div>
             <div className="absolute -right-8 -top-8 opacity-5">
                <TrendingUp size={160} />
             </div>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      <AnimatePresence>
        {isLogging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold">New {activeSubTab === 'livestock' ? 'Milk Log' : 'Egg collection'}</h3>
                <button onClick={() => setIsLogging(false)} className="text-gray-400 hover:text-gray-600 group">
                  <div className="p-1 rounded bg-gray-100 group-hover:bg-gray-200">
                    <Plus size={20} className="rotate-45" />
                  </div>
                </button>
              </div>
              
              <form onSubmit={activeSubTab === 'livestock' ? handleLogLivestock : handleLogPoultry} className="p-6 space-y-4">
                {activeSubTab === 'livestock' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 focus-within:text-green-600 transition-colors">Cow ID</label>
                      <input 
                        type="text" 
                        required
                        value={cowId}
                        onChange={(e) => setCowId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono" 
                        placeholder="e.g. COW-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 focus-within:text-green-600 transition-colors">Milk Volume (Liters)</label>
                      <input 
                        type="number" 
                        required
                        step="0.1"
                        value={milkVolume}
                        onChange={(e) => setMilkVolume(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono" 
                        placeholder="e.g. 15.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 focus-within:text-green-600 transition-colors">Feed Consumed (Kg)</label>
                      <input 
                        type="number" 
                        required
                        step="0.1"
                        value={feedLivestock}
                        onChange={(e) => setFeedLivestock(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono" 
                        placeholder="e.g. 5.0"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 focus-within:text-yellow-600 transition-colors">Total Egg Count</label>
                      <input 
                        type="number" 
                        required
                        value={eggsCollected}
                        onChange={(e) => setEggsCollected(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none font-mono" 
                        placeholder="e.g. 450"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 focus-within:text-yellow-600 transition-colors">Feed Consumed (Kg)</label>
                      <input 
                        type="number" 
                        required
                        step="0.1"
                        value={feedPoultry}
                        onChange={(e) => setFeedPoultry(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none font-mono" 
                        placeholder="e.g. 12.0"
                      />
                    </div>
                  </>
                )}
                
                <button 
                  type="submit"
                  className={`w-full py-3 ${activeSubTab === 'livestock' ? 'bg-green-600 border-green-700' : 'bg-yellow-600 border-yellow-700'} text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mt-4 hover:brightness-110 active:scale-[0.98] transition-all`}
                >
                  <Save size={18} /> SAVE RECORD
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
