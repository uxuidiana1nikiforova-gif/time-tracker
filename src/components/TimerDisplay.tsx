import React from 'react';
import { Play, Pause, Square, Tag, Save, Trash2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CATEGORIES } from '../constants';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TimerDisplayProps {
  isActive: boolean;
  isPaused: boolean;
  elapsed: number;
  taskName: string;
  category: Category;
  onStart: (name: string, cat: Category) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTaskNameChange: (name: string) => void;
  onCategoryChange: (cat: Category) => void;
  savedTasks?: { id: string; name: string; category: Category }[];
  onSaveTemplate?: (name: string, cat: Category) => void;
  onDeleteTemplate?: (id: string) => void;
  error?: string | null;
}

export function TimerDisplay({
  isActive,
  isPaused,
  elapsed,
  taskName,
  category,
  onStart,
  onPause,
  onResume,
  onStop,
  onTaskNameChange,
  onCategoryChange,
  savedTasks = [],
  onSaveTemplate,
  onDeleteTemplate,
  error,
}: TimerDisplayProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const filteredTasks = savedTasks.filter(t => t.category === category);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isStartDisabled = !taskName || taskName.trim() === '';
  const isAlreadySaved = savedTasks.some(t => t.name.toLowerCase() === taskName.toLowerCase() && t.category === category);

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-3xl border-none bg-card/40 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2rem]">
        <CardContent className="p-12 md:p-20 relative">
          {/* Live Indicator in Corner */}
          <AnimatePresence>
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-8 right-8 flex items-center gap-3 px-4 py-2 bg-secondary/30 backdrop-blur-md border border-border/20 rounded-full shadow-lg z-20"
              >
                <div className="relative flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                  {!isPaused && (
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-40" />
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/70">
                  {isPaused ? 'Paused' : 'Live'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center space-y-12">
            {/* Timer Display */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute -inset-12 bg-primary/2 rounded-full blur-[100px] group-hover:bg-primary/5 transition-all duration-1000" />
              {isActive && !isPaused && (
                <div className="absolute -inset-32 bg-primary/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
              )}
              
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="h-1.5 w-12 bg-primary/10 rounded-full overflow-hidden">
                  {isActive && !isPaused && (
                    <motion.div 
                      className="h-full bg-primary"
                      animate={{ x: [-48, 48] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">Chronos</span>
              </div>

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative font-heading text-8xl md:text-[10rem] font-light tracking-tighter text-foreground tabular-nums leading-none"
              >
                {formatTime(elapsed)}
              </motion.div>

              {isActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4"
                >
                  <div className="h-1 w-12 bg-primary/10 rounded-full mx-auto" />
                </motion.div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full max-w-md space-y-8">
              {!isActive ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Selection */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 ml-1">
                        Activity Type
                      </label>
                      <Select value={category} onValueChange={(v) => {
                        onCategoryChange(v as Category);
                        onTaskNameChange(''); // Reset task name when category changes
                      }}>
                        <SelectTrigger className="h-14 bg-secondary/30 border-border/20 focus:ring-primary/20 rounded-2xl font-medium">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border/40 rounded-xl">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="rounded-lg focus:bg-secondary">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-sm">{cat.value}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Task Name Entry */}
                    <div className="space-y-3 relative">
                      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 ml-1">
                        Task Name
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="What are you doing?"
                          value={taskName}
                          onChange={(e) => onTaskNameChange(e.target.value)}
                          onFocus={() => setIsDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                          autoComplete="off"
                          className="h-14 bg-secondary/30 border-border/20 focus-visible:ring-primary/20 px-6 pr-14 rounded-2xl font-medium placeholder:text-foreground/40"
                        />
                        
                        {/* Integrated Save Button */}
                        <AnimatePresence>
                          {taskName && !isAlreadySaved && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              type="button"
                              onClick={() => onSaveTemplate?.(taskName, category)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors group"
                              title="Save as template"
                            >
                              <Save className="w-4 h-4" />
                            </motion.button>
                          )}
                        </AnimatePresence>

                        {/* Custom Dropdown for Saved Tasks */}
                        <AnimatePresence>
                          {isDropdownOpen && filteredTasks.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 right-0 mt-2 p-2 bg-card border border-border/40 rounded-2xl shadow-2xl z-[60] max-h-[240px] overflow-y-auto"
                            >
                              <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-foreground/40 border-b border-border/10 mb-1">
                                {category} Templates
                              </div>
                              {filteredTasks.map((task) => (
                                <div 
                                  key={task.id} 
                                  className="flex items-center justify-between group/item p-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onTaskNameChange(task.name);
                                      setIsDropdownOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-left transition-colors"
                                  >
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORIES.find(c => c.value === task.category)?.color }} />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{task.name}</span>
                                    </div>
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTemplate?.(task.id);
                                    }}
                                    className="h-8 w-8 text-foreground/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/item:opacity-100 transition-all rounded-lg mr-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Save Template Action - Integrated into Input already, but keeping a clean version here if needed */}
                  {/* Removing redundant save button below input */}

                  <Button 
                    onClick={() => onStart(taskName, category)}
                    disabled={isStartDisabled}
                    className="w-full h-16 text-lg font-bold tracking-tight bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 rounded-2xl transition-all shadow-xl shadow-[var(--brand-pink)]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="mr-3 w-5 h-5 fill-current" /> Start tracking
                  </Button>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
                      <p className="text-xs font-medium text-destructive text-center">{error}</p>
                      {(error.includes('relation "time_entries" does not exist') || error.includes('column') || error.includes('start_time')) && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 text-center">Database Setup Required</p>
                          <p className="text-[9px] text-muted-foreground leading-relaxed">
                            Please run this SQL in your <span className="text-foreground font-bold">Supabase SQL Editor</span> to fix the schema:
                          </p>
                          <pre className="p-3 bg-black/40 rounded-lg text-[9px] font-mono text-emerald-400 overflow-x-auto border border-white/5 select-all">
{`drop table if exists time_entries;
create table time_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_name text not null,
  category text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  duration integer,
  created_at timestamptz default now()
);
alter table time_entries enable row level security;
create policy "Users can manage their own time entries"
  on time_entries for all using (auth.uid() = user_id);`}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-3">
                    <div className="text-2xl font-heading font-light tracking-tight">{taskName || 'Untitled Session'}</div>
                    <div className="flex justify-center">
                      <div className="flex items-center gap-3 px-4 py-1.5 bg-secondary/40 border border-border/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORIES.find(c => c.value === category)?.color }} />
                        {category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {isPaused ? (
                      <Button 
                        onClick={onResume}
                        variant="secondary"
                        className="flex-1 h-16 text-sm font-bold uppercase tracking-widest rounded-2xl bg-[var(--brand-pink)]/10 text-[var(--brand-pink)] hover:bg-[var(--brand-pink)]/20 transition-all active:scale-[0.98]"
                      >
                        <Play className="mr-2 w-4 h-4 fill-current" /> Resume
                      </Button>
                    ) : (
                      <Button 
                        onClick={onPause}
                        variant="secondary"
                        className="flex-1 h-16 text-sm font-bold uppercase tracking-widest rounded-2xl hover:bg-secondary/80 transition-all active:scale-[0.98]"
                      >
                        <Pause className="mr-2 w-4 h-4 fill-current" /> Pause
                      </Button>
                    )}
                    <Button 
                      onClick={onStop}
                      variant="destructive"
                      className="flex-1 h-16 text-sm font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-destructive/10 active:scale-[0.98]"
                    >
                      <Square className="mr-2 w-4 h-4 fill-current" /> Finish
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-12 flex items-center gap-8 opacity-20">
        <div className="h-px w-24 bg-foreground" />
        <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-foreground">Focus Mode Active</div>
        <div className="h-px w-24 bg-foreground" />
      </div>
    </div>
  );
}

