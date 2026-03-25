/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  User, 
  Play, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Home,
  Star,
  Gamepad2,
  ArrowRight,
  LogOut,
  LayoutGrid,
  Brain,
  ChevronRight,
  ShieldCheck,
  Trash2,
  Mail,
  AlertCircle
} from 'lucide-react';
import { vocabData, emojis } from './constants';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  ADMIN_EMAILS, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';

// --- Types ---
type GameType = 'scramble' | 'truefalse' | 'hunter';
type Screen = 'welcome' | 'menu' | 'game' | 'leaderboard' | 'admin';

interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  timestamp?: any;
}

// --- Components ---

const Fireworks = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: '50vw', y: '100vh' }}
          animate={{ 
            scale: [0, 1, 0.5],
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 60}vh`,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            delay: Math.random() * 0.5
          }}
          className="absolute w-4 h-4 rounded-full"
          style={{ backgroundColor: ['#FFD700', '#FF4500', '#00FF00', '#1E90FF', '#FF69B4'][i % 5] }}
        />
      ))}
    </div>
  );
};

export default function App() {
  return (
    <AppContent />
  );
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showFireworks, setShowFireworks] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email || ''));
        setCurrentScreen('menu');
      } else {
        setIsAdmin(false);
        setCurrentScreen('welcome');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Leaderboard Listener
  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any;
      setLeaderboard(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaderboard');
    });
    return () => unsubscribe();
  }, []);

  const updateLeaderboard = async (finalScore: number) => {
    if (!user || finalScore <= 0) return;
    try {
      await addDoc(collection(db, 'leaderboard'), {
        userId: user.uid,
        name: user.displayName || 'Anonymous',
        score: finalScore,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leaderboard');
    }
  };

  const handleCorrect = (points: number = 10) => {
    setScore(prev => prev + points);
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 2000);
  };

  const handleWrong = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const resetGame = () => {
    setCurrentScreen('menu');
    setSelectedGame(null);
    setSelectedUnit(null);
  };

  const handleLogout = async () => {
    await logout();
    setScore(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-20 bg-[#F8FAFC]" />
      <div className="fixed inset-0 -z-10 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Floating Decorative Shapes */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed bottom-20 right-10 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] -z-20" />
      
      {showFireworks && <Fireworks />}
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card px-6 py-5 flex items-center justify-between shadow-sm border-b border-white/50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => setCurrentScreen('menu')}
        >
          <div className="w-12 h-12 hero-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
            <Brain size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">ĐẤU TRƯỜNG</h1>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-1">TỪ VỰNG</div>
          </div>
        </motion.div>

        {user && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 sm:gap-8"
          >
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm của bạn</div>
              <div className="text-xl font-black text-indigo-600">{score}</div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/50 p-1.5 pr-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-10 h-10 overflow-hidden rounded-xl border border-slate-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={20} />
                  </div>
                )}
              </div>
              <span className="font-black text-slate-700 text-sm max-w-[100px] truncate">{user.displayName}</span>
            </div>

            <button 
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 group"
              title="Đăng xuất"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-12">
        <AnimatePresence mode="wait">
          {currentScreen === 'welcome' && (
            <WelcomeScreen />
          )}

          {currentScreen === 'menu' && (
            <MenuScreen 
              onSelectGame={(game) => setSelectedGame(game)}
              onSelectUnit={(unit) => {
                if (selectedGame) {
                  setSelectedUnit(unit);
                  setCurrentScreen('game');
                }
              }}
              selectedGame={selectedGame}
              onShowLeaderboard={() => setCurrentScreen('leaderboard')}
              onShowAdmin={() => setCurrentScreen('admin')}
              isAdmin={isAdmin}
            />
          )}

          {currentScreen === 'game' && selectedGame && selectedUnit && (
            <GameContainer 
              gameType={selectedGame}
              unit={selectedUnit}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              onExit={() => {
                updateLeaderboard(score);
                resetGame();
              }}
              shake={shake}
            />
          )}

          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen 
              entries={leaderboard}
              onBack={() => setCurrentScreen('menu')}
            />
          )}

          {currentScreen === 'admin' && isAdmin && (
            <AdminScreen 
              onBack={() => setCurrentScreen('menu')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-blue-400 z-50" />
    </div>
  );
}

// --- Screen Components ---

function WelcomeScreen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full text-center space-y-16"
      >
        <div className="space-y-8">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative inline-block"
          >
            <div className="w-40 h-40 hero-gradient rounded-[3rem] mx-auto flex items-center justify-center text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] floating relative z-10">
              <Brain size={80} className="drop-shadow-2xl" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-indigo-200 rounded-[3.5rem] opacity-50"
            />
          </motion.div>
          
          <div className="space-y-4">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-7xl sm:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]"
            >
              ĐẤU TRƯỜNG <br />
              <span className="text-transparent bg-clip-text hero-gradient">TỪ VỰNG</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed"
            >
              Cùng ĐẤU TRƯỜNG TỪ VỰNG khám phá thế giới từ vựng lớp 5 qua những trò chơi hấp dẫn nhất.
            </motion.p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-10 rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative group max-w-lg mx-auto border-2 border-white/80"
        >
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-12 group-hover:rotate-0 transition-all duration-500">
            <Star size={32} fill="currentColor" />
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Sẵn sàng chưa?</h3>
              <p className="text-slate-500 font-medium">Đăng nhập bằng Google để lưu điểm và thi đấu!</p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-white text-slate-700 font-black py-6 rounded-[2.5rem] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-4 border-2 border-slate-100 group"
            >
              {isLoggingIn ? (
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-8 h-8" />
                  ĐĂNG NHẬP GOOGLE
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-8 text-slate-400 font-bold text-sm uppercase tracking-widest"
        >
          <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500" /> Miễn phí</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Hiệu quả</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-purple-500" /> Vui nhộn</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function MenuScreen({ 
  onSelectGame, 
  onSelectUnit, 
  selectedGame,
  onShowLeaderboard,
  onShowAdmin,
  isAdmin
}: { 
  onSelectGame: (game: GameType) => void, 
  onSelectUnit: (unit: string) => void,
  selectedGame: GameType | null,
  onShowLeaderboard: () => void,
  onShowAdmin: () => void,
  isAdmin: boolean
}) {
  const games: { id: GameType, name: string, icon: any, color: string, desc: string, longDesc: string }[] = [
    { 
      id: 'truefalse', 
      name: 'Đúng hay Sai?', 
      icon: CheckCircle2, 
      color: 'from-emerald-400 to-teal-600', 
      desc: 'Thử thách phản xạ',
      longDesc: 'Kiểm tra xem nghĩa của từ có đúng không trong thời gian ngắn nhất.'
    },
    { 
      id: 'scramble', 
      name: 'Sắp xếp từ', 
      icon: LayoutGrid, 
      color: 'from-indigo-400 to-blue-600', 
      desc: 'Thử thách trí nhớ',
      longDesc: 'Sắp xếp các chữ cái bị xáo trộn thành một từ tiếng Anh hoàn chỉnh.'
    },
    { 
      id: 'hunter', 
      name: 'Thợ săn từ vựng', 
      icon: Gamepad2, 
      color: 'from-orange-400 to-red-600', 
      desc: 'Thử thách tốc độ',
      longDesc: 'Bắt lấy bong bóng chứa từ tiếng Anh chính xác trước khi chúng bay mất!'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-16 py-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">Chào bạn, sẵn sàng chưa?</h2>
          <p className="text-xl text-slate-500 font-medium">Chọn một trò chơi để bắt đầu tích lũy điểm thưởng nhé!</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onShowLeaderboard}
            className="flex items-center gap-3 px-8 py-4 glass-card rounded-2xl font-black text-slate-700 hover:bg-white hover:shadow-xl transition-all group border-2 border-yellow-100"
          >
            <Trophy size={24} className="text-yellow-500 group-hover:rotate-12 transition-transform" />
            BẢNG XẾP HẠNG
          </button>
          {isAdmin && (
            <button 
              onClick={onShowAdmin}
              className="flex items-center gap-3 px-8 py-4 glass-card rounded-2xl font-black text-indigo-600 hover:bg-white hover:shadow-xl transition-all group border-2 border-indigo-100"
            >
              <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />
              QUẢN TRỊ
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {games.map((game) => (
          <motion.button
            key={game.id}
            whileHover={{ y: -12 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectGame(game.id as GameType)}
            className={`bento-card p-10 text-left transition-all group min-h-[320px] flex flex-col justify-between ${
              selectedGame === game.id ? 'ring-8 ring-indigo-500/20 bg-white' : 'glass-card'
            }`}
          >
            <div className="space-y-6">
              <div className={`w-20 h-20 bg-gradient-to-br ${game.color} rounded-[2rem] flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                <game.icon size={40} className="drop-shadow-md" />
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-slate-900">{game.name}</h3>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">{game.longDesc}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-8">
              <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-gradient-to-r ${game.color} text-white shadow-lg`}>
                {game.desc}
              </span>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${selectedGame === game.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                <ChevronRight size={24} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedGame && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 pt-8"
          >
            <div className="flex items-center gap-6">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Chọn bài học của bạn</h3>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {Object.keys(vocabData).map((unit, index) => {
                const unitKey = unit.split(':')[0].split(' ')[1];
                const emoji = emojis[unitKey] || '💡';
                const colors = [
                  'from-blue-400 to-indigo-500',
                  'from-purple-400 to-pink-500',
                  'from-orange-400 to-red-500',
                  'from-green-400 to-emerald-500',
                  'from-yellow-400 to-orange-500',
                  'from-pink-400 to-rose-500',
                  'from-cyan-400 to-blue-500',
                  'from-teal-400 to-green-500'
                ];
                const cardColor = colors[index % colors.length];

                return (
                  <motion.button
                    key={unit}
                    whileHover={{ scale: 1.05, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectUnit(unit)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity rounded-[2.5rem] -z-10" />
                    <div className="glass-card p-8 rounded-[2.5rem] text-center h-full flex flex-col items-center justify-center gap-4 transition-all border-2 border-transparent hover:border-white hover:shadow-2xl">
                      <div className="text-5xl mb-2 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">{emoji}</div>
                      <div className="space-y-1">
                        <div className={`text-xs font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r ${cardColor}`}>
                          {unit.split(':')[0]}
                        </div>
                        <div className="text-sm font-bold text-slate-800 leading-tight">
                          {unit.split(':')[1]}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AdminScreen({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kỷ lục này?')) {
      try {
        await deleteDoc(doc(db, 'leaderboard', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `leaderboard/${id}`);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 py-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <ShieldCheck size={48} className="text-indigo-600" />
            Trang Quản Trị
          </h2>
          <p className="text-xl text-slate-500 font-medium">Quản lý bảng xếp hạng và hệ thống.</p>
        </div>
        <button 
          onClick={onBack}
          className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all text-slate-600"
        >
          <Home size={24} />
        </button>
      </div>

      <div className="glass-card rounded-[3rem] overflow-hidden border-2 border-white/80 shadow-xl">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <h3 className="text-2xl font-black">Lịch sử điểm số</h3>
          <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-bold">{entries.length} kỷ lục</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">Người chơi</th>
                <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">Điểm</th>
                <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">Thời gian</th>
                <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                        {entry.name[0]}
                      </div>
                      <span className="font-bold text-slate-700">{entry.name}</span>
                    </div>
                  </td>
                  <td className="p-6 font-black text-indigo-600 text-xl">{entry.score}</td>
                  <td className="p-6 text-slate-400 font-medium">
                    {entry.timestamp?.toDate().toLocaleString('vi-VN')}
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => handleDelete(entry.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardScreen({ entries, onBack }: { entries: LeaderboardEntry[], onBack: () => void }) {
  const getMedal = (index: number) => {
    switch(index) {
      case 0: return <Trophy size={20} className="text-yellow-500" />;
      case 1: return <Trophy size={20} className="text-slate-400" />;
      case 2: return <Trophy size={20} className="text-orange-500" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto glass-card p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl -z-10" />

      <div className="text-center mb-12">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-yellow-200"
        >
          <Trophy size={48} className="drop-shadow-lg" />
        </motion.div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">Bảng Xếp Hạng</h2>
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] mt-3">Những nhà thám hiểm xuất sắc nhất</p>
      </div>

      <div className="space-y-4 mb-12">
        {entries.length > 0 ? entries.map((entry, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${
              i === 0 ? 'bg-indigo-50/50 border-indigo-100 shadow-lg shadow-indigo-50' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-6">
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${
                i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-xl shadow-yellow-200' : 
                i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-xl shadow-slate-200' : 
                i === 2 ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white shadow-xl shadow-orange-200' : 'bg-slate-100 text-slate-400'
              }`}>
                {i + 1}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-lg block">{entry.name}</span>
                  {getMedal(i)}
                </div>
                {i === 0 && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Nhà vô địch</span>}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-black text-indigo-600 text-2xl tracking-tighter">{entry.score}</span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Điểm</span>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-16 glass-card rounded-[2.5rem] border-dashed border-2 border-slate-200">
            <p className="text-slate-400 font-black text-lg">Chưa có ai ghi danh cả!</p>
            <p className="text-slate-300 font-medium">Hãy là người đầu tiên nhé!</p>
          </div>
        )}
      </div>

      <button 
        onClick={onBack}
        className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 active:scale-95 text-lg uppercase tracking-widest"
      >
        <Home size={24} /> QUAY LẠI MENU
      </button>
    </motion.div>
  );
}

