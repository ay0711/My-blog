'use client';
import { useState } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { fetchWithFallback } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
  onBookmarkChange?: (bookmarked: boolean) => void;
  showText?: boolean;
}

export default function BookmarkButton({ 
  postId, 
  initialBookmarked = false,
  onBookmarkChange,
  showText = false
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithFallback(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        const newBookmarked = data.bookmarked;
        setBookmarked(newBookmarked);
        
        if (onBookmarkChange) {
          onBookmarkChange(newBookmarked);
        }
      } else {
        console.error('Failed to bookmark:', data.message);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={loading}
      className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
        bookmarked
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <FiBookmark className={bookmarked ? 'fill-current' : ''} />
      )}
      {showText && <span className="text-sm">{bookmarked ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
