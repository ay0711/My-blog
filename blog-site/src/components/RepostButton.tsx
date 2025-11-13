'use client';
import { useState } from 'react';
import { FiRepeat } from 'react-icons/fi';
import { fetchWithFallback } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface RepostButtonProps {
  postId: string;
  initialReposted?: boolean;
  initialCount?: number;
  onRepostChange?: (reposted: boolean, count: number) => void;
}

export default function RepostButton({ 
  postId, 
  initialReposted = false, 
  initialCount = 0,
  onRepostChange 
}: RepostButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithFallback(`/api/posts/${postId}/repost`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        const newReposted = data.reposted;
        const newCount = newReposted ? count + 1 : Math.max(0, count - 1);
        
        setReposted(newReposted);
        setCount(newCount);
        
        if (onRepostChange) {
          onRepostChange(newReposted, newCount);
        }
      } else {
        console.error('Failed to repost:', data.message);
      }
    } catch (err) {
      console.error('Repost error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRepost}
      disabled={loading}
      className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
        reposted
          ? 'text-green-600 dark:text-green-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
      }`}
      title={reposted ? 'Undo repost' : 'Repost'}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <FiRepeat className={reposted ? 'animate-pulse' : ''} />
      )}
      <span className="text-sm">{count || 0}</span>
    </button>
  );
}
