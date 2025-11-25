import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import wolfLogo from '@/assets/wolf-logo.jpg';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account.',
      });

      // Optionally navigate after signup
      // navigate('/');
    } catch (error: any) {
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <StarfieldBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg overflow-hidden shadow-premium border-2 border-white/30 mb-4 bg-black/60 backdrop-blur-sm">
            <img src={wolfLogo} alt="WOLF AI Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-display mb-2">
            WOLF AI
          </h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Expert Wingo Predictions
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-premium p-8 animate-fade-in">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-gradient-premium data-[state=active]:text-black font-semibold"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-gradient-premium data-[state=active]:text-black font-semibold"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-premium text-black hover:shadow-glow border border-white/30 font-semibold transition-all hover:scale-105 h-11"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-black/60 border-white/20 text-white placeholder:text-muted-foreground focus:border-white/50"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-premium text-black hover:shadow-glow border border-white/30 font-semibold transition-all hover:scale-105 h-11"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

            </TabsContent>
          </Tabs>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-white hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-white hover:underline">Privacy Policy</a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 WOLF AI. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Auth;
