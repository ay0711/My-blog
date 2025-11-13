'use client';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiRefreshCw, FiWifi } from 'react-icons/fi';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  type?: 'error' | 'timeout' | 'network';
}

export default function ErrorState({ 
  message, 
  onRetry,
  type = 'error'
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'timeout':
        return <FiRefreshCw className="w-16 h-16 text-yellow-500" />;
      case 'network':
        return <FiWifi className="w-16 h-16 text-red-500" />;
      default:
        return <FiAlertCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'timeout':
        return 'Server is Waking Up';
      case 'network':
        return 'Connection Error';
      default:
        return 'Something Went Wrong';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'timeout':
        return 'Our server is waking up from sleep mode. This usually takes 30-60 seconds on the first request.';
      case 'network':
        return 'Please check your internet connection and try again.';
      default:
        return message || 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      <motion.div
        animate={{ rotate: type === 'timeout' ? 360 : 0 }}
        transition={{ duration: 2, repeat: type === 'timeout' ? Infinity : 0, ease: 'linear' }}
      >
        {getIcon()}
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">
        {getTitle()}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {message || getDefaultMessage()}
      </p>

      {type === 'timeout' && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 <strong>Tip:</strong> Free hosting services sleep after inactivity. 
            The first request wakes them up and may take up to a minute.
          </p>
        </div>
      )}

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <FiRefreshCw className="w-5 h-5" />
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
}
