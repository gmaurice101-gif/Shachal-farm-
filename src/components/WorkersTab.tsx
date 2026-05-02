import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Plus, 
  MoreVertical,
  Circle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Task, UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

export default function WorkersTab() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    // Tasks subscription
    const qTasks = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    // Workers fetch
    const fetchWorkers = async () => {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      setWorkers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    };
    fetchWorkers();

    return () => unsubTasks();
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !assignedTo) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        assignedToUid: assignedTo,
        status: 'to-do',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setAssignedTo('');
      setIsAddingTask(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tasks');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight italic font-serif">Staff & Tasks</h2>
          <p className="text-sm text-gray-500">Manage farm operations and personnel productivity.</p>
        </div>
        {profile?.role === 'manager' && (
          <button 
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-purple-100 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus size={20} /> Assign New Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><CheckSquare size={18} /> Active Tasks</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tasks.length} Total</span>
          </div>

          <div className="space-y-3">
            {tasks.map((task, i) => {
              const worker = workers.find(w => w.uid === task.assignedToUid);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-purple-200 transition-colors flex items-center gap-4 group"
                >
                  <button 
                    onClick={() => handleUpdateStatus(task.id, task.status === 'completed' ? 'to-do' : 'completed')}
                    className={`p-1 rounded-full transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-purple-400'}`}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1">
                    <h4 className={`font-bold transition-all ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 font-sans'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1"><Users size={12} /> {worker?.displayName || 'Unknown'}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                    task.status === 'completed' ? 'bg-green-50 text-green-700' : 
                    task.status === 'in-progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {task.status}
                  </div>

                  <button className="text-gray-300 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </motion.div>
              );
            })}
            {tasks.length === 0 && (
              <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                No active tasks.
              </div>
            )}
          </div>
        </div>

        {/* Worker Profiles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Users size={18} /> Staff Profiles</h3>
          </div>
          <div className="space-y-3">
            {workers.map((worker) => (
              <div key={worker.uid} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-100 to-blue-50 flex items-center justify-center font-bold text-gray-400">
                  {worker.displayName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{worker.displayName}</div>
                  <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{worker.role}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-purple-50 rounded-3xl space-y-4">
             <div className="p-3 bg-white w-10 h-10 rounded-xl text-purple-600 shadow-sm">
                <AlertCircle size={20} />
             </div>
             <div>
                <h4 className="text-sm font-bold text-purple-900">Safety Compliance</h4>
                <p className="text-xs text-purple-700 mt-1 leading-relaxed">Ensure all workers have completed this month's equipment safety training.</p>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold">Assign Task</h3>
                <button onClick={() => setIsAddingTask(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Task Title</label>
                  <input 
                    type="text" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 font-sans" 
                    placeholder="e.g. Clean the storage unit"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">Assign To</label>
                  <select 
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a worker...</option>
                    {workers.map(w => (
                      <option key={w.uid} value={w.uid}>{w.displayName} ({w.role})</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-100 flex items-center justify-center gap-2 mt-4 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  SEND ASSIGNMENT
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
