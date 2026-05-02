import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Tractor, ShieldCheck, Hammer } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signIn, error } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex relative overflow-hidden font-sans">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-green-900 overflow-hidden hidden lg:block">
        <motion.div 
           initial={{ opacity: 0, scale: 1.2 }}
           animate={{ opacity: 0.15, scale: 1 }}
           transition={{ duration: 2 }}
           className="absolute inset-0 flex items-center justify-center"
        >
          <Tractor size={600} strokeWidth={0.5} className="text-white" />
        </motion.div>
        
        <div className="relative z-10 h-full p-20 flex flex-col justify-end">
           <h2 className="text-6xl font-bold font-serif text-white leading-tight italic">
             Modernizing<br />Shachal Farm.
           </h2>
           <p className="text-green-200 mt-6 max-w-md text-lg leading-relaxed">
             A comprehensive management suite for production tracking, financial analytics, and team coordination.
           </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-12"
        >
          <div className="flex items-center gap-2 mb-12">
            <div className="p-3 bg-green-950 text-white rounded-2xl shadow-xl shadow-green-100">
               <Tractor size={32} />
            </div>
            <span className="text-2xl font-black italic font-serif tracking-tighter text-gray-900 uppercase">Shachal Farm</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight">Welcome to Command Center</h1>
            <p className="text-gray-500 font-medium">Please sign in with your corporate Google account to access your dashboard.</p>
          </div>

          <div className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium flex items-center gap-3"
              >
                <div className="p-1.5 bg-red-100 rounded-lg">
                  < Hammer size={16} className="rotate-45" />
                </div>
                {error}
              </motion.div>
            )}

            <button 
              onClick={signIn}
              className="w-full group flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl shadow-xl shadow-gray-100 hover:border-green-600 hover:bg-green-50 transition-all font-bold text-gray-900 text-lg active:scale-[0.98]"
            >
              <LogIn size={24} className="text-green-600 group-hover:translate-x-1 transition-transform" />
              Sign in with Google
            </button>
            
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
              Tip: If sign-in fails, try opening the app in a new tab.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12">
            {[
              { icon: ShieldCheck, label: 'Secure' },
              { icon: Hammer, label: 'Durable' },
              { icon: Tractor, label: 'Modern' },
            ].map((item) => (
              <div key={item.label} className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <item.icon size={20} />
                </div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 pt-12 font-medium uppercase tracking-widest">
            &copy; 2026 Shachal Farm Management System v2.4
          </p>
        </motion.div>
      </div>
    </div>
  );
}
