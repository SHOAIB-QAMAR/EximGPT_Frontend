/**
 * API Configuration
 * Uses environment variables for deployment flexibility.
 * Set VITE_API_URL in .env file or deployment platform.
 */

// Get base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Derive WebSocket URL from API base URL
const getWebSocketUrl = (baseUrl) => {
    const url = new URL(baseUrl);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}`;
};

const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    WS_BASE_URL: getWebSocketUrl(API_BASE_URL),
    endpoints: {
        THREAD: "/api/thread",
        CHAT_WS: "/ws/chat",
        UPLOAD: "/api/upload"
    }
};

export default API_CONFIG;