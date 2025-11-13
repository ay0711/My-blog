export const getApiBases = (): string[] => {
    const list = (process.env.NEXT_PUBLIC_API_URLS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const single = process.env.NEXT_PUBLIC_API_URL?.trim();
    const bases = [...list];
    if (single && !bases.includes(single)) bases.push(single);
    if (bases.length === 0) {
        throw new Error('No API base configured. Set NEXT_PUBLIC_API_URLS or NEXT_PUBLIC_API_URL.');
    }
    // normalize by removing trailing slashes
    return bases.map((b) => b.replace(/\/+$/, ''));
};

export async function fetchWithFallback(path: string, init?: RequestInit): Promise<Response> {
    if (!path.startsWith('/')) {
        throw new Error(`fetchWithFallback expects a path starting with '/': received ${path}`);
    }
    const bases = getApiBases();
    let lastErr: any = null;
    for (const base of bases) {
        try {
            // Ensure cookies are sent/received for cross-origin auth (session cookie)
            const mergedInit: RequestInit = { credentials: 'include', ...init };
            const res = await fetch(`${base}${path}`, mergedInit);
            if (res.ok) return res;
            lastErr = new Error(`HTTP ${res.status} from ${base}${path}`);
        } catch (e: any) {
            lastErr = e;
        }
    }
    throw lastErr || new Error('All API bases failed');
}

export async function fetchJSON<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetchWithFallback(path, init);
    return res.json();
}
