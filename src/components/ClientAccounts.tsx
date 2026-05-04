import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle2, 
  Phone,
  Calendar,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale } from '../types';
import { format } from 'date-fns';

interface ClientGroup {
  name: string;
  phone?: string;
  totalTransactions: number;
  totalSpent: number;
  outstandingBalance: number;
  transactions: Sale[];
}

export default function ClientAccounts() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });
    return () => unsub();
  }, []);

  // Group sales by customer
  const clientGroups = sales.reduce((acc: { [key: string]: ClientGroup }, sale) => {
    const name = sale.customer;
    if (!acc[name]) {
      acc[name] = {
        name,
        phone: sale.customerPhone,
        totalTransactions: 0,
        totalSpent: 0,
        outstandingBalance: 0,
        transactions: []
      };
    }
    acc[name].totalTransactions += 1;
    acc[name].totalSpent += sale.totalPrice;
    if (sale.paymentStatus === 'outstanding') {
      acc[name].outstandingBalance += sale.totalPrice;
    }
    acc[name].transactions.push(sale);
    // Prefer the most recent phone number if available
    if (sale.customerPhone && !acc[name].phone) {
      acc[name].phone = sale.customerPhone;
    }
    return acc;
  }, {});

  const clients: ClientGroup[] = (Object.values(clientGroups) as ClientGroup[])
    .filter((client: ClientGroup) => client.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a: ClientGroup, b: ClientGroup) => b.totalSpent - a.totalSpent);

  const toggleClient = (name: string) => {
    setExpandedClient(expandedClient === name ? null : name);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest rounded">CEO Level Access</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 italic font-serif">Client Ledger</h1>
          <p className="text-gray-500 font-medium">Detailed financial relationship management per customer.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
      </header>

      <div className="space-y-4">
        {clients.map((client, i) => (
          <motion.div 
            key={client.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div 
              onClick={() => toggleClient(client.name)}
              className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                    <Users size={28} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900">{client.name}</h3>
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-1">
                        <Phone size={12} /> {client.phone}
                      </div>
                    )}
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 md:gap-12">
                 <div className="text-right">
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales</span>
                    <span className="text-lg font-black font-mono text-gray-900">KSh {client.totalSpent.toLocaleString()}</span>
                 </div>
                 <div className="text-right">
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Outstanding</span>
                    <span className={`text-lg font-black font-mono ${client.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      KSh {client.outstandingBalance.toLocaleString()}
                    </span>
                 </div>
                 <div className="text-right border-l border-gray-100 pl-8">
                   {expandedClient === client.name ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                 </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedClient === client.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-50"
                >
                  <div className="p-8 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-6">
                       <Clock size={16} className="text-gray-400" />
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction History ({client.totalTransactions})</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {client.transactions.map((sale) => (
                        <div key={sale.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                sale.productType === 'Milk' ? 'bg-blue-50 text-blue-600' :
                                sale.productType === 'Eggs' ? 'bg-amber-50 text-amber-600' :
                                sale.productType === 'Water' ? 'bg-cyan-50 text-cyan-600' : 'bg-green-50 text-green-600'
                              }`}>
                                {sale.productType}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{sale.quantity} Units Sold</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                   {format(new Date(sale.date), 'MMMM dd, yyyy • HH:mm')}
                                </p>
                              </div>
                           </div>

                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Amount</p>
                                 <p className="text-sm font-black font-mono text-gray-900">KSh {sale.totalPrice.toLocaleString()}</p>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                sale.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                 {sale.paymentStatus === 'paid' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                 {sale.paymentStatus}
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {clients.length === 0 && (
          <div className="py-20 text-center">
            <Users size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium italic">No clients found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
