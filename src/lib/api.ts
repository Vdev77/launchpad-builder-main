const API_URL = '/api';

export const api = {
    auth: {
        register: async (email: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            return data;
        },
        login: async (email: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            return data;
        }
    },
    logging: {
        logVisitor: async (page_visited: string, referrer: string) => {
            try {
                // Gather extra details
                const language = navigator.language;
                const platform = navigator.platform;
                const screen_resolution = `${window.screen.width}x${window.screen.height}`;
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                // @ts-ignore
                const network_info = navigator.connection ? navigator.connection.effectiveType : 'unknown';

                await fetch(`${API_URL}/log-visitor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page_visited,
                        referrer,
                        language,
                        platform,
                        screen_resolution,
                        timezone,
                        network_info
                    }),
                });
            } catch (e) {
                console.error('Failed to log visitor', e);
            }
        },
        logSecurityEvent: async (email: string, attempt_type: 'login' | 'registration', status: 'success' | 'failure', failure_reason?: string) => {
            try {
                await fetch(`${API_URL}/log-security`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, attempt_type, status, failure_reason }),
                });
            } catch (e) {
                console.error('Failed to log security event', e);
            }
        }
    }
};
