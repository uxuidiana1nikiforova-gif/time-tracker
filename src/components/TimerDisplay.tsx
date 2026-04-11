import React from 'react';
import { Play, Pause, Square, Tag } from 'lucide-react';
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
}: TimerDisplayProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-3xl border-none bg-card/40 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2rem]">
        <CardContent className="p-12 md:p-20">
          <div className="flex flex-col items-center space-y-12">
            {/* Timer Display */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute -inset-12 bg-primary/2 rounded-full blur-[100px] group-hover:bg-primary/5 transition-all duration-1000" />
              {isActive && !isPaused && (
                <div className="absolute -inset-24 bg-[var(--brand-pink)]/5 rounded-full blur-[120px] animate-pulse" />
              )}
              
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="h-1 w-12 bg-primary/20 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Chronometer</span>
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
                  className="flex items-center gap-2 mt-4"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isPaused ? 'Paused' : 'Recording'}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full max-w-md space-y-8">
              {!isActive ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        placeholder="Task Name"
                        value={taskName}
                        onChange={(e) => onTaskNameChange(e.target.value)}
                        className="h-14 bg-secondary/30 border-border/20 focus-visible:ring-primary/20 pl-11 rounded-2xl font-medium placeholder:text-muted-foreground/40"
                      />
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <Select value={category} onValueChange={(v) => onCategoryChange(v as Category)}>
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
                  <Button 
                    onClick={() => onStart(taskName, category)}
                    className="w-full h-16 text-lg font-bold uppercase tracking-widest bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 rounded-2xl transition-all shadow-xl shadow-[var(--brand-pink)]/20 active:scale-[0.98]"
                  >
                    <Play className="mr-3 w-5 h-5 fill-current" /> Start Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-3">
                    <div className="text-2xl font-heading font-light tracking-tight">{taskName || 'Untitled Session'}</div>
                    <div className="flex justify-center">
                      <div className="flex items-center gap-3 px-4 py-1.5 bg-secondary/40 border border-border/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
        <div className="text-[10px] font-bold uppercase tracking-[0.5em]">Focus Mode Active</div>
        <div className="h-px w-24 bg-foreground" />
      </div>
    </div>
  );
}

