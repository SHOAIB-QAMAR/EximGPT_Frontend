import { useState, useRef } from 'react';
import { v1 as uuidv1 } from 'uuid';
import ChatService from '../services/chat.service';

/**
 * Maximum number of active sessions allowed.
 * When this limit is reached, the least recently used session will be removed.
 */
const MAX_ACTIVE_SESSIONS = 6;

/**
 * Helper function to log errors with detailed context
 * @param {string} hookName - Name of the hook
 * @param {string} method - Method where error occurred
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
const logError = (hookName, method, error, context = {}) => {
    const errorInfo = {
        file: 'useChatSessions.js',
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

export const useChatSessions = (threads = [], closeMobileSidebar) => {
    const [activeSessions, setActiveSessions] = useState([{
        id: uuidv1(),
        messages: [],
        inputValue: "",
        title: "New Chat",
        isThinking: false,
        scrollPosition: 0,
        lastAccessedAt: Date.now(),
        selectedFile: null
    }]);
    const [activeSessionId, setActiveSessionId] = useState(activeSessions[0].id);

    // Derived state
    const activeSession = activeSessions.find(s => s.id === activeSessionId) || activeSessions[0];

    // Helper to update active session state
    const updateActiveSession = (fields) => {
        setActiveSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, ...fields } : s));
    };

    /**
     * Finds and removes the least recently used session.
     * @param {Array} sessions - Current sessions array
     * @param {string} currentActiveId - Current active session ID to exclude from removal
     * @returns {Array} - Sessions array with LRU session removed
     */
    const removeLRUSession = (sessions, currentActiveId) => {
        // Find the least recently used session (excluding the current active one)
        const sessionsExcludingActive = sessions.filter(s => s.id !== currentActiveId);
        if (sessionsExcludingActive.length === 0) return sessions;

        const lruSession = sessionsExcludingActive.reduce((oldest, session) => {
            return (session.lastAccessedAt < oldest.lastAccessedAt) ? session : oldest;
        }, sessionsExcludingActive[0]);

        return sessions.filter(s => s.id !== lruSession.id);
    };

    const handleNewChat = () => {
        const method = 'handleNewChat';
        try {
            console.log(`[useChatSessions.${method}] Creating new chat session`);

            const newSession = {
                id: uuidv1(),
                messages: [],
                inputValue: "",
                title: "New Chat",
                isThinking: false,
                scrollPosition: 0,
                lastAccessedAt: Date.now(),
                selectedFile: null
            };

            setActiveSessions(prev => {
                try {
                    let updatedSessions = prev;
                    // If at max capacity, remove the least recently used session
                    if (prev.length >= MAX_ACTIVE_SESSIONS) {
                        console.log(`[useChatSessions.${method}] Max sessions reached (${MAX_ACTIVE_SESSIONS}), removing LRU session`);
                        updatedSessions = removeLRUSession(prev, activeSessionId);
                    }
                    return [...updatedSessions, newSession];
                } catch (innerError) {
                    logError('useChatSessions', method, innerError, {
                        operation: 'setActiveSessions callback',
                        prevLength: prev?.length
                    });
                    return prev; // Return unchanged state on error
                }
            });
            setActiveSessionId(newSession.id);
            if (closeMobileSidebar) closeMobileSidebar();

            console.log(`[useChatSessions.${method}] New session created: ${newSession.id}`);
        } catch (error) {
            logError('useChatSessions', method, error, { activeSessionId });
        }
    };

    const handleTabClick = (id) => {
        const method = 'handleTabClick';
        try {
            if (activeSessionId === id) return;

            console.log(`[useChatSessions.${method}] Switching to tab: ${id}`);

            // Update lastAccessedAt for the session being accessed
            setActiveSessions(prev => prev.map(s =>
                s.id === id ? { ...s, lastAccessedAt: Date.now() } : s
            ));
            setActiveSessionId(id);
        } catch (error) {
            logError('useChatSessions', method, error, { targetId: id, currentActiveId: activeSessionId });
        }
    };

    const handleTabClose = (id) => {
        const method = 'handleTabClose';
        try {
            console.log(`[useChatSessions.${method}] Closing tab: ${id}`);

            if (activeSessions.length === 1) {
                console.log(`[useChatSessions.${method}] Only one tab remaining, resetting instead of closing`);
                // Reset last tab
                updateActiveSession({ messages: [], inputValue: "", title: "New Chat", isThinking: false, id: uuidv1() });
                return;
            }

            const newSessions = activeSessions.filter(s => s.id !== id);
            setActiveSessions(newSessions);

            if (activeSessionId === id) {
                const newActiveId = newSessions[newSessions.length - 1].id;
                console.log(`[useChatSessions.${method}] Active tab closed, switching to: ${newActiveId}`);
                setActiveSessionId(newActiveId);
            }
        } catch (error) {
            logError('useChatSessions', method, error, {
                targetId: id,
                sessionsCount: activeSessions.length,
                isActiveSession: activeSessionId === id
            });
        }
    };

    const handleLoadChat = async (threadId) => {
        const method = 'handleLoadChat';
        try {
            if (!threadId) {
                const error = new Error('threadId is required but was not provided');
                logError('useChatSessions', method, error, { threadId });
                return;
            }

            console.log(`[useChatSessions.${method}] Loading chat: ${threadId}`);

            const existingSession = activeSessions.find(s => s.id === threadId);
            if (existingSession) {
                console.log(`[useChatSessions.${method}] Chat already in active sessions, switching to it`);
                // Update lastAccessedAt for the existing session
                setActiveSessions(prev => prev.map(s =>
                    s.id === threadId ? { ...s, lastAccessedAt: Date.now() } : s
                ));
                setActiveSessionId(threadId);
                if (closeMobileSidebar) closeMobileSidebar();
                return;
            }

            console.log(`[useChatSessions.${method}] Creating new session for thread: ${threadId}`);

            const newSession = {
                id: threadId,
                messages: [],
                inputValue: "",
                title: "Loading...",
                isThinking: true,
                scrollPosition: 0,
                lastAccessedAt: Date.now(),
                selectedFile: null
            };

            setActiveSessions(prev => {
                try {
                    let updatedSessions = prev;
                    // If at max capacity, remove the least recently used session
                    if (prev.length >= MAX_ACTIVE_SESSIONS) {
                        console.log(`[useChatSessions.${method}] Max sessions reached, removing LRU session`);
                        updatedSessions = removeLRUSession(prev, activeSessionId);
                    }
                    return [...updatedSessions, newSession];
                } catch (innerError) {
                    logError('useChatSessions', method, innerError, {
                        operation: 'setActiveSessions callback during loadChat',
                        prevLength: prev?.length
                    });
                    return prev;
                }
            });
            setActiveSessionId(threadId);

            if (closeMobileSidebar) closeMobileSidebar();

            console.log(`[useChatSessions.${method}] Fetching messages from server for thread: ${threadId}`);

            try {
                const messages = await ChatService.getThreadMessages(threadId);
                const thread = threads.find(t => t.threadId === threadId);

                console.log(`[useChatSessions.${method}] Received ${messages?.length || 0} messages for thread: ${threadId}`);

                setActiveSessions(prev => prev.map(s => s.id === threadId ? {
                    ...s,
                    messages: messages,
                    title: thread?.title || "Chat",
                    isThinking: false
                } : s));
            } catch (fetchError) {
                logError('useChatSessions', method, fetchError, {
                    operation: 'fetching thread messages',
                    threadId
                });
                // Update session to show error state
                setActiveSessions(prev => prev.map(s => s.id === threadId ? {
                    ...s,
                    isThinking: false,
                    title: "Failed to load"
                } : s));
            }
        } catch (error) {
            logError('useChatSessions', method, error, { threadId });
            setActiveSessions(prev => prev.map(s => s.id === threadId ? { ...s, isThinking: false } : s));
        }
    };

    return {
        activeSessions,
        setActiveSessions,
        activeSessionId,
        setActiveSessionId,
        activeSession,
        updateActiveSession,
        handleNewChat,
        handleTabClick,
        handleTabClose,
        handleLoadChat
    };
};