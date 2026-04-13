import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Session, Category, TimerState } from '../types';

export function useSupabaseTimer(userId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [savedTasks, setSavedTasks] = useState<{ id: string; name: string; category: Category }[]>([]);
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
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch saved tasks
        const { data: savedData, error: savedError } = await supabase
          .from('saved_tasks')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (!savedError && savedData) {
          setSavedTasks(savedData.map(d => ({
            id: d.id,
            name: d.name,
            category: d.category as Category
          })));
        }

        // Fetch sessions from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const { data: sessionsData, error: sessionsError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', thirtyDaysAgo.toISOString())
          .order('start_time', { ascending: false });

        if (sessionsError) throw sessionsError;

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
            isPaused: false,
            startTime: active.startTime,
            pauseTime: null,
            totalPausedTime: 0,
            taskName: active.taskName,
            category: active.category,
          });
        }
      } catch (err: any) {
        console.error('Error fetching sessions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const saveTaskTemplate = useCallback(async (name: string, category: Category) => {
    if (!userId || !name) return;
    try {
      const { data, error } = await supabase
        .from('saved_tasks')
        .insert({ user_id: userId, name, category })
        .select()
        .single();
      
      if (error) throw error;
      setSavedTasks(prev => [...prev, { id: data.id, name: data.name, category: data.category as Category }]);
    } catch (err: any) {
      console.error('Error saving task template:', err);
      setError(err.message);
    }
  }, [userId]);

  const deleteSavedTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('saved_tasks').delete().eq('id', id);
      if (error) throw error;
      setSavedTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting saved task:', err);
      setError(err.message);
    }
  }, []);

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
    console.log('Attempting to start timer:', { taskName, category, userId });
    if (!userId) {
      console.error('Cannot start timer: No userId found');
      setError('User not authenticated');
      return;
    }
    setError(null);

    try {
      const startTime = new Date();
      console.log('Inserting into Supabase...');
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
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Timer started successfully:', data);
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
    } catch (err: any) {
      console.error('Error starting timer:', err);
      setError(err.message);
    }
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
    savedTasks,
    saveTaskTemplate,
    deleteSavedTask,
    loading,
    error,
  };
}
