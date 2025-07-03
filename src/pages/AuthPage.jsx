import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { useToast } from "@/components/ui/use-toast";
import { Helmet } from 'react-helmet';

const SignInForm = () => {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        await signIn(email, password);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email-signin" className="text-slate-300">Email</Label>
                <Input id="email-signin" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password-signin" className="text-slate-300">Password</Label>
                <Input id="password-signin" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
            </Button>
        </form>
    );
};

const SignUpForm = () => {
    const { signUp } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signUp(email, password);
        if (!error) {
            toast({
                title: "Account created!",
                description: "Please check your email for a confirmation link.",
            });
            setEmail('');
            setPassword('');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-slate-300">Email</Label>
                <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-slate-300">Password</Label>
                <Input id="password-signup" type="password" placeholder="•••••••• (6+ characters)" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
            </Button>
        </form>
    );
};


const AuthPage = () => {
  return (
    <>
      <Helmet>
        <title>Login - Financify</title>
        <meta name="description" content="Login or create an account to manage your finances with Financify." />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
              <Logo />
          </div>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Card className="glassmorphism border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Welcome Back!</CardTitle>
                  <CardDescription className="text-slate-400">Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SignInForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card className="glassmorphism border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Create an Account</CardTitle>
                  <CardDescription className="text-slate-400">Enter your email and password to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SignUpForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AuthPage;