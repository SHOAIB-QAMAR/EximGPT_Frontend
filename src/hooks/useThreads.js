import { useState, useEffect, useCallback } from 'react';
import ChatService from '../services/chat.service';

/**
 * Helper function to log errors with detailed context
 * @param {string} hookName - Name of the hook
 * @param {string} method - Method where error occurred
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
const logError = (hookName, method, error, context = {}) => {
    const errorInfo = {
        file: 'useThreads.js',
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

export const useThreads = () => {
    const [threads, setThreads] = useState([]);

    const fetchThreads = useCallback(async () => {
        const method = 'fetchThreads';
        try {
            console.log(`[useThreads.${method}] Fetching all threads from server`);
            const data = await ChatService.getAllThreads();
            console.log(`[useThreads.${method}] Successfully fetched ${data?.length || 0} threads`);
            setThreads(data);
        } catch (err) {
            logError('useThreads', method, err, {
                operation: 'fetching threads from API'
            });
        }
    }, []);

    useEffect(() => {
        console.log('[useThreads.useEffect] Initial fetch on mount');
        fetchThreads();
    }, [fetchThreads]);

    const deleteThread = async (threadId) => {
        const method = 'deleteThread';
        try {
            if (!threadId) {
                console.error(`[useThreads.${method}] threadId is required`);
                return false;
            }

            console.log(`[useThreads.${method}] Deleting thread: ${threadId}`);
            await ChatService.deleteThread(threadId);

            setThreads(prev => prev.filter(t => t.threadId !== threadId));
            console.log(`[useThreads.${method}] Successfully deleted thread: ${threadId}`);
            return true;
        } catch (err) {
            logError('useThreads', method, err, {
                threadId,
                operation: 'deleting thread'
            });
            return false;
        }
    };

    return { threads, setThreads, fetchThreads, deleteThread };
};