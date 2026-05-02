import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Tractor, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Wrench,
  Clock,
  Activity,
  Plus,
  History,
  Save,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Equipment, ServiceRecord, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

export default function EquipmentTab() {
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [isLoggingService, setIsLoggingService] = useState<Equipment | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Equipment | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);

  // Equipment Form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Tractor');
  const [newStatus, setNewStatus] = useState<Equipment['status']>('operational');

  // Service Form
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [performedBy, setPerformedBy] = useState(profile?.displayName || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'equipment'));
    const unsub = onSnapshot(q, (snapshot) => {
      setEquipment(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (viewingHistory) {
      const q = query(
        collection(db, 'equipment', viewingHistory.id, 'service_history'),
        orderBy('serviceDate', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setServiceHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord)));
      });
      return () => unsub();
    } else {
      setServiceHistory([]);
    }
  }, [viewingHistory]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'equipment'), {
        name: newName,
        type: newType,
        status: newStatus,
        health: 100,
        createdAt: serverTimestamp()
      });
      setIsAddingEquipment(false);
      setNewName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'equipment');
    }
  };

  const handleLogService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggingService || !profile) return;
    try {
      const serviceData = {
        equipmentId: isLoggingService.id,
        serviceDate,
        performedBy,
        notes,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'equipment', isLoggingService.id, 'service_history'), serviceData);
      
      // Update equipment status and last service date
      await updateDoc(doc(db, 'equipment', isLoggingService.id), {
        lastService: serviceDate,
        status: 'operational',
        health: 100 // Reset health indicator after service for demo
      });

      setIsLoggingService(null);
      setNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `equipment/${isLoggingService.id}/service_history`);
    }
  };

  return (
    <div className="space-y-6 text-gray-900 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight italic font-serif">Farm Equipment</h2>
          <p className="text-sm text-gray-500">Monitor health and service cycles for Shachaal Farm assets.</p>
        </div>
        {profile?.role === 'manager' && (
          <button 
            onClick={() => setIsAddingEquipment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} /> Add Equipment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-1.5 h-full ${
              item.status === 'operational' ? 'bg-green-500' : 
              item.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />

            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-600 group-hover:scale-110 transition-transform">
                <Tractor size={24} />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-500">
                {item.status === 'operational' && <CheckCircle size={10} className="text-green-500" />}
                {item.status === 'maintenance' && <Wrench size={10} className="text-yellow-500" />}
                {item.status === 'broken' && <AlertCircle size={10} className="text-red-500" />}
                {item.status}
              </div>
            </div>

            <h3 className="font-bold text-lg mb-1 leading-tight">{item.name}</h3>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-6">{item.type}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  <span>Component Health</span>
                  <span className={(item.health || 0) > 80 ? 'text-green-500' : (item.health || 0) > 50 ? 'text-yellow-500' : 'text-red-500'}>
                    {item.health || 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.health || 0}%` }}
                    className={`h-full ${
                      (item.health || 0) > 80 ? 'bg-green-500' : (item.health || 0) > 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={14} className="text-gray-300" />
                  <span className="font-mono">{item.lastService || 'No records'}</span>
                </div>
                <button 
                  onClick={() => setViewingHistory(item)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 font-bold uppercase tracking-widest hover:underline"
                >
                  <History size={14} /> History
                </button>
              </div>

              {profile?.role === 'manager' && (
                <button 
                  onClick={() => setIsLoggingService(item)}
                  className="w-full py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench size={14} /> Log Service
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {equipment.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-3xl">
            No equipment found in database.
          </div>
        )}
      </div>

      {/* Add Equipment Modal */}
      <AnimatePresence>
        {isAddingEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold">New Equipment</h3>
                <button onClick={() => setIsAddingEquipment(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Equipment Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" 
                    placeholder="e.g. John Deere 5050E"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Type</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option>Tractor</option>
                    <option>Stationary</option>
                    <option>Environmental</option>
                    <option>Utility</option>
                    <option>Vehicle</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-gray-800 transition-all"
                >
                  <Save size={18} /> ADD ASSET
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Service Modal */}
      <AnimatePresence>
        {isLoggingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold">Log Service History</h3>
                  <p className="text-xs text-gray-500">{isLoggingService.name}</p>
                </div>
                <button onClick={() => setIsLoggingService(null)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleLogService} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Service Date</label>
                    <input 
                      type="date" 
                      required 
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Performed By</label>
                    <input 
                      type="text" 
                      required 
                      value={performedBy}
                      onChange={(e) => setPerformedBy(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Service Notes</label>
                  <textarea 
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                    placeholder="Describe maintenance performed, parts replaced, etc."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 hover:brightness-110 shadow-xl shadow-blue-100 transition-all"
                >
                  <Save size={18} /> SAVE SERVICE LOG
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {viewingHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl h-[70vh] flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div>
                  <h3 className="text-xl font-bold italic font-serif">Service History</h3>
                  <p className="text-sm text-gray-500">{viewingHistory.name}</p>
                </div>
                <button onClick={() => setViewingHistory(null)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {serviceHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                    <History size={48} className="mb-4 opacity-20" />
                    No service records found for this asset.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-gray-100 pl-8 space-y-12">
                    {serviceHistory.map((record, idx) => (
                      <div key={record.id} className="relative">
                        <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full border-4 border-white bg-blue-600 shadow-sm shadow-blue-200"></div>
                        <div className="flex justify-between items-start mb-2">
                           <div>
                             <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{record.serviceDate}</span>
                             <h4 className="font-bold text-gray-900">Maintenance Performed</h4>
                           </div>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-lg flex items-center gap-1">
                             <Activity size={10} /> {record.performedBy}
                           </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl italic">
                          "{record.notes || 'No detailed notes provided.'}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-end shrink-0">
                 <button 
                   onClick={() => setViewingHistory(null)}
                   className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gray-200"
                 >
                   CLOSE
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
