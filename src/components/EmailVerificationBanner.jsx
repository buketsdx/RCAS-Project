
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // If user is not logged in or email is already confirmed, don't show
  if (!user || user.email_confirmed_at) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      toast.success("Verification email sent!");
    } catch (error) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">
            Your email address ({user.email}) is not verified. Please check your inbox.
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResend} 
          disabled={loading}
          className="bg-white dark:bg-slate-900 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900"
        >
          {loading ? "Sending..." : (
            <>
              <Send className="mr-2 h-3 w-3" />
              Resend Verification
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
