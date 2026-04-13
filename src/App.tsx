import React, { useState, useEffect } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { Dashboard } from './components/Dashboard';
import { HistoryList } from './components/HistoryList';
import { Button } from './components/ui/button';
import { useSupabaseTimer } from './hooks/useSupabaseTimer';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { LayoutDashboard, History, Timer, Sparkles, LogOut, Clock, Settings, Trash2, AlertTriangle } from 'lucide-react';
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
      
      // If we have a session and there's a hash in the URL (likely from email confirmation)
      if (session && window.location.hash) {
        // Clean up the URL to prevent routing issues
        window.history.replaceState(null, '', window.location.pathname);
      }
    }).catch(err => {
      console.error("Error fetching session:", err);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, !!session);
      setUser(session?.user ?? null);
      
      if (_event === 'SIGNED_IN' && session) {
        setAuthLoading(false);
        // Clean up URL if needed
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
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
    savedTasks,
    saveTaskTemplate,
    deleteSavedTask,
    error: timerError,
  } = useSupabaseTimer(user?.id);

  const [activeTab, setActiveTab] = useState('timer');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.rpc('delete_user');
      
      if (error) {
        if (error.message.includes('function "delete_user" does not exist')) {
          throw new Error('Database function not set up. Please run the SQL snippet below to enable account deletion.');
        }
        throw error;
      }
      
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

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
        <aside className="lg:w-28 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-white/5 bg-black/20 backdrop-blur-2xl flex lg:flex-col items-center justify-between p-4 lg:py-10 z-50">
          <div className="flex lg:flex-col items-center gap-12 w-full">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 flex items-center justify-center relative group"
            >
              <img 
                src="/logo_tracker_new2.svg" 
                alt="Logo" 
                className="w-12 h-12 relative z-10" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <nav className="flex lg:flex-col gap-4 w-full px-3">
              {[
                { id: 'timer', icon: Timer, label: 'Timer' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
                { id: 'history', icon: History, label: 'Log' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-4 rounded-2xl transition-all duration-500 group relative w-full flex items-center justify-center cursor-pointer ${
                    activeTab === item.id 
                      ? 'text-[var(--brand-pink)]' 
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute bottom-1 left-4 right-4 h-1 bg-[var(--brand-pink)] rounded-full shadow-[0_4px_12px_rgba(236,72,153,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <item.icon className={`w-6 h-6 relative z-10 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  
                  <span className="absolute left-full ml-6 px-3 py-1.5 bg-popover/90 backdrop-blur-md text-popover-foreground text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 hidden lg:block whitespace-nowrap border border-white/10 shadow-2xl">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-1 h-1 bg-[var(--brand-pink)]/40 rounded-full" />
              <div className="w-1 h-8 bg-gradient-to-b from-[var(--brand-pink)]/40 to-transparent rounded-full" />
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/30 vertical-rl rotate-180 select-none">
              Chronos <span className="text-[var(--brand-pink)]/40">v1.0</span>
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
                {activeTab === 'settings' && 'Settings'}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-[var(--brand-pink)] truncate max-w-[150px]">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-0 rounded-xl text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive hover:underline hover:bg-transparent transition-all active:scale-95"
                >
                  Sign Out <LogOut className="w-3.5 h-3.5 ml-2" />
                </Button>
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
                      savedTasks={savedTasks}
                      onSaveTemplate={saveTaskTemplate}
                      onDeleteTemplate={deleteSavedTask}
                      error={timerError}
                    />
                  )}
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      sessions={sessions} 
                      activeElapsed={timerState.isActive && !timerState.isPaused ? elapsed : 0}
                      activeCategory={timerState.isActive ? timerState.category : undefined}
                    />
                  )}
                  {activeTab === 'history' && <HistoryList sessions={sessions} onDelete={deleteSession} />}
                  {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto space-y-12">
                      <div className="space-y-4">
                        <h3 className="text-xl font-heading font-light">Account Settings</h3>
                        <div className="p-6 bg-card/20 border border-border/20 rounded-3xl space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-foreground/90">Email Address</p>
                              <p className="text-xs text-foreground/50">{user?.email}</p>
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                              Verified
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <h3 className="text-xl font-heading font-light">Danger Zone</h3>
                        </div>
                        <div className="p-8 bg-destructive/5 border border-destructive/20 rounded-3xl space-y-6">
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-destructive">Delete Account</p>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                              Once you delete your account, there is no going back. Please be certain.
                              All your time entries and statistics will be permanently removed.
                            </p>
                          </div>
                          
                          <Button 
                            variant="destructive" 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="h-12 px-8 rounded-xl text-xs font-bold uppercase tracking-widest"
                          >
                            Permanently Delete Account
                          </Button>

                          <AnimatePresence>
                            {showDeleteConfirm && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md"
                              >
                                <div className="max-w-md w-full bg-card border border-border/40 rounded-[2rem] p-8 shadow-2xl space-y-6">
                                  <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                                    <AlertTriangle className="w-8 h-8 text-destructive" />
                                  </div>
                                  <div className="text-center space-y-2">
                                    <h4 className="text-2xl font-heading font-light">Are you absolutely sure?</h4>
                                    <p className="text-sm text-foreground/60 leading-relaxed">
                                      This action cannot be undone. All your data will be permanently wiped from our servers.
                                    </p>
                                  </div>

                                  {deleteError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium text-center">
                                      {deleteError}
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-3">
                                    <Button 
                                      variant="destructive" 
                                      onClick={handleDeleteAccount}
                                      disabled={isDeleting}
                                      className="h-14 rounded-2xl font-bold uppercase tracking-widest"
                                    >
                                      {isDeleting ? 'Deleting Account...' : 'Yes, Delete Everything'}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteError(null);
                                      }}
                                      disabled={isDeleting}
                                      className="h-14 rounded-2xl font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="mt-8 p-6 bg-background/40 rounded-2xl border border-border/10 space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">Setup Required</p>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                              To enable deletion, you must run this SQL in your <span className="text-foreground font-bold">Supabase SQL Editor</span>:
                            </p>
                            <pre className="p-4 bg-black/40 rounded-xl text-[10px] font-mono text-emerald-400/80 overflow-x-auto">
{`create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <footer className="p-6 md:px-12 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground/60">
            <p className="text-[10px] font-medium uppercase tracking-widest">© 2026 Chronos Studio • Supabase Cloud Sync</p>
            <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="hover:text-foreground hover:underline cursor-pointer transition-colors">System Status</span>
              <span className="hover:text-foreground hover:underline cursor-pointer transition-colors">Documentation</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}


