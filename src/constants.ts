import { Category } from './types';

export const CATEGORIES: { label: string; value: Category; color: string }[] = [
  { label: 'Work (Design / Figma)', value: 'Work', color: '#3b82f6' }, // blue
  { label: 'Learning (English / courses)', value: 'Learning', color: '#10b981' }, // emerald
  { label: 'Meetings', value: 'Meetings', color: '#8b5cf6' }, // violet
];

export const STORAGE_KEYS = {
  SESSIONS: 'chronos_sessions',
  TIMER_STATE: 'chronos_timer_state',
};
