import Image from 'next/image';

type PostShort = {
  id: string;
  title: string;
  likes?: number;
  createdAt?: string;
  featuredImage?: string;
};

export default function Trending({ posts }: { posts: PostShort[] }) {
  return (
    <div className="bg-white dark:bg-[#0f1329] border border-indigo-100 dark:border-[#1b2150] rounded-lg shadow-sm p-4">
      <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Trending</h4>
      <ol className="space-y-3">
        {posts && posts.length > 0 ? posts.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <div className="text-sm font-medium text-indigo-600 w-6">{i + 1}.</div>
            <a href={`/posts/${p.id}`} className="flex items-center gap-3 w-full hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition">
              <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={p.featuredImage || `https://picsum.photos/seed/${p.id}/80/60`}
                  alt={p.title}
                  width={80}
                  height={60}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="text-sm flex-1 min-w-0">
                <div className="font-medium truncate text-gray-800 dark:text-gray-100">{p.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{p.likes || 0} likes</div>
              </div>
            </a>
          </li>
        )) : (
          <li className="text-sm text-gray-500">No trending posts yet</li>
        )}
      </ol>
    </div>
  );
}
