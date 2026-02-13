type FetchOptions = RequestInit & {
    skipAuth?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // sends httpOnly cookie
        });
        if (!res.ok) return null;
        const data = await res.json();
        accessToken = data.accessToken;
        return accessToken;
    } catch {
        return null;
    }
}

export async function api<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((customHeaders as Record<string, string>) || {}),
    };

    if (!skipAuth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let res = await fetch(`${API_URL}${endpoint}`, {
        ...rest,
        headers,
        credentials: 'include',
    });

    // If 401 and we have auth, try refreshing
    if (res.status === 401 && !skipAuth) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${API_URL}${endpoint}`, {
                ...rest,
                headers,
                credentials: 'include',
            });
        }
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
}