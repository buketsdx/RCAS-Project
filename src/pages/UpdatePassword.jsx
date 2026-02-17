import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLogo from '@/components/ui/AppLogo';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    // Check for errors in the URL hash (Supabase returns errors like #error=access_denied&error_code=otp_expired)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const error = params.get('error');
      const error_description = params.get('error_description');
      
      if (error) {
        console.error("Supabase Auth Error from URL:", error, error_description);
        setErrorMsg(error_description || "Invalid or expired password reset link.");
        return; // Don't check session if we already have an error
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.log("No session found in UpdatePassword");
        // Only set error if we didn't find one in the hash already
        if (!hash.includes('error=')) {
           // Wait a bit, sometimes session restoration takes a moment.
           // But if it's truly empty, the user might have come here directly without a link.
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in UpdatePassword:", event, session);
      if (event === 'PASSWORD_RECOVERY') {
         setErrorMsg(null); // Clear errors if recovery flow starts successfully
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const evaluatePasswordStrength = (value) => {
    if (!value) return null;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 1) return { label: "Weak", color: "bg-red-500/10 text-red-600 dark:text-red-400" };
    if (score === 2) return { label: "Medium", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    return { label: "Strong", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      navigate('/login');
    } catch (error) {
      console.error("Update password error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md space-y-8 text-center">
            <AppLogo size="lg" className="mb-4 mx-auto" />
            <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Link Expired or Invalid</h3>
                <p className="mb-4">{errorMsg.replace(/\+/g, ' ')}</p>
                <Button onClick={() => navigate('/forgot-password')} variant="destructive">
                    Request New Link
                </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AppLogo size="lg" className="mb-4" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Set New Password
          </h2>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle>New Password</CardTitle>
            <CardDescription>
              Please enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register('password', {
                      onChange: (e) => {
                        const value = e.target.value;
                        const result = evaluatePasswordStrength(value);
                        setPasswordStrength(result);
                      }
                    })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${passwordStrength.color}`}>
                      Password strength: {passwordStrength.label}
                    </span>
                    <span className="text-slate-400 hidden md:inline">
                      Use 8+ chars, mix letters, numbers, symbols
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
