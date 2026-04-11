import React, { useState, useEffect } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { Dashboard } from './components/Dashboard';
import { HistoryList } from './components/HistoryList';
import { useSupabaseTimer } from './hooks/useSupabaseTimer';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { LayoutDashboard, History, Timer, Sparkles, LogOut } from 'lucide-react';
import { Category } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function App() {
  console.log("App rendering...");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log("Initializing Supabase Auth...");
    if (!supabase) {
      console.error("Supabase client not initialized!");
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Session fetched:", !!session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch(err => {
      console.error("Error fetching session:", err);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, !!session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    timerState,
    elapsed,
    sessions,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    deleteSession,
    setTimerState,
  } = useSupabaseTimer(user?.id);

  const [activeTab, setActiveTab] = useState('timer');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[var(--brand-pink)]/5 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[var(--brand-pink)]/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Navigation Sidebar/Rail */}
        <aside className="lg:w-24 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border/40 bg-card/30 backdrop-blur-md flex lg:flex-col items-center justify-between p-4 lg:py-8 z-50">
          <div className="flex lg:flex-col items-center gap-8">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
              <Timer className="w-7 h-7 text-primary-foreground" />
            </div>
            
            <nav className="flex lg:flex-col gap-2">
              {[
                { id: 'timer', icon: Timer, label: 'Timer' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
                { id: 'history', icon: History, label: 'Log' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-3 rounded-xl transition-all duration-300 group relative ${
                    activeTab === item.id 
                      ? 'bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity hidden lg:block whitespace-nowrap border border-border/50">
                    {item.label}
                  </span>
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute bottom-0 lg:bottom-auto lg:left-0 w-full h-0.5 lg:w-0.5 lg:h-full bg-[var(--brand-pink)]"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex flex-col items-center gap-6">
            <div className="w-1 h-12 bg-border/20 rounded-full" />
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground vertical-rl rotate-180">
              Chronos v1.0
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-20 border-b border-border/40 flex items-center justify-between px-6 md:px-12 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex flex-col">
              <h1 className="font-heading text-3xl font-light tracking-tight text-foreground/90">
                {activeTab === 'timer' && 'Focus Session'}
                {activeTab === 'dashboard' && 'Performance'}
                {activeTab === 'history' && 'Activity Log'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[var(--brand-pink)]/5 rounded-full border border-[var(--brand-pink)]/20">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-pink)]/80" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-pink)]/80">Premium</span>
              </div>
              
              <div className="flex items-center gap-3 pl-4 border-l border-border/20">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-foreground/80 truncate max-w-[150px]">{user.email}</span>
                  <button 
                    onClick={handleSignOut}
                    className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-2.5 h-2.5" /> Sign Out
                  </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center text-[10px] font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>

          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-5xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {activeTab === 'timer' && (
                    <TimerDisplay
                      isActive={timerState.isActive}
                      isPaused={timerState.isPaused}
                      elapsed={elapsed}
                      taskName={timerState.taskName}
                      category={timerState.category}
                      onStart={startTimer}
                      onPause={pauseTimer}
                      onResume={resumeTimer}
                      onStop={stopTimer}
                      onTaskNameChange={(name) => setTimerState(prev => ({ ...prev, taskName: name }))}
                      onCategoryChange={(cat) => setTimerState(prev => ({ ...prev, category: cat as Category }))}
                    />
                  )}
                  {activeTab === 'dashboard' && <Dashboard sessions={sessions} />}
                  {activeTab === 'history' && <HistoryList sessions={sessions} onDelete={deleteSession} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <footer className="p-6 md:px-12 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground/60">
            <p className="text-[10px] font-medium uppercase tracking-widest">© 2026 Chronos Studio • Supabase Cloud Sync</p>
            <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="hover:text-foreground cursor-pointer transition-colors">System Status</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Documentation</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}