// --- Game Logic Container ---

function GameContainer({ 
  gameType, 
  unit, 
  onCorrect, 
  onWrong, 
  onExit,
  shake
}: { 
  gameType: GameType, 
  unit: string, 
  onCorrect: (points?: number) => void, 
  onWrong: () => void, 
  onExit: () => void,
  shake: boolean
}) {
  const data = useMemo(() => {
    const unitData = vocabData[unit] || [];
    // Shuffle and pick 10-15 words
    return [...unitData].sort(() => Math.random() - 0.5).slice(0, 15);
  }, [unit]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);

  const nextQuestion = () => {
    setFeedback(null);
    if (currentIndex < data.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of unit
      onExit();
    }
  };

  const handleAnswer = (isCorrect: boolean, points: number = 10) => {
    if (isCorrect) {
      onCorrect(points);
      setFeedback({ 
        isCorrect: true, 
        message: points === 20 ? 'EXCELLENT! +20đ' : 'Chính xác! Giỏi lắm!' 
      });
      setTimeout(nextQuestion, 1500);
    } else {
      onWrong();
      setFeedback({ isCorrect: false, message: `Tiếc quá! Đáp án đúng là: ${data[currentIndex].en}` });
      setTimeout(nextQuestion, 3000);
    }
  };

  return (
    <motion.div 
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      className="glass-card p-8 sm:p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 relative overflow-hidden max-w-4xl mx-auto"
    >
      <div className="absolute top-0 left-0 w-full h-2.5 bg-slate-100">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
          className="h-full hero-gradient"
        />
      </div>

      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onExit}
          className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center group"
        >
          <XCircle size={28} className="group-hover:rotate-90 transition-transform" />
        </button>
        
        <div className="px-6 py-2 bg-indigo-50 rounded-2xl text-indigo-600 font-black text-sm tracking-widest flex items-center gap-2">
          <Star size={16} fill="currentColor" />
          CÂU {currentIndex + 1} / {data.length}
        </div>
      </div>

      <div className="mt-8">
        {gameType === 'scramble' && (
          <ScrambleGame 
            word={data[currentIndex]} 
            onAnswer={handleAnswer} 
            disabled={!!feedback}
          />
        )}
        {gameType === 'truefalse' && (
          <TrueFalseGame 
            word={data[currentIndex]} 
            allWords={data}
            onAnswer={handleAnswer} 
            disabled={!!feedback}
          />
        )}
        {gameType === 'hunter' && (
          <HunterGame 
            word={data[currentIndex]} 
            allWords={vocabData[unit] || []}
            onAnswer={handleAnswer} 
            disabled={!!feedback}
            currentIndex={currentIndex}
          />
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 p-4 rounded-2xl text-center font-bold ${
              feedback.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Specific Game Components ---

function ScrambleGame({ word, onAnswer, disabled }: { word: any, onAnswer: (isCorrect: boolean, points?: number) => void, disabled: boolean }) {
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    const chars = word.en.toUpperCase().split('');
    let s = [...chars].sort(() => Math.random() - 0.5);
    while (s.join('') === word.en.toUpperCase() && chars.length > 1) {
      s = [...chars].sort(() => Math.random() - 0.5);
    }
    setShuffled(s);
    setSelected([]);
  }, [word]);

  const toggleChar = (index: number) => {
    if (disabled) return;
    if (selected.includes(index)) {
      setSelected(selected.filter(i => i !== index));
    } else {
      const newSelected = [...selected, index];
      setSelected(newSelected);
      if (newSelected.length === shuffled.length) {
        const answer = newSelected.map(i => shuffled[i]).join('');
        onAnswer(answer === word.en.toUpperCase());
      }
    }
  };

  return (
    <div className="text-center space-y-12">
      <div className="space-y-4">
        <div className="text-xl font-black text-indigo-500 uppercase tracking-[0.3em]">Sắp xếp từ này</div>
        <div className="text-5xl font-black text-slate-900 bg-white inline-block px-10 py-6 rounded-[2.5rem] shadow-xl border-2 border-slate-50">
          {word.vi}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 min-h-[80px]">
        {selected.map((index, i) => (
          <motion.div
            key={`sel-${i}`}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-200 border-b-4 border-indigo-800"
          >
            {shuffled[index]}
          </motion.div>
        ))}
        {Array.from({ length: shuffled.length - selected.length }).map((_, i) => (
          <div key={`empty-${i}`} className="w-16 h-16 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200" />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-8">
        {shuffled.map((char, i) => (
          <motion.button
            key={i}
            whileHover={!selected.includes(i) ? { scale: 1.1, y: -4 } : {}}
            whileTap={!selected.includes(i) ? { scale: 0.9 } : {}}
            onClick={() => toggleChar(i)}
            disabled={disabled || selected.includes(i)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black transition-all shadow-lg ${
              selected.includes(i) 
                ? 'bg-slate-100 text-slate-300 scale-90 opacity-50' 
                : 'bg-white text-slate-800 hover:bg-indigo-50 hover:text-indigo-600 border-b-4 border-slate-200 active:border-b-0'
            }`}
          >
            {char}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function TrueFalseGame({ word, allWords, onAnswer, disabled }: { word: any, allWords: any[], onAnswer: (isCorrect: boolean, points?: number) => void, disabled: boolean }) {
  const [isTrue, setIsTrue] = useState(true);
  const [displayVi, setDisplayVi] = useState('');

  useEffect(() => {
    const shouldBeTrue = Math.random() > 0.5;
    setIsTrue(shouldBeTrue);
    if (shouldBeTrue) {
      setDisplayVi(word.vi);
    } else {
      const other = allWords.filter(w => w.vi !== word.vi);
      const randomOther = other[Math.floor(Math.random() * other.length)];
      setDisplayVi(randomOther?.vi || '???');
    }
  }, [word, allWords]);

  return (
    <div className="text-center space-y-12">
      <div className="space-y-6">
        <div className="text-7xl font-black text-indigo-600 uppercase tracking-tighter drop-shadow-sm">{word.en}</div>
        <div className="flex items-center justify-center gap-6">
          <div className="h-[2px] w-12 bg-slate-200" />
          <div className="text-xl text-slate-400 font-black uppercase tracking-[0.3em]">nghĩa là</div>
          <div className="h-[2px] w-12 bg-slate-200" />
        </div>
        <div className="text-5xl font-black text-slate-900 bg-white py-8 px-12 rounded-[3rem] inline-block shadow-2xl border-4 border-slate-50 relative">
          <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
            <Star size={20} fill="currentColor" />
          </div>
          {displayVi}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-md mx-auto pt-8">
        <motion.button 
          whileHover={{ scale: 1.05, y: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAnswer(isTrue)}
          disabled={disabled}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-emerald-200 transition-all flex flex-col items-center gap-4 group border-b-8 border-emerald-700 active:border-b-0"
        >
          <CheckCircle2 size={48} className="group-hover:scale-125 transition-transform" />
          <span className="tracking-[0.3em] uppercase text-lg">ĐÚNG</span>
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05, y: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAnswer(!isTrue)}
          disabled={disabled}
          className="bg-rose-500 hover:bg-rose-600 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-rose-200 transition-all flex flex-col items-center gap-4 group border-b-8 border-rose-700 active:border-b-0"
        >
          <XCircle size={48} className="group-hover:scale-125 transition-transform" />
          <span className="tracking-[0.3em] uppercase text-lg">SAI</span>
        </motion.button>
      </div>
    </div>
  );
}

function HunterGame({ word, allWords, onAnswer, disabled, currentIndex }: { word: any, allWords: any[], onAnswer: (isCorrect: boolean, points?: number) => void, disabled: boolean, currentIndex: number }) {
  const [options, setOptions] = useState<{ en: string, color: string, x: number, y: number, delay: number, speedVar: number }[]>([]);
  
  // Speed increases as currentIndex increases
  // Base duration starts at 8s and decreases by 0.4s per question, min 3s
  const baseDuration = Math.max(3, 8 - (currentIndex * 0.4));
  
  const [timeLeft, setTimeLeft] = useState(baseDuration);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    setStartTime(Date.now());
    const distractors = allWords
      .filter(w => w.en !== word.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-orange-400 to-orange-600',
      'from-emerald-400 to-emerald-600'
    ];

    const allOptions = [...distractors, word]
      .sort(() => Math.random() - 0.5)
      .map((opt, i) => {
        const startX = 5 + Math.random() * 90;
        const endX = 5 + Math.random() * 90;
        return {
          en: opt.en,
          color: colors[Math.floor(Math.random() * colors.length)],
          startX,
          endX,
          yOffset: Math.random() * 200,
          delay: Math.random() * 3,
          speedVar: 0.8 + Math.random() * 0.4 
        };
      });
    
    setOptions(allOptions);
    setTimeLeft(baseDuration);
  }, [word, allWords, baseDuration]);

  useEffect(() => {
    if (disabled) return;
    if (timeLeft <= 0) {
      onAnswer(false);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, [timeLeft, disabled, onAnswer]);

  const handlePick = (en: string) => {
    if (disabled) return;
    const isCorrect = en === word.en;
    const timeSpent = (Date.now() - startTime) / 1000;
    const points = timeSpent < 2 ? 20 : 10;
    onAnswer(isCorrect, points);
  };

  return (
    <div className="text-center space-y-8 min-h-[500px] relative">
      <div className="space-y-4">
        <div className="text-xl font-black text-indigo-500 uppercase tracking-[0.3em]">Tìm từ tiếng Anh cho:</div>
        <div className="text-5xl font-black text-slate-900 bg-white inline-block px-10 py-6 rounded-[2.5rem] shadow-xl border-2 border-slate-50">
          {word.vi}
        </div>
      </div>

      {/* Timer Bar */}
      <div className="max-w-md mx-auto h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-inner">
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / baseDuration) * 100}%` }}
          className={`h-full ${timeLeft < 3 ? 'bg-rose-500' : 'bg-indigo-500'}`}
        />
      </div>

      {/* Bubbles Area */}
      <div className="relative h-[450px] mt-12 overflow-hidden rounded-[3rem] bg-slate-50/50 border-2 border-dashed border-slate-200">
        <AnimatePresence>
          {!disabled && options.map((opt, i) => (
            <motion.button
              key={`${word.en}-${opt.en}-${i}`}
              initial={{ y: 500 + opt.yOffset, x: `${opt.startX}%`, opacity: 0 }}
              animate={{ 
                y: -150, 
                x: [`${opt.startX}%`, `${opt.endX}%`],
                opacity: 1 
              }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ 
                y: { duration: baseDuration * opt.speedVar, ease: "linear", delay: opt.delay },
                x: { duration: baseDuration * opt.speedVar, ease: "easeInOut", delay: opt.delay },
                opacity: { duration: 0.5 }
              }}
              onClick={() => handlePick(opt.en)}
              className={`absolute w-28 h-28 rounded-full bg-gradient-to-br ${opt.color} text-white font-black flex items-center justify-center p-4 text-center shadow-2xl border-4 border-white/30 backdrop-blur-sm group`}
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.2), inset 8px 8px 16px rgba(255,255,255,0.4)'
              }}
            >
              <div className="absolute top-4 left-6 w-4 h-2 bg-white/40 rounded-full rotate-[-45deg]" />
              <span className="text-sm break-words drop-shadow-md group-hover:scale-110 transition-transform">{opt.en}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
