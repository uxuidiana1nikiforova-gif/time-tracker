import React from 'react';
import { Session } from '../types';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CATEGORIES } from '../constants';
import { Clock, Calendar as CalendarIcon, Trash2, History } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface HistoryListProps {
  sessions: Session[];
  onDelete: (id: string) => void;
}

export function HistoryList({ sessions, onDelete }: HistoryListProps) {
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h3 className="font-heading text-2xl font-light tracking-tight">Activity Log</h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">Historical Data</p>
        </div>
        <Badge variant="secondary" className="bg-secondary/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none">
          {sessions.length} Sessions
        </Badge>
      </div>
      
      <ScrollArea className="h-[600px] pr-6">
        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <motion.div 
                key={session.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-card/20 hover:bg-card/40 border border-border/20 rounded-2xl transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center text-foreground/60 group-hover:text-primary transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-2xl font-light tracking-tight text-primary">
                        {session.category}
                      </span>
                      <div 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: CATEGORIES.find(c => c.value === session.category)?.color }} 
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-foreground/80">
                        {session.taskName || 'Untitled Session'}
                      </p>
                      
                      <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/40">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(session.startTime), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {format(new Date(session.startTime), 'HH:mm')} — {format(new Date(session.endTime), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0 flex items-center gap-8">
                  <div className="text-2xl font-heading font-light text-primary/60 tabular-nums">
                    {formatDuration(session.duration)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(session.id)}
                    className="h-10 w-10 text-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-foreground/30 space-y-6">
              <div className="w-16 h-16 rounded-full border border-dashed border-border/40 flex items-center justify-center">
                <History className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.3em]">No activity recorded</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

