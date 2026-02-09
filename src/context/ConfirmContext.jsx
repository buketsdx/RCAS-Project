import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dailog";

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    variant: 'default', // default or destructive
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback(({ 
    title = 'Are you sure?', 
    description = 'This action cannot be undone.', 
    confirmText = 'Continue', 
    cancelText = 'Cancel',
    variant = 'default' 
  }) => {
    return new Promise((resolve) => {
      setConfig({
        title,
        description,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          setOpen(false);
          resolve(true);
        },
        onCancel: () => {
          setOpen(false);
          resolve(false);
        },
      });
      setOpen(true);
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {config.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={config.onCancel}>{config.cancelText}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={config.onConfirm}
              className={config.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {config.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
