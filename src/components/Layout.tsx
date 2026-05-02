import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Tractor, 
  LayoutDashboard, 
  Sprout, 
  DollarSign, 
  Settings, 
  Users, 
  LogOut, 
  Search,
  Bell,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SummaryDashboard from './SummaryDashboard';
import ProductionTab from './ProductionTab';
import SalesTab from './SalesTab';
import EquipmentTab from './EquipmentTab';
import WorkersTab from './WorkersTab';
import ExecutiveMetrics from './ExecutiveMetrics';
import SettingsTab from './SettingsTab';

export default function Layout() {
  const { profile, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'executive', 'worker'] },
    { id: 'metrics', label: 'CEO Metrics', icon: Activity, roles: ['executive'] },
    { id: 'production', label: 'Production', icon: Sprout, roles: ['manager', 'executive', 'worker'] },
    { id: 'sales', label: 'Sales & Revenue', icon: DollarSign, roles: ['manager', 'executive'] },
    { id: 'equipment', label: 'Equipment', icon: Tractor, roles: ['manager', 'executive', 'worker'] },
    { id: 'workers', label: 'Staff & Tasks', icon: Users, roles: ['manager', 'executive', 'worker'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['manager', 'executive'] },
  ];

  const allowedMenuItems = menuItems.filter(item => profile && item.roles.includes(profile.role));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <SummaryDashboard />;
      case 'metrics': return <ExecutiveMetrics />;
      case 'production': return <ProductionTab />;
      case 'sales': return <SalesTab />;
      case 'equipment': return <EquipmentTab />;
      case 'workers': return <WorkersTab />;
      case 'settings': return <SettingsTab />;
      default: return <SummaryDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex font-sans selection:bg-green-100">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-gray-900 text-white w-72 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-600 rounded-xl shadow-lg shadow-green-900/50">
              <Tractor size={24} className="text-white" />
            </div>
            <span className="text-xl font-black italic font-serif leading-none tracking-tighter uppercase whitespace-nowrap">Shachaal Farm</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {allowedMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all group relative
                ${activeTab === item.id 
                  ? 'bg-green-600 text-white shadow-xl shadow-green-900/40' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
              `}
            >
              <item.icon size={20} className={`transition-all ${activeTab === item.id ? 'stroke-[2.5px]' : 'group-hover:scale-110'}`} />
              {item.label}
              {activeTab === item.id && (
                <motion.div layoutId="navIndicator" className="absolute left-1.5 w-1 h-6 bg-white rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-6">
          <div className="p-6 bg-gray-800 rounded-3xl border border-gray-700/50">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 overflow-hidden shadow-md">
                   <div className="w-full h-full flex items-center justify-center font-bold text-white uppercase">{profile?.displayName.charAt(0)}</div>
                </div>
                <div className="overflow-hidden">
                   <div className="font-bold text-sm truncate">{profile?.displayName}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-green-500">{profile?.role}</div>
                </div>
             </div>
             <button 
              onClick={logOut}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-red-500 hover:text-white transition-all rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
          <p className="text-[9px] text-center font-black uppercase tracking-widest text-gray-600">Shachaal Farm OS &copy; 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 bg-[#f5f5f0]/80 backdrop-blur-md z-30 flex items-center justify-between px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 group">
              <div className="p-2 bg-white border border-gray-200 rounded-xl">
                 <Search size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search metrics, reports, tasks..."
                className="bg-transparent border-none outline-none text-sm font-medium w-64 placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
             </button>
             <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors">
                <Settings size={20} />
             </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-8 overflow-y-auto">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3 }}
           >
             {renderContent()}
           </motion.div>
        </div>
      </main>
    </div>
  );
}
