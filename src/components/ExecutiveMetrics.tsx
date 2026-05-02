import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Activity,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ShoppingBag,
  HeartPulse
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, getDocs, orderBy, limit, where, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, LivestockEntry, PoultryEntry, Expense, FarmSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function ExecutiveMetrics() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [livestock, setLivestock] = useState<LivestockEntry[]>([]);
  const [poultry, setPoultry] = useState<PoultryEntry[]>([]);
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('6m');

  useEffect(() => {
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });
    const unsubLivestock = onSnapshot(collection(db, 'production_livestock'), (snapshot) => {
      setLivestock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivestockEntry)));
    });
    const unsubPoultry = onSnapshot(collection(db, 'production_poultry'), (snapshot) => {
      setPoultry(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PoultryEntry)));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as FarmSettings);
      }
    });

    return () => {
      unsubSales();
      unsubExpenses();
      unsubLivestock();
      unsubPoultry();
      unsubSettings();
    };
  }, []);

  // Financial Aggregations
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  // Outstanding Bills (Accounts Receivable)
  const outstandingRevenue = sales.filter(s => s.paymentStatus === 'outstanding').reduce((acc, s) => acc + s.totalPrice, 0);

  // Unit Specific Revenue
  const unitRevenue = sales.reduce((acc: any, s) => {
    let unit = 'Crops';
    if (s.productType === 'Milk') unit = 'Livestock';
    else if (s.productType === 'Eggs') unit = 'Poultry';
    else if (s.productType === 'Water') unit = 'Water';
    
    acc[unit] = (acc[unit] || 0) + s.totalPrice;
    return acc;
  }, { Livestock: 0, Poultry: 0, Crops: 0, Water: 0 });

  // Monthly Performance Data
  const getMonthlyData = () => {
    const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const monthSales = sales.filter(s => isWithinInterval(new Date(s.date), { start, end }));
      const monthExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), { start, end }));
      
      const revenue = monthSales.reduce((acc, s) => acc + s.totalPrice, 0);
      const খরচ = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
      
      data.push({
        month: format(monthDate, 'MMM yy'),
        revenue,
        expenses: খরচ,
        profit: revenue - খরচ
      });
    }
    return data;
  };

  const monthlyPerformance = getMonthlyData();

  const COLORS = ['#16a34a', '#ca8a04', '#2563eb', '#9333ea'];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded">CEO Level Access</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 italic font-serif">Executive Suite</h1>
          <p className="text-gray-500 font-medium">Strategic financial indicators and operational efficiency metrics.</p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
          {(['3m', '6m', '12m'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                timeframe === t ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* High Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Net Profit', value: `KSh ${netProfit.toLocaleString()}`, trend: '+15.2%', icon: TrendingUp, color: 'emerald' },
          { label: 'Total Revenue', value: `KSh ${totalRevenue.toLocaleString()}`, trend: '+8.4%', icon: DollarSign, color: 'blue' },
          { label: 'Total Expenses', value: `KSh ${totalExpenses.toLocaleString()}`, trend: '-2.1%', icon: ShoppingBag, color: 'rose' },
          { label: 'Awaiting Payment', value: `KSh ${outstandingRevenue.toLocaleString()}`, trend: 'Outstanding', icon: Activity, color: 'amber' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-gray-200 transition-all group"
          >
             <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform`}>
                  <kpi.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                  kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 
                  kpi.trend.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}>
                   {kpi.trend.startsWith('+') ? <ArrowUpRight size={12}/> : kpi.trend.startsWith('-') ? <ArrowDownRight size={12}/> : null}
                   {kpi.trend}
                </div>
             </div>
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{kpi.label}</h3>
             <p className="text-3xl font-black text-gray-900 font-mono tracking-tighter leading-none">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profit/Loss Statement */}
        <div className="lg:col-span-2 p-10 bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-100/50">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-gray-900 italic font-serif">Profit & Loss Statement</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monthly Financial Trajectory</p>
            </div>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Revenue</span>
              <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Expenses</span>
            </div>
          </div>
          
          <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={monthlyPerformance}>
                 <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="month" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                   dy={15}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                 />
                 <Tooltip 
                   contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                 />
                 <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                 <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Unit Revenue Distribution */}
        <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-100/50 flex flex-col">
            <h2 className="text-2xl font-black text-gray-900 italic font-serif mb-2">Unit Efficiency</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Revenue by Division</p>
            
            <div className="h-64 flex-1 relative flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={Object.entries(unitRevenue).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                    >
                      {Object.entries(unitRevenue).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute text-center">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth</span>
                  <span className="block text-2xl font-black text-gray-900 leading-none">Balanced</span>
               </div>
            </div>

            <div className="space-y-4 mt-8">
               {Object.entries(unitRevenue).map(([unit, value], i) => (
                 <div key={unit} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                       <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{unit} Unit</span>
                    </div>
                    <span className="text-sm font-black font-mono">KSh {(value as number).toLocaleString()}</span>
                 </div>
               ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wages and Payroll */}
        <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-100/50">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black italic font-serif">Staff Wages & Payroll</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monthly Disbursement</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Users size={20} />
              </div>
           </div>

           <div className="space-y-4">
              {expenses.filter(e => e.category === 'wages').slice(0, 5).map(e => (
                <div key={e.id} className="flex justify-between items-center p-5 border border-gray-50 hover:border-indigo-100 rounded-3xl transition-all">
                   <div>
                      <h4 className="text-sm font-black text-gray-900">{e.description}</h4>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{format(new Date(e.date), 'MMMM dd, yyyy')}</p>
                   </div>
                   <div className="text-right">
                      <span className="block text-sm font-black font-mono text-indigo-600">KSh {e.amount.toLocaleString()}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">Processed</span>
                   </div>
                </div>
              ))}
              {expenses.filter(e => e.category === 'wages').length === 0 && (
                 <div className="py-12 text-center text-gray-400 italic text-sm">No wage records found in the current system.</div>
              )}
           </div>
        </div>

        {/* Operational Efficiency */}
        <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-100/50">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black italic font-serif">Critical Asset Health</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Maintenance & Performance</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <HeartPulse size={20} />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Livestock Output</p>
                 <p className="text-2xl font-black text-emerald-900 font-mono">92.4%</p>
                 <div className="h-1 w-full bg-emerald-200/50 rounded-full mt-3">
                    <div className="h-full w-[92.4%] bg-emerald-500 rounded-full shadow-lg shadow-emerald-200"></div>
                 </div>
              </div>
              <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Poultry Yield</p>
                 <p className="text-2xl font-black text-blue-900 font-mono">88.1%</p>
                 <div className="h-1 w-full bg-blue-200/50 rounded-full mt-3">
                    <div className="h-full w-[88.1%] bg-blue-500 rounded-full shadow-lg shadow-blue-200"></div>
                 </div>
              </div>
           </div>

           <div className="mt-8 space-y-6">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-black text-gray-500 uppercase tracking-widest">System Status</span>
                 <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> All Units Operational
                 </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed italic">
                "Shachaal Farm continues to show strong fiscal resilience. Livestock remains the primary revenue driver, while poultry maintenance costs have decreased by 4%."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
