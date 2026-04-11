import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Timer, Sparkles, Mail, Lock, Loader2 } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Secrets.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        
        if (data?.user && data?.session) {
          setSuccess('Account created and signed in!');
        } else {
          setSuccess('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[var(--brand-pink)]/5 rounded-full blur-[140px]" />
      </div>

      <Card className="w-full max-w-md border-none bg-card/40 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] relative z-10">
        <CardHeader className="space-y-4 text-center pt-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
              <Timer className="w-9 h-9 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-heading text-4xl font-light tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground/60 uppercase tracking-[0.2em] text-[10px] font-bold">
            Chronos Time Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          {!isConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-[10px] font-bold uppercase tracking-widest text-center">
              Supabase credentials missing in Settings &gt; Secrets
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-secondary/30 border-border/20 focus-visible:ring-[var(--brand-pink)]/20 pl-11 rounded-2xl font-medium"
                  required
                  disabled={!isConfigured}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-secondary/30 border-border/20 focus-visible:ring-[var(--brand-pink)]/20 pl-11 rounded-2xl font-medium"
                  required
                  disabled={!isConfigured}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              </div>
            </div>

            {error && (
              <div className="space-y-4">
                <p className="text-destructive text-xs font-medium text-center bg-destructive/10 py-3 px-4 rounded-xl border border-destructive/20">
                  {error}
                </p>
                {error.includes('Failed to fetch') && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 text-center">Troubleshooting</p>
                    <ul className="text-[9px] text-muted-foreground/80 space-y-1 list-disc pl-4">
                      <li>Check if <span className="text-foreground font-mono">VITE_SUPABASE_URL</span> is correct in Secrets.</li>
                      <li>Ensure the URL starts with <span className="text-foreground font-mono">https://</span></li>
                      <li>Check your internet connection or if Supabase is down.</li>
                      <li>Disable any ad-blockers that might block API calls.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {success && (
              <p className="text-emerald-500 text-xs font-medium text-center bg-emerald-500/10 py-3 px-4 rounded-xl border border-emerald-500/20">
                {success}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full h-16 text-lg font-bold uppercase tracking-widest bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 rounded-2xl transition-all shadow-xl shadow-[var(--brand-pink)]/20 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-[var(--brand-pink)] transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
