'use client';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center"
    >
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
        First load may take 30-60 seconds if server is sleeping
      </p>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
