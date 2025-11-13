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
    let lastErr: unknown = null;
    
    for (const base of bases) {
        try {
            // Ensure cookies are sent/received for cross-origin auth (session cookie)
            const mergedInit: RequestInit = { 
                credentials: 'include', 
                ...init,
                // Add timeout to detect slow/inactive backend
                signal: init?.signal || AbortSignal.timeout(15000) // 15 second timeout
            };
            const res = await fetch(`${base}${path}`, mergedInit);
            if (res.ok) return res;
            lastErr = new Error(`HTTP ${res.status} from ${base}${path}`);
        } catch (e: unknown) {
            // Check if it's a timeout or network error
            if (e instanceof Error) {
                if (e.name === 'TimeoutError' || e.name === 'AbortError') {
                    lastErr = new Error('Backend server is taking too long to respond. It might be waking up from sleep mode. Please try again in a moment.');
                } else if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
                    lastErr = new Error('Unable to connect to the server. Please check your internet connection or try again later.');
                } else {
                    lastErr = e;
                }
            } else {
                lastErr = e;
            }
        }
    }
    if (lastErr instanceof Error) throw lastErr;
    throw new Error(String(lastErr ?? 'All API bases failed'));
}

export async function fetchJSON<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetchWithFallback(path, init);
    // Handle 204 No Content responses (e.g., logout)
    if (res.status === 204) {
        return {} as T;
    }
    return res.json();
}
