import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Search, 
  Filter, 
  ArrowUpRight, 
  MoreVertical,
  CheckCircle2,
  Clock,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, OperationType, FarmSettings } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

export default function SalesTab() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<FarmSettings | null>(null);

  // Form
  const [productType, setProductType] = useState('Milk');
  const [customer, setCustomer] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'outstanding'>('paid');

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as FarmSettings);
      }
    });

    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  // Price Calculation logic
  useEffect(() => {
    if (!settings || !quantity) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty)) return;

    if (productType === 'Milk') {
      setTotalPrice((qty * settings.milkPricePerLitre).toFixed(2));
    } else if (productType === 'Eggs') {
      setTotalPrice((qty * settings.eggPricePerUnit).toFixed(2));
    }
  }, [productType, quantity, settings]);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
  const outstanding = sales.filter(s => s.paymentStatus === 'outstanding').reduce((acc, s) => acc + s.totalPrice, 0);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'sales'), {
        date: new Date().toISOString(),
        productType,
        customer,
        quantity: parseFloat(quantity),
        totalPrice: parseFloat(totalPrice),
        paymentStatus,
        managerUid: profile.uid,
        createdAt: serverTimestamp()
      });
      setIsAddingSale(false);
      setCustomer('');
      setQuantity('');
      setTotalPrice('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sales');
    }
  };

  const handleMarkAsPaid = async (saleId: string) => {
    try {
      await updateDoc(doc(db, 'sales', saleId), {
        paymentStatus: 'paid'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sales/${saleId}`);
    }
  };

  const filteredSales = sales.filter(s => 
    s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
             <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-2xl font-bold font-mono tracking-tighter">KSh {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
             <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outstanding</p>
            <p className="text-2xl font-bold font-mono tracking-tighter text-red-600">KSh {outstanding.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
             <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed Deals</p>
            <p className="text-2xl font-bold font-mono tracking-tighter">{sales.filter(s => s.paymentStatus === 'paid').length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
          </button>
          {profile?.role === 'manager' && (
            <button 
              onClick={() => setIsAddingSale(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Plus size={18} /> New Transaction
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 uppercase text-[10px] tracking-widest text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium text-right">Total Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sale.customer}</div>
                    <div className="text-xs text-gray-400 font-mono">{new Date(sale.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                      {sale.productType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-600">{sale.quantity}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-bold text-gray-900">KSh {sale.totalPrice}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      sale.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {sale.paymentStatus === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {sale.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {sale.paymentStatus === 'outstanding' && (profile?.role === 'manager' || profile?.role === 'executive') ? (
                      <button 
                        onClick={() => handleMarkAsPaid(sale.id)}
                        className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:brightness-110 transition-all"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      <AnimatePresence>
        {isAddingSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold italic font-serif">Record Sale</h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">Enter details for the new transaction.</p>
                </div>
                <button onClick={() => setIsAddingSale(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleAddSale} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 focus-within:text-blue-600 transition-colors">Product Type</label>
                    <select 
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none border focus:ring-2 focus:ring-blue-500 font-sans text-sm"
                    >
                      <option>Milk</option>
                      <option>Eggs</option>
                      <option>Crops</option>
                      <option>Livestock</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Customer Name</label>
                    <input 
                      type="text" 
                      required
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-sans text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g. Local Dairy Co."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Quantity</label>
                    <input 
                      type="number" 
                      required
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Units"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Total Revenue (KSh)</label>
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment Status</label>
                    <div className="flex gap-4">
                      {['paid', 'outstanding'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setPaymentStatus(status as any)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                            paymentStatus === status 
                              ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-50' 
                              : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2 mt-4 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <ArrowUpRight size={20} /> SUBMIT TRANSACTION
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
