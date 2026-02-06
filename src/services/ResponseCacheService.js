/**
 * ResponseCacheService
 * 
 * Manages response caching for inactive tabs using localStorage.
 * Responses received while a tab is inactive are cached and 
 * loaded when the tab becomes visible again.
 */

const CACHE_KEY_PREFIX = 'exim-ws-cache-';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

class ResponseCacheService {
    constructor() {
        // Cleanup old cache entries on initialization
        this._cleanupExpiredCache();
    }

    /**
     * Generate cache key for a thread
     * @param {string} threadId - Thread ID
     * @returns {string} - localStorage key
     */
    _getCacheKey(threadId) {
        return `${CACHE_KEY_PREFIX}${threadId}`;
    }

    /**
     * Cache a response for a thread
     * @param {string} threadId - Thread ID
     * @param {Object} response - Response object to cache
     */
    cacheResponse(threadId, response) {
        const cacheKey = this._getCacheKey(threadId);

        try {
            // Get existing cache
            const existingData = localStorage.getItem(cacheKey);
            let cacheArray = [];

            if (existingData) {
                try {
                    cacheArray = JSON.parse(existingData);
                } catch (e) {
                    cacheArray = [];
                }
            }

            // Add new response with timestamp
            cacheArray.push({
                response,
                cachedAt: Date.now()
            });

            // Store updated cache
            localStorage.setItem(cacheKey, JSON.stringify(cacheArray));

            console.log(`[ResponseCache] Cached response for thread: ${threadId}`);
        } catch (err) {
            console.error('[ResponseCache] Error caching response:', err);
        }
    }

    /**
     * Get and clear cached responses for a thread
     * @param {string} threadId - Thread ID
     * @returns {Array} - Array of cached response objects
     */
    getAndClearCache(threadId) {
        const cacheKey = this._getCacheKey(threadId);

        try {
            const cacheData = localStorage.getItem(cacheKey);

            if (!cacheData) {
                return [];
            }

            const cacheArray = JSON.parse(cacheData);

            // Clear the cache
            localStorage.removeItem(cacheKey);

            // Filter out expired entries and return responses
            const now = Date.now();
            const validResponses = cacheArray
                .filter(item => now - item.cachedAt < CACHE_EXPIRY_MS)
                .map(item => item.response);

            console.log(`[ResponseCache] Retrieved ${validResponses.length} cached responses for thread: ${threadId}`);

            return validResponses;
        } catch (err) {
            console.error('[ResponseCache] Error getting cached responses:', err);
            return [];
        }
    }

    /**
     * Check if there are pending cached responses for a thread
     * @param {string} threadId - Thread ID
     * @returns {boolean}
     */
    hasPendingResponses(threadId) {
        const cacheKey = this._getCacheKey(threadId);
        const cacheData = localStorage.getItem(cacheKey);

        if (!cacheData) return false;

        try {
            const cacheArray = JSON.parse(cacheData);
            return cacheArray.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Clear all cached responses for a thread
     * @param {string} threadId - Thread ID
     */
    clearCache(threadId) {
        const cacheKey = this._getCacheKey(threadId);
        localStorage.removeItem(cacheKey);
    }

    /**
     * Cleanup expired cache entries
     * Called on service initialization
     */
    _cleanupExpiredCache() {
        const now = Date.now();
        const keysToRemove = [];

        // Find all our cache keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_KEY_PREFIX)) {
                try {
                    const cacheData = localStorage.getItem(key);
                    if (cacheData) {
                        const cacheArray = JSON.parse(cacheData);

                        // Filter to only valid (non-expired) entries
                        const validEntries = cacheArray.filter(
                            item => now - item.cachedAt < CACHE_EXPIRY_MS
                        );

                        if (validEntries.length === 0) {
                            keysToRemove.push(key);
                        } else if (validEntries.length !== cacheArray.length) {
                            // Some entries expired, update the cache
                            localStorage.setItem(key, JSON.stringify(validEntries));
                        }
                    }
                } catch (err) {
                    // Invalid cache entry, remove it
                    keysToRemove.push(key);
                }
            }
        }

        // Remove invalid/empty caches
        keysToRemove.forEach(key => localStorage.removeItem(key));

        if (keysToRemove.length > 0) {
            console.log(`[ResponseCache] Cleaned up ${keysToRemove.length} expired cache entries`);
        }
    }
}

// Export singleton instance
const responseCacheService = new ResponseCacheService();
export default responseCacheService;