import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Milestone, 
  Calendar,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, LivestockEntry, PoultryEntry, UserProfile } from '../types';
import { isAfter, subDays, isSameDay } from 'date-fns';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export default function SummaryDashboard() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [livestock, setLivestock] = useState<LivestockEntry[]>([]);
  const [poultry, setPoultry] = useState<PoultryEntry[]>([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');

  useEffect(() => {
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });

    const unsubLivestock = onSnapshot(collection(db, 'production_livestock'), (snapshot) => {
      setLivestock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivestockEntry)));
    });

    const unsubPoultry = onSnapshot(collection(db, 'production_poultry'), (snapshot) => {
      setPoultry(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PoultryEntry)));
    });

    const fetchWorkers = async () => {
      const q = await getDocs(collection(db, 'users'));
      setWorkerCount(q.size);
    };
    fetchWorkers();

    return () => { unsubSales(); unsubLivestock(); unsubPoultry(); };
  }, []);

  // Filtering Logic
  const getFilteredSales = () => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      switch (reportPeriod) {
        case 'daily': return isSameDay(saleDate, now);
        case 'weekly': return isAfter(saleDate, subDays(now, 7));
        case 'monthly': return isAfter(saleDate, subDays(now, 30));
        case 'quarterly': return isAfter(saleDate, subDays(now, 90));
        case 'yearly': return isAfter(saleDate, subDays(now, 365));
        default: return true;
      }
    });
  };

  const filteredSales = getFilteredSales();

  // Aggregations
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalOutstanding = filteredSales.filter(s => s.paymentStatus === 'outstanding').reduce((acc, s) => acc + s.totalPrice, 0);
  
  // Chart data for last 7 entries (Simplified for dashboard)
  const productionData = livestock.slice(0, 7).map((l, i) => {
    const p = poultry[i];
    return {
      name: new Date(l.date).toLocaleDateString(undefined, { weekday: 'short' }),
      milk: l.milkVolume,
      eggs: p ? p.eggCount / 10 : 0 // Scale eggs for the chart
    };
  }).reverse();

  const revenueByCategory = filteredSales.reduce((acc: any, sale) => {
    acc[sale.productType] = (acc[sale.productType] || 0) + sale.totalPrice;
    return acc;
  }, {});

  const pieData = Object.entries(revenueByCategory).map(([name, value]) => ({ name, value: value as number }));

  const COLORS = ['#16a34a', '#ca8a04', '#2563eb', '#9333ea'];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
            {profile?.role === 'executive' ? 'Executive Oversight (CEO)' : 'Farm Manager Dashboard'}
          </h1>
          <p className="text-gray-500 font-sans">
            {profile?.role === 'executive' 
              ? "Complete performance metrics for Shachal Farm." 
              : `Welcome back, ${profile?.displayName}. Oversight for daily operations.`}
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
          {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setReportPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                reportPeriod === p 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Period Revenue', value: `KSh ${totalRevenue.toLocaleString()}`, change: `${reportPeriod} gross`, icon: DollarSign, color: 'blue' },
          { label: 'Outstanding Payments', value: `KSh ${totalOutstanding.toLocaleString()}`, change: 'Receivables', icon: Milestone, color: 'red' },
          { label: 'Staff Strength', value: workerCount.toString(), change: 'Registered users', icon: Users, color: 'green' },
          { label: 'Period Transactions', value: filteredSales.length.toString(), change: `${reportPeriod} count`, icon: Package, color: 'purple' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${
                kpi.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                kpi.color === 'red' ? 'bg-red-50 text-red-600' :
                kpi.color === 'green' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
              }`}>
                <kpi.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-gray-50 text-gray-400`}>
                {kpi.change}
              </span>
            </div>
            <h3 className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">{kpi.label}</h3>
            <p className="text-2xl font-bold text-gray-900 font-mono tracking-tighter">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Trends */}
        <div className="lg:col-span-2 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <div>
                <h2 className="text-lg font-bold text-gray-900 italic font-serif">Production Performance</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Recent Output Trends</p>
             </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Milk (L)</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Eggs (x10)</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {productionData.length > 0 ? (
                <LineChart data={productionData}>
                  <StylesGrid />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Line type="monotone" dataKey="milk" stroke="#16a34a" strokeWidth={4} dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="eggs" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">No production data recorded yet.</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Mix */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 italic font-serif mb-2">Financial Breakdown</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-6">Revenue by Category ({reportPeriod})</p>
          <div className="h-64 mb-4 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 italic text-sm">No sales data recorded.</div>
            )}
            <div className="absolute text-center">
               <div className="text-[10px] font-bold text-gray-400 uppercase">Total</div>
               <div className="text-lg font-bold font-mono">KSh {Math.round(totalRevenue / 1000)}k</div>
            </div>
          </div>
          <div className="space-y-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="font-bold text-gray-600 uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-gray-900">KSh {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StylesGrid() {
  return <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />;
}
