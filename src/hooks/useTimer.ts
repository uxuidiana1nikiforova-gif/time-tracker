import { useState, useEffect, useCallback } from 'react';
import { TimerState, Session, Category } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants';

export function useTimer() {
  const [sessions, setSessions] = useLocalStorage<Session[]>(STORAGE_KEYS.SESSIONS, []);
  const [timerState, setTimerState] = useLocalStorage<TimerState>(STORAGE_KEYS.TIMER_STATE, {
    isActive: false,
    isPaused: false,
    startTime: null,
    pauseTime: null,
    totalPausedTime: 0,
    taskName: '',
    category: 'Work',
  });

  const [elapsed, setElapsed] = useState(0);

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

  const startTimer = useCallback((taskName: string, category: Category) => {
    setTimerState({
      isActive: true,
      isPaused: false,
      startTime: Date.now(),
      pauseTime: null,
      totalPausedTime: 0,
      taskName,
      category,
    });
  }, [setTimerState]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
      pauseTime: Date.now(),
    }));
  }, [setTimerState]);

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
  }, [setTimerState]);

  const stopTimer = useCallback(() => {
    if (timerState.startTime) {
      const endTime = Date.now();
      const duration = elapsed;
      
      const newSession: Session = {
        id: crypto.randomUUID(),
        taskName: timerState.taskName || 'Untitled Task',
        category: timerState.category,
        startTime: timerState.startTime,
        endTime,
        duration,
      };

      setSessions(prev => [newSession, ...prev]);
    }

    setTimerState({
      isActive: false,
      isPaused: false,
      startTime: null,
      pauseTime: null,
      totalPausedTime: 0,
      taskName: '',
      category: 'Work',
    });
    setElapsed(0);
  }, [timerState, elapsed, setSessions, setTimerState]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [setSessions]);

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
  };
}
