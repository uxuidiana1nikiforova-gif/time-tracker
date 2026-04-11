export type Category = 'Work' | 'Learning' | 'Meetings';

export interface Session {
  id: string;
  taskName: string;
  category: Category;
  startTime: number; // timestamp
  endTime: number; // timestamp
  duration: number; // seconds
}

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalPausedTime: number;
  taskName: string;
  category: Category;
}
