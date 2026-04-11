import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Session, Category, TimerState } from '../types';

export function useSupabaseTimer(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    startTime: null,
    pauseTime: null,
    totalPausedTime: 0,
    taskName: '',
    category: 'Work',
  });
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else {
        const formattedSessions: Session[] = sessionsData.map(d => ({
          id: d.id,
          taskName: d.task_name,
          category: d.category as Category,
          startTime: new Date(d.start_time).getTime(),
          endTime: d.end_time ? new Date(d.end_time).getTime() : null,
          duration: d.duration || 0,
        }));
        setSessions(formattedSessions);

        // Check for active timer (end_time is null)
        const active = formattedSessions.find(s => s.endTime === null);
        if (active) {
          setActiveEntryId(active.id);
          setTimerState({
            isActive: true,
            isPaused: false, // Supabase doesn't natively store pause state easily without more fields, keeping it simple
            startTime: active.startTime,
            pauseTime: null,
            totalPausedTime: 0,
            taskName: active.taskName,
            category: active.category,
          });
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // Timer tick
  useEffect(() => {
    let interval: number | undefined;

    if (timerState.isActive && !timerState.isPaused && timerState.startTime) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const currentElapsed = Math.floor((now - timerState.startTime! - timerState.totalPausedTime) / 1000);
        setElapsed(currentElapsed);
      }, 1000);
    } else if (timerState.isActive && timerState.isPaused && timerState.startTime && timerState.pauseTime) {
      const currentElapsed = Math.floor((timerState.pauseTime - timerState.startTime - timerState.totalPausedTime) / 1000);
      setElapsed(currentElapsed);
    } else {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState]);

  const startTimer = useCallback(async (taskName: string, category: Category) => {
    if (!userId) return;

    const startTime = new Date();
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        task_name: taskName || 'Untitled Task',
        category,
        start_time: startTime.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting timer:', error);
      return;
    }

    setActiveEntryId(data.id);
    setTimerState({
      isActive: true,
      isPaused: false,
      startTime: startTime.getTime(),
      pauseTime: null,
      totalPausedTime: 0,
      taskName,
      category,
    });

    // Add to local list
    const newSession: Session = {
      id: data.id,
      taskName: data.task_name,
      category: data.category as Category,
      startTime: startTime.getTime(),
      endTime: null,
      duration: 0,
    };
    setSessions(prev => [newSession, ...prev]);
  }, [userId]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
      pauseTime: Date.now(),
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState(prev => {
      if (!prev.pauseTime) return prev;
      const pausedDuration = Date.now() - prev.pauseTime;
      return {
        ...prev,
        isPaused: false,
        pauseTime: null,
        totalPausedTime: prev.totalPausedTime + pausedDuration,
      };
    });
  }, []);

  const stopTimer = useCallback(async () => {
    if (!activeEntryId || !userId) return;

    const endTime = new Date();
    const duration = elapsed;

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: endTime.toISOString(),
        duration,
      })
      .eq('id', activeEntryId);

    if (error) {
      console.error('Error stopping timer:', error);
      return;
    }

    setSessions(prev => prev.map(s => 
      s.id === activeEntryId 
        ? { ...s, endTime: endTime.getTime(), duration } 
        : s
    ));

    setTimerState({
      isActive: false,
      isPaused: false,
      startTime: null,
      pauseTime: null,
      totalPausedTime: 0,
      taskName: '',
      category: 'Work',
    });
    setActiveEntryId(null);
    setElapsed(0);
  }, [activeEntryId, userId, elapsed]);

  const deleteSession = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    timerState,
    elapsed,
    sessions,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    deleteSession,
    setTimerState,
    loading,
  };
}
