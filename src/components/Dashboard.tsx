import React from 'react';
import { Session, Category } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CATEGORIES } from '../constants';
import { Clock, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  format, 
  startOfToday, 
  startOfWeek, 
  startOfMonth, 
  isWithinInterval, 
  endOfToday, 
  endOfWeek, 
  endOfMonth,
  differenceInCalendarDays
} from 'date-fns';

interface DashboardProps {
  sessions: Session[];
  activeElapsed?: number;
  activeCategory?: Category;
}

export function Dashboard({ sessions, activeElapsed = 0, activeCategory }: DashboardProps) {
  const now = new Date();
  const today = startOfToday();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const calculateTotal = (interval: { start: Date; end: Date }) => {
    let total = sessions
      .filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= interval.start && sessionDate <= interval.end;
      })
      .reduce((acc, s) => acc + s.duration, 0);
    
    // Include active session if it falls within the interval
    if (activeElapsed > 0 && activeCategory) {
      if (now >= interval.start && now <= interval.end) {
        total += activeElapsed;
      }
    }
    
    return total;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const totalWeek = calculateTotal({ start: weekStart, end: endOfWeek(now, { weekStartsOn: 1 }) });
  const totalMonth = calculateTotal({ start: monthStart, end: endOfMonth(now) });

  const getActiveDaysCount = (interval: { start: Date; end: Date }) => {
    const activeDays = new Set<string>();
    
    sessions.forEach(s => {
      const sessionDate = new Date(s.startTime);
      if (sessionDate >= interval.start && sessionDate <= interval.end) {
        activeDays.add(format(sessionDate, 'yyyy-MM-dd'));
      }
    });

    // Count today as active if there is an ongoing session
    if (activeElapsed > 0 && activeCategory) {
      if (now >= interval.start && now <= interval.end) {
        activeDays.add(format(now, 'yyyy-MM-dd'));
      }
    }

    return Math.max(1, activeDays.size);
  };

  const activeDaysWeek = getActiveDaysCount({ start: weekStart, end: endOfWeek(now, { weekStartsOn: 1 }) });
  const activeDaysMonth = getActiveDaysCount({ start: monthStart, end: endOfMonth(now) });

  const stats = [
    { 
      label: 'Today', 
      value: formatDuration(calculateTotal({ start: today, end: endOfToday() })), 
      icon: Clock 
    },
    { 
      label: 'This Week', 
      value: formatDuration(totalWeek), 
      average: formatDuration(totalWeek / activeDaysWeek),
      icon: CalendarIcon 
    },
    { 
      label: 'This Month', 
      value: formatDuration(totalMonth), 
      average: formatDuration(totalMonth / activeDaysMonth),
      icon: CalendarIcon 
    },
  ];

  const categoryData = CATEGORIES.map(cat => {
    let value = sessions
      .filter(s => s.category === cat.value)
      .reduce((acc, s) => acc + s.duration, 0);
    
    if (activeCategory === cat.value) {
      value += activeElapsed;
    }

    return {
      name: cat.value,
      value: Math.round(value / 60), // in minutes
      color: cat.color
    };
  }).filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1">{payload[0].payload.name}</p>
          <p className="text-xl font-heading font-light">{payload[0].value} <span className="text-xs font-sans font-medium text-foreground/40">min</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none bg-card/30 backdrop-blur-sm group hover:bg-card/40 transition-all duration-500 rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-primary/20 group-hover:text-primary/40 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-heading font-light tracking-tight">{stat.value}</p>
                {stat.average && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary/40">Avg</span>
                    <span className="text-xs font-medium text-foreground/40">{stat.average}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none bg-card/20 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="font-heading text-2xl font-light tracking-tight">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] px-4 pb-8">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 40, top: 20, bottom: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-foreground/30 space-y-4">
                <div className="w-12 h-12 rounded-full border border-dashed border-border/40 flex items-center justify-center">
                  <Clock className="w-5 h-5 opacity-20" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Awaiting session data</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-[var(--brand-pink)]/5 backdrop-blur-sm rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-32 h-32 text-[var(--brand-pink)]" />
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--brand-pink)]">Insights</div>
            <h3 className="font-heading text-3xl font-light leading-tight">Your focus is increasing.</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">You've spent 12% more time on <span className="text-foreground font-medium">Learning</span> this week compared to last.</p>
          </div>

          <div className="pt-8 border-t border-[var(--brand-pink)]/10 relative z-10">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-foreground/40">
              <span>Next Milestone</span>
              <span>80%</span>
            </div>
            <div className="mt-2 h-1 w-full bg-[var(--brand-pink)]/10 rounded-full overflow-hidden">
              <div className="h-full w-[80%] bg-[var(--brand-pink)] rounded-full" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

