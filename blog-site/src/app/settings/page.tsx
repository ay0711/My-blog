'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiBell, FiMail, FiHeart, FiMessageCircle, FiRepeat, FiUserPlus, FiAtSign } from 'react-icons/fi';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';

interface NotificationSettings {
  emailNotifications: {
    enabled: boolean;
    likes: boolean;
    comments: boolean;
    reposts: boolean;
    follows: boolean;
    mentions: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    likes: boolean;
    comments: boolean;
    reposts: boolean;
    follows: boolean;
    mentions: boolean;
  };
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: {
      enabled: true,
      likes: true,
      comments: true,
      reposts: true,
      follows: true,
      mentions: true,
    },
    pushNotifications: {
      enabled: true,
      likes: true,
      comments: true,
      reposts: true,
      follows: true,
      mentions: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadSettings();
  }, [user, authLoading, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJSON<{ settings: NotificationSettings }>('/api/users/me/settings');
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await loadSettings();
    setRetrying(false);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await fetchJSON('/api/users/me/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleEmailEnabled = () => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        enabled: !prev.emailNotifications.enabled,
      },
    }));
  };

  const togglePushEnabled = () => {
    setSettings(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        enabled: !prev.pushNotifications.enabled,
      },
    }));
  };

  const toggleEmailSetting = (key: keyof Omit<NotificationSettings['emailNotifications'], 'enabled'>) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key],
      },
    }));
  };

  const togglePushSetting = (key: keyof Omit<NotificationSettings['pushNotifications'], 'enabled'>) => {
    setSettings(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [key]: !prev.pushNotifications[key],
      },
    }));
  };

  if (authLoading || !user) {
    return <LoadingSpinner fullScreen message="Loading settings..." />;
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorState 
            title="Failed to Load Settings"
            message={error}
            onRetry={handleRetry}
            retrying={retrying}
            type={error.includes('waking') || error.includes('timeout') ? 'timeout' : 'network'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 mb-2">
            <FiSettings className="w-8 h-8" />
            Notification Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage how you receive notifications about activity on your account
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FiMail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Email Notifications
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleEmailEnabled}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.emailNotifications.enabled
                      ? 'bg-indigo-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.emailNotifications.enabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {settings.emailNotifications.enabled && (
                <div className="space-y-4 pl-9">
                  <SettingItem
                    icon={<FiHeart className="w-5 h-5 text-red-500" />}
                    label="Likes"
                    description="When someone likes your post"
                    checked={settings.emailNotifications.likes}
                    onChange={() => toggleEmailSetting('likes')}
                  />
                  <SettingItem
                    icon={<FiMessageCircle className="w-5 h-5 text-blue-500" />}
                    label="Comments"
                    description="When someone comments on your post"
                    checked={settings.emailNotifications.comments}
                    onChange={() => toggleEmailSetting('comments')}
                  />
                  <SettingItem
                    icon={<FiRepeat className="w-5 h-5 text-green-500" />}
                    label="Reposts"
                    description="When someone reposts your content"
                    checked={settings.emailNotifications.reposts}
                    onChange={() => toggleEmailSetting('reposts')}
                  />
                  <SettingItem
                    icon={<FiUserPlus className="w-5 h-5 text-purple-500" />}
                    label="Follows"
                    description="When someone follows you"
                    checked={settings.emailNotifications.follows}
                    onChange={() => toggleEmailSetting('follows')}
                  />
                  <SettingItem
                    icon={<FiAtSign className="w-5 h-5 text-orange-500" />}
                    label="Mentions"
                    description="When someone mentions you"
                    checked={settings.emailNotifications.mentions}
                    onChange={() => toggleEmailSetting('mentions')}
                  />
                </div>
              )}
            </motion.div>

            {/* Push Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FiBell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      In-App Notifications
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications in the app
                    </p>
                  </div>
                </div>
                <button
                  onClick={togglePushEnabled}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.pushNotifications.enabled
                      ? 'bg-indigo-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.pushNotifications.enabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {settings.pushNotifications.enabled && (
                <div className="space-y-4 pl-9">
                  <SettingItem
                    icon={<FiHeart className="w-5 h-5 text-red-500" />}
                    label="Likes"
                    description="When someone likes your post"
                    checked={settings.pushNotifications.likes}
                    onChange={() => togglePushSetting('likes')}
                  />
                  <SettingItem
                    icon={<FiMessageCircle className="w-5 h-5 text-blue-500" />}
                    label="Comments"
                    description="When someone comments on your post"
                    checked={settings.pushNotifications.comments}
                    onChange={() => togglePushSetting('comments')}
                  />
                  <SettingItem
                    icon={<FiRepeat className="w-5 h-5 text-green-500" />}
                    label="Reposts"
                    description="When someone reposts your content"
                    checked={settings.pushNotifications.reposts}
                    onChange={() => togglePushSetting('reposts')}
                  />
                  <SettingItem
                    icon={<FiUserPlus className="w-5 h-5 text-purple-500" />}
                    label="Follows"
                    description="When someone follows you"
                    checked={settings.pushNotifications.follows}
                    onChange={() => togglePushSetting('follows')}
                  />
                  <SettingItem
                    icon={<FiAtSign className="w-5 h-5 text-orange-500" />}
                    label="Mentions"
                    description="When someone mentions you"
                    checked={settings.pushNotifications.mentions}
                    onChange={() => togglePushSetting('mentions')}
                  />
                </div>
              )}
            </motion.div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
              {message && (
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm font-medium ${
                    message.type === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {message.text}
                </motion.p>
              )}
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for individual settings
function SettingItem({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  );
}
