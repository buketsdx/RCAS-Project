import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Play, Check, Lock } from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { Progress } from "@/components/ui/progress";

export const UpgradeDialog = ({ open, onOpenChange, featureName, triggerAction }) => {
  const { upgradeToPremium, unlockWithAd } = useSubscription();
  const [showAd, setShowAd] = useState(false);

  const handleWatchAd = () => {
    setShowAd(true);
  };

  const handleAdComplete = () => {
    setShowAd(false);
    unlockWithAd(triggerAction);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-6 w-6 text-amber-500 fill-amber-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>
              You've reached the free limit for {featureName}. Upgrade to unlock unlimited access.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-semibold mb-2 flex items-center">
                <Crown className="h-4 w-4 mr-2 text-amber-500" />
                Premium Benefits
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Unlimited Entries</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Advanced Analytics & Reports</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Export to Excel/PDF</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> No Ads</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { upgradeToPremium(); onOpenChange(false); }}>
              Upgrade Now (One-time $49)
            </Button>
            
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">OR</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleWatchAd}>
              <Play className="h-4 w-4 mr-2 text-blue-500" />
              Watch Ad to Continue (One-time)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdWatchDialog open={showAd} onOpenChange={setShowAd} onComplete={handleAdComplete} />
    </>
  );
};

export const AdWatchDialog = ({ open, onOpenChange, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (open) {
      setProgress(0);
      setCanSkip(false);
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setCanSkip(true);
            return 100;
          }
          return prev + 2; // 50 ticks * 60ms = 3 seconds approx
        });
      }, 60);
      return () => clearInterval(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !canSkip) return; onOpenChange(val); }}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Advertisement</DialogTitle>
          <DialogDescription>
            Please watch this short ad to continue...
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center flex-col gap-4">
           <div className="animate-bounce text-4xl">📺</div>
           <p className="text-muted-foreground">Best ERP Software for your Business!</p>
        </div>

        <div className="space-y-2">
           <Progress value={progress} className="h-2" />
           <p className="text-xs text-center text-muted-foreground">{canSkip ? 'Ad Completed' : 'Playing Ad...'}</p>
        </div>

        <DialogFooter>
          <Button disabled={!canSkip} onClick={onComplete} className="w-full">
            {canSkip ? 'Close & Continue' : `Wait ${Math.ceil((100 - progress) / 33)}s`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PremiumLock = ({ children, isLocked, featureName, triggerAction }) => {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!isLocked) return children;

  return (
    <div className="relative group">
      <div className="pointer-events-none opacity-50 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10 rounded-md">
        <Button size="sm" variant="secondary" className="shadow-lg gap-2" onClick={() => setShowUpgrade(true)}>
           <Lock className="h-3 w-3" />
           Unlock Premium
        </Button>
      </div>
      <UpgradeDialog 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade} 
        featureName={featureName}
        triggerAction={triggerAction}
      />
    </div>
  );
};
