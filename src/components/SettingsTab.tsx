import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  DollarSign, 
  Save, 
  Trash2, 
  Plus, 
  Wallet,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, onSnapshot, collection, addDoc, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FarmSettings, Expense, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { format } from 'date-fns';

export default function SettingsTab() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<FarmSettings>({
    milkPricePerLitre: 0,
    eggPricePerUnit: 0,
    waterPricePerUnit: 0,
    updatedAt: new Date().toISOString()
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);

  // Expense Form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('other');
  const [expenseDesc, setExpenseDesc] = useState('');

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as FarmSettings);
      }
    });

    const qExpenses = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    return () => {
      unsubSettings();
      unsubExpenses();
    };
  }, []);

   const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...settings,
        availableCrops: settings.availableCrops || ['Onions', 'Tomatoes', 'Cabbage', 'Kale (Sukuma Wiki)', 'Maize'],
        updatedAt: new Date().toISOString()
      });
      alert('Settings updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  const handleAddCropType = () => {
    const crop = prompt('Enter new crop type:');
    if (crop && !settings.availableCrops?.includes(crop)) {
      setSettings({
        ...settings,
        availableCrops: [...(settings.availableCrops || []), crop]
      });
    }
  };

  const handleRemoveCropType = (crop: string) => {
    if (confirm(`Remove ${crop} from available list?`)) {
      setSettings({
        ...settings,
        availableCrops: settings.availableCrops?.filter(c => c !== crop) || []
      });
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        date: new Date().toISOString(),
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        recordedBy: profile.displayName,
        createdAt: serverTimestamp()
      });
      setIsLoggingExpense(false);
      setExpenseAmount('');
      setExpenseDesc('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'expenses');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header>
         <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans italic font-serif">Farm Configuration</h1>
         <p className="text-gray-500 font-medium">Manage market prices and operational expenditures.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Market Pricing */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                 <DollarSign size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-gray-900">Market Pricing</h2>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Set current selling rates</p>
              </div>
           </div>

           <form onSubmit={handleUpdateSettings} className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100/50 space-y-6">
              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Milk Price (KSh / Litre)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">KSh</span>
                    <input 
                       type="number" 
                       value={settings.milkPricePerLitre}
                       onChange={(e) => setSettings({...settings, milkPricePerLitre: parseFloat(e.target.value) || 0})}
                       className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-lg font-bold outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Egg Price (KSh / Unit)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">KSh</span>
                    <input 
                       type="number" 
                       value={settings.eggPricePerUnit}
                       onChange={(e) => setSettings({...settings, eggPricePerUnit: parseFloat(e.target.value) || 0})}
                       className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-lg font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Water Price (KSh / Unit)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">KSh</span>
                    <input 
                       type="number" 
                       value={settings.waterPricePerUnit}
                       onChange={(e) => setSettings({...settings, waterPricePerUnit: parseFloat(e.target.value) || 0})}
                       className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                 </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                 <div className="flex justify-between items-center mb-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Available Crops</label>
                    <button 
                       type="button"
                       onClick={handleAddCropType}
                       className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                    >
                       + Add Type
                    </button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {(settings.availableCrops || ['Onions', 'Tomatoes', 'Cabbage', 'Kale (Sukuma Wiki)', 'Maize']).map((crop) => (
                       <div key={crop} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full flex items-center gap-2 group transition-all hover:bg-gray-100">
                          <span className="text-xs font-bold text-gray-600">{crop}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCropType(crop)}
                            className="text-gray-300 hover:text-rose-500 group-hover:opacity-100 opacity-0 transition-opacity"
                          >
                            <Plus size={12} className="rotate-45" />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              <button 
                 type="submit"
                 className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
              >
                 <Save size={18} /> Update Pricing
              </button>
              
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest italic">
                 Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </p>
           </form>
        </section>

        {/* Expenses & Bills */}
        <section className="space-y-6">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <Wallet size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Expenditures</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Operational costs & wages</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsLoggingExpense(true)}
                className="p-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all"
              >
                <Plus size={20} />
              </button>
           </div>

           <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100/50 overflow-hidden min-h-[400px]">
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                 {expenses.map((e) => (
                    <div key={e.id} className="p-6 group flex justify-between items-center hover:bg-gray-50 transition-colors">
                       <div className="flex gap-4 items-start">
                          <div className={`p-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                             e.category === 'wages' ? 'bg-indigo-50 text-indigo-600' :
                             e.category === 'maintenance' ? 'bg-amber-50 text-amber-600' :
                             e.category === 'feed' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                             {e.category.charAt(0)}
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-gray-900">{e.description}</h4>
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {format(new Date(e.date), 'MMM dd, yyyy')} • {e.recordedBy}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-sm text-gray-900">KSh {e.amount.toLocaleString()}</span>
                          <button 
                             onClick={() => handleDeleteExpense(e.id)}
                             className="p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
                 {expenses.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400 italic text-sm">
                       No expenditure records found.
                    </div>
                 )}
              </div>
           </div>
        </section>
      </div>

      <AnimatePresence>
        {isLoggingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="text-xl font-bold italic font-serif">Record Expense</h3>
                   <button onClick={() => setIsLoggingExpense(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <Plus size={24} className="rotate-45" />
                   </button>
                </div>
                <form onSubmit={handleLogExpense} className="p-8 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Amount (KSh)</label>
                      <input 
                         type="number" 
                         required
                         value={expenseAmount}
                         onChange={(e) => setExpenseAmount(e.target.value)}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-gray-900 flex-1"
                         placeholder="0.00"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Category</label>
                      <select 
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as any)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
                      >
                         <option value="wages">Staff Wages / Labor</option>
                         <option value="feed">Livestock/Poultry Feed</option>
                         <option value="maintenance">Maintenance & Repairs</option>
                         <option value="other">Other Operational Costs</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Description / Notes</label>
                      <textarea 
                         rows={3}
                         required
                         value={expenseDesc}
                         onChange={(e) => setExpenseDesc(e.target.value)}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                         placeholder="e.g. Monthly salary for Jane Doe"
                      />
                   </div>
                   <button 
                      type="submit"
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                   >
                      <Save size={18} /> Record Expense
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
