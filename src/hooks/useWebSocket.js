import { useEffect, useRef, useCallback } from 'react';
import sharedWebSocketService from '../services/SharedWebSocketService';
import responseCacheService from '../services/ResponseCacheService';

/**
 * Helper function to log errors with detailed context
 * @param {string} hookName - Name of the hook
 * @param {string} method - Method where error occurred
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
const logError = (hookName, method, error, context = {}) => {
    const errorInfo = {
        file: 'useWebSocket.js',
        hook: hookName,
        method,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    };
    console.error(`[${hookName}.${method}] Error:`, errorInfo);
    return errorInfo;
};

/**
 * Custom hook to manage WebSocket connections for chat threads.
 * Uses SharedWebSocketService for cross-tab WebSocket sharing.
 * Caches responses for inactive tabs using ResponseCacheService.
 * 
 * @param {Array} activeSessions - List of active chat session objects
 * @param {Function} setActiveSessions - State setter for sessions
 * @param {string} activeSessionId - ID of the currently visible session
 * @param {Function} scrollToBottom - Callback to scroll chat to bottom
 * @returns {Object} { sendMessage } - Function to send messages via WS
 */

export const useWebSocket = (activeSessions, setActiveSessions, activeSessionId, scrollToBottom) => {
    // Track connected thread IDs
    const connectedThreadsRef = useRef(new Set());

    // Track tab visibility state
    const isTabVisibleRef = useRef(!document.hidden);

    // Stable ID list for dependency tracking
    const activeThreadIds = activeSessions.map(s => s.id).join(',');

    /**
     * Handle incoming WebSocket message
     */
    const handleMessage = useCallback((threadId, data) => {
        const method = 'handleMessage';
        try {
            if (!threadId) {
                console.warn(`[useWebSocket.${method}] Received message without threadId:`, data);
                return;
            }

            const reply = data.reply;
            if (reply === undefined || reply === null) {
                console.warn(`[useWebSocket.${method}] Received message without reply content for thread: ${threadId}`);
            }

            // Check if tab is hidden - if so, cache the response
            if (document.hidden) {
                console.log(`[useWebSocket.${method}] Tab hidden, caching response for thread: ${threadId}`);
                try {
                    responseCacheService.cacheResponse(threadId, {
                        threadId,
                        reply,
                        timestamp: Date.now()
                    });
                } catch (cacheError) {
                    logError('useWebSocket', method, cacheError, {
                        operation: 'caching response',
                        threadId
                    });
                }

                // Still update the session state (for when tab becomes visible)
                setActiveSessions(prev => prev.map(s => s.id === threadId ? {
                    ...s,
                    isThinking: false,
                    messages: [...s.messages, { role: 'assistant', content: reply, isNew: true, timestamp: Date.now() }]
                } : s));

                return;
            }

            // Tab is visible - update session normally
            console.log(`[useWebSocket.${method}] Processing message for thread: ${threadId}`);
            setActiveSessions(prev => prev.map(s => s.id === threadId ? {
                ...s,
                isThinking: false,
                messages: [...s.messages, { role: 'assistant', content: reply, isNew: true, timestamp: Date.now() }]
            } : s));

            // Scroll to bottom if this is the active session
            if (threadId === activeSessionId) {
                setTimeout(scrollToBottom, 50);
            }
        } catch (error) {
            logError('useWebSocket', method, error, {
                threadId,
                dataReceived: typeof data,
                activeSessionId
            });
        }
    }, [activeSessionId, setActiveSessions, scrollToBottom]);

    /**
     * Load cached responses when tab becomes visible
     */
    const loadCachedResponses = useCallback(() => {
        const method = 'loadCachedResponses';
        try {
            console.log(`[useWebSocket.${method}] Loading cached responses for ${activeSessions.length} sessions`);

            activeSessions.forEach(session => {
                try {
                    const cachedResponses = responseCacheService.getAndClearCache(session.id);

                    if (cachedResponses.length > 0) {
                        console.log(`[useWebSocket.${method}] Loaded ${cachedResponses.length} cached responses for thread: ${session.id}`);

                        // Messages should already be in state from when they were cached
                        // But let's ensure isThinking is false
                        setActiveSessions(prev => prev.map(s => s.id === session.id ? {
                            ...s,
                            isThinking: false
                        } : s));
                    }
                } catch (sessionError) {
                    logError('useWebSocket', method, sessionError, {
                        operation: 'processing cached responses for session',
                        sessionId: session.id
                    });
                }
            });

            // Scroll to bottom after loading cached messages
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            logError('useWebSocket', method, error, {
                sessionsCount: activeSessions.length
            });
        }
    }, [activeSessions, setActiveSessions, scrollToBottom]);

    /**
     * Handle tab visibility change
     */
    useEffect(() => {
        const handleVisibilityChange = () => {
            const wasHidden = !isTabVisibleRef.current;
            isTabVisibleRef.current = !document.hidden;

            // Tab just became visible - load any cached responses
            if (wasHidden && !document.hidden) {
                console.log('[useWebSocket] Tab became visible - loading cached responses');
                loadCachedResponses();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadCachedResponses]);

    /**
     * Subscribe to shared WebSocket service for incoming messages
     */
    useEffect(() => {
        const unsubscribe = sharedWebSocketService.subscribe(handleMessage);

        return () => {
            unsubscribe();
        };
    }, [handleMessage]);

    /**
     * Connect/disconnect threads based on active sessions
     */
    useEffect(() => {
        const currentThreadIds = activeThreadIds.split(',').filter(id => id);
        const currentSet = new Set(currentThreadIds);

        // Connect new threads
        currentThreadIds.forEach(threadId => {
            if (!connectedThreadsRef.current.has(threadId)) {
                console.log(`[useWebSocket] Requesting connection for thread: ${threadId}`);
                sharedWebSocketService.connectThread(threadId);
                connectedThreadsRef.current.add(threadId);
            }
        });

        // Disconnect removed threads
        connectedThreadsRef.current.forEach(threadId => {
            if (!currentSet.has(threadId)) {
                console.log(`[useWebSocket] Disconnecting thread: ${threadId}`);
                sharedWebSocketService.disconnectThread(threadId);
                connectedThreadsRef.current.delete(threadId);
            }
        });
    }, [activeThreadIds]);

    /**
     * Cleanup on unmount - disconnect all threads
     */
    useEffect(() => {
        return () => {
            console.log('[useWebSocket] Unmounting - disconnecting all threads');
            connectedThreadsRef.current.forEach(threadId => {
                sharedWebSocketService.disconnectThread(threadId);
            });
            connectedThreadsRef.current.clear();
        };
    }, []);

    /**
     * Send message via shared WebSocket service
     * @param {string} threadId - Thread ID
     * @param {string} text - Message text
     * @returns {boolean} - Whether message was sent
     */
    const sendMessage = useCallback((threadId, text) => {
        const method = 'sendMessage';
        try {
            if (!threadId) {
                console.error(`[useWebSocket.${method}] Cannot send message: threadId is required`);
                return false;
            }
            if (!text) {
                console.warn(`[useWebSocket.${method}] Sending empty message to thread: ${threadId}`);
            }

            console.log(`[useWebSocket.${method}] Sending message to thread: ${threadId}`);
            const result = sharedWebSocketService.sendMessage(threadId, text);

            if (!result) {
                console.error(`[useWebSocket.${method}] Failed to send message - WebSocket not ready for thread: ${threadId}`);
            }

            return result;
        } catch (error) {
            logError('useWebSocket', method, error, {
                threadId,
                textLength: text?.length
            });
            return false;
        }
    }, []);

    return { sendMessage };
};