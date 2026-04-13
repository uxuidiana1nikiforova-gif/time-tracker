import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Clock, Sparkles, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isRecovery, setIsRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check for errors or recovery mode in URL
  React.useEffect(() => {
    const hash = window.location.hash;
    
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      
      // Check for errors
      if (hash.includes('error=')) {
        const errorDescription = params.get('error_description');
        if (errorDescription) {
          setError(errorDescription.replace(/\+/g, ' '));
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      
      // Check for recovery mode
      if (params.get('type') === 'recovery') {
        setIsRecovery(true);
        setSuccess('Please enter your new password below.');
      }
    }
  }, []);

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
      if (isRecovery) {
        // Handle password update
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess('Password updated successfully! You can now sign in.');
        setIsRecovery(false);
        setView('signin');
        setPassword('');
      } else if (view === 'forgot') {
        // Handle password reset request
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess('Password reset link sent! Check your inbox.');
      } else if (view === 'signup') {
        console.log('Attempting Sign Up for:', email);
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Try signing in instead.');
          }
          throw error;
        }
        
        if (data?.user && data?.session) {
          setSuccess('Account created and signed in!');
        } else {
          setSuccess('Check your email for the confirmation link!');
        }
      } else {
        console.log('Attempting Sign In for:', email);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Account not found or incorrect password. Please sign up if you are new.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Account not found or email not confirmed. Please sign up to create your account.');
          }
          throw error;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isRecovery) return 'New Password';
    if (view === 'signup') return 'Create Account';
    if (view === 'forgot') return 'Reset Password';
    return 'Welcome Back';
  };

  const getButtonText = () => {
    if (loading) return <Loader2 className="w-6 h-6 animate-spin" />;
    if (isRecovery) return 'Update password';
    if (view === 'signup') return 'Sign up';
    if (view === 'forgot') return 'Send reset link';
    return 'Sign in';
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
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 flex items-center justify-center relative group"
            >
              <img 
                src="/logo_tracker_new2.svg" 
                alt="Logo" 
                className="w-16 h-16 relative z-10" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
          <CardTitle className="font-heading text-4xl font-light tracking-tight">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-muted-foreground/60 uppercase tracking-[0.2em] text-[10px] font-bold">
            Chronos Time Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              {!isRecovery && (
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-secondary/30 border-border/20 focus-visible:ring-[var(--brand-pink)]/20 pl-11 rounded-2xl font-medium"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
              
              {(view !== 'forgot' || isRecovery) && (
                <div className="relative">
                  <Input
                    type="password"
                    placeholder={isRecovery ? "New Password" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-secondary/30 border-border/20 focus-visible:ring-[var(--brand-pink)]/20 pl-11 rounded-2xl font-medium"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {view === 'signin' && !isRecovery && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-[var(--brand-pink)] hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="space-y-3">
                <p className="text-destructive text-xs font-medium text-center bg-destructive/10 py-3 px-4 rounded-xl border border-destructive/20">
                  {error}
                </p>
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
              className="w-full h-16 text-lg font-bold tracking-tight bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 rounded-2xl transition-all shadow-xl shadow-[var(--brand-pink)]/20 active:scale-[0.98]"
            >
              {getButtonText()}
            </Button>

            <div className="text-center space-y-4">
              {view === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-[var(--brand-pink)] hover:underline transition-colors"
                >
                  Back to Sign In
                </button>
              ) : !isRecovery && (
                <button
                  type="button"
                  onClick={() => {
                    setView(view === 'signup' ? 'signin' : 'signup');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all group"
                >
                  {view === 'signup' ? (
                    <>
                      Already have an account? <span className="text-[var(--brand-pink)] group-hover:underline">Sign In</span>
                    </>
                  ) : (
                    <>
                      Don't have an account? <span className="text-[var(--brand-pink)] group-hover:underline">Sign Up</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
