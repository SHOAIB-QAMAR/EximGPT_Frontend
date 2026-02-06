/**
 * SharedWebSocketService
 * 
 * Singleton service that manages a SINGLE WebSocket connection for the entire app.
 * Uses BroadcastChannel for cross-tab coordination and leader election.
 * 
 * Architecture:
 * - ONE WebSocket for ALL threads (multiplexed via threadId in messages)
 * - Leader tab owns the WebSocket
 * - All messages include threadId for routing
 */

import API_CONFIG from './api.config';

// Constants
const CHANNEL_NAME = 'exim-websocket-channel';
const LEADER_KEY = 'exim-ws-leader';
const LEADER_HEARTBEAT_INTERVAL = 2000; // 2 seconds
const LEADER_TIMEOUT = 5000; // 5 seconds
const VISIBILITY_FAILOVER_MS = 3000; // 3 seconds - aggressive takeover if leader is throttled
const CONNECTION_DEBOUNCE_MS = 300;

class SharedWebSocketService {
    constructor() {
        // Instance state
        this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.isLeader = false;
        this.socket = null; // Single WebSocket for all threads
        this.subscribers = new Set(); // callback functions for incoming messages

        // Connection state
        this.connectTimer = null;
        this.disconnectTimer = null;
        this.messageQueue = []; // Messages queued while connecting
        this.activeThreads = new Set(); // Threads that need the connection

        // BroadcastChannel for cross-tab communication
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = this._handleBroadcast.bind(this);

        // Heartbeat interval (for leader)
        this.heartbeatInterval = null;

        // Start leader election
        this._attemptLeaderElection();

        // Listen for storage changes (leader heartbeat)
        window.addEventListener('storage', this._handleStorageChange.bind(this));

        // Listen for visibility changes (aggressive health check)
        document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));

        // Handle tab close
        window.addEventListener('beforeunload', this._handleTabClose.bind(this));

        console.log(`[SharedWS] Initialized with tabId: ${this.tabId}`);
    }

    /**
     * Attempt to become the leader or check if current leader is alive
     */
    _attemptLeaderElection() {
        const leaderData = localStorage.getItem(LEADER_KEY);
        const now = Date.now();

        if (leaderData) {
            const { tabId, timestamp } = JSON.parse(leaderData);

            if (now - timestamp < LEADER_TIMEOUT && tabId !== this.tabId) {
                this.isLeader = false;
                console.log(`[SharedWS] Tab ${this.tabId} is follower. Leader: ${tabId}`);
                return;
            }
        }

        this._becomeLeader();
    }

    /**
     * Become the leader tab
     */
    _becomeLeader() {
        this.isLeader = true;
        this._updateLeaderHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            this._updateLeaderHeartbeat();
        }, LEADER_HEARTBEAT_INTERVAL);

        console.log(`[SharedWS] Tab ${this.tabId} is now LEADER`);

        this.channel.postMessage({
            type: 'LEADER_ELECTED',
            tabId: this.tabId
        });

        // If there are active threads, connect
        if (this.activeThreads.size > 0) {
            this._scheduleConnect();
        }
    }

    _updateLeaderHeartbeat() {
        localStorage.setItem(LEADER_KEY, JSON.stringify({
            tabId: this.tabId,
            timestamp: Date.now()
        }));
    }

    _handleStorageChange(event) {
        if (event.key !== LEADER_KEY) return;

        if (!event.newValue) {
            this._attemptLeaderElection();
        } else {
            const { tabId } = JSON.parse(event.newValue);
            if (tabId !== this.tabId && this.isLeader) {
                this._resignAsLeader();
            }
        }
    }

    _resignAsLeader() {
        if (!this.isLeader) return;

        this.isLeader = false;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        console.log(`[SharedWS] Tab ${this.tabId} resigned as leader`);
    }

    _handleTabClose() {
        if (this.connectTimer) clearTimeout(this.connectTimer);
        if (this.disconnectTimer) clearTimeout(this.disconnectTimer);

        // Remove visibility listener
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);

        if (this.isLeader) {
            if (this.socket) {
                this.socket.close();
            }
            localStorage.removeItem(LEADER_KEY);
        }

        this.channel.close();
    }

    _handleVisibilityChange() {
        if (document.hidden) return;

        console.log(`[SharedWS] Tab became visible - checking leader health`);

        // If we are already leader, update heartbeat immediately to assert dominance
        if (this.isLeader) {
            this._updateLeaderHeartbeat();
            return;
        }

        // If we are follower, check if leader is throttled
        this._attemptAggressiveLeaderElection();
    }

    _attemptAggressiveLeaderElection() {
        const leaderData = localStorage.getItem(LEADER_KEY);
        const now = Date.now();

        if (leaderData) {
            const { tabId, timestamp } = JSON.parse(leaderData);

            // Use tighter timeout (3s) when user explicitly visits the tab
            // This detects background throttling much faster than the passive 5s timeout
            if (now - timestamp > VISIBILITY_FAILOVER_MS && tabId !== this.tabId) {
                console.log(`[SharedWS] Leader ${tabId} is stale (${now - timestamp}ms). Taking over via aggressive election.`);
                this._becomeLeader();
                return;
            }

            // Leader looks healthy
            console.log(`[SharedWS] Leader ${tabId} is healthy (${now - timestamp}ms lag)`);
        } else {
            // No leader found, take over
            this._becomeLeader();
        }
    }

    _handleBroadcast(event) {
        const { type, threadId, message, tabId, originTabId } = event.data;

        switch (type) {
            case 'LEADER_ELECTED':
                if (tabId !== this.tabId) {
                    this._resignAsLeader();
                }
                break;

            case 'REGISTER_THREAD':
                if (this.isLeader && originTabId !== this.tabId) {
                    this.activeThreads.add(threadId);
                    this._scheduleConnect();
                }
                break;

            case 'UNREGISTER_THREAD':
                if (this.isLeader && originTabId !== this.tabId) {
                    this.activeThreads.delete(threadId);
                    if (this.activeThreads.size === 0) {
                        this._scheduleDisconnect();
                    }
                }
                break;

            case 'SEND_MESSAGE':
                if (this.isLeader && originTabId !== this.tabId) {
                    this._sendViaWebSocket(threadId, message);
                }
                break;

            case 'MESSAGE_RECEIVED':
                if (originTabId !== this.tabId) {
                    this._notifySubscribers(threadId, message);
                }
                break;
        }
    }

    _scheduleConnect() {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }

        // Already connected or connecting
        if (this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        if (this.connectTimer) {
            clearTimeout(this.connectTimer);
        }

        this.connectTimer = setTimeout(() => {
            this.connectTimer = null;
            this._createWebSocket();
        }, CONNECTION_DEBOUNCE_MS);
    }

    _scheduleDisconnect() {
        if (this.connectTimer) {
            clearTimeout(this.connectTimer);
            this.connectTimer = null;
        }

        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
        }

        this.disconnectTimer = setTimeout(() => {
            this.disconnectTimer = null;
            this._closeWebSocket();
        }, CONNECTION_DEBOUNCE_MS);
    }

    /**
     * Create the single WebSocket connection (leader only)
     */
    _createWebSocket() {
        if (!this.isLeader) return;

        if (this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // Single endpoint for all threads
        const wsUrl = `${API_CONFIG.WS_BASE_URL}${API_CONFIG.endpoints.CHAT_WS}`;
        console.log(`[SharedWS] Creating single multiplexed WebSocket: ${wsUrl}`);

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('[SharedWS] WebSocket connected (multiplexed)');
            this._flushMessageQueue();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const threadId = data.threadId;

                if (!threadId) {
                    console.error('[SharedWS] Received message without threadId:', data);
                    return;
                }

                // Notify local subscribers
                this._notifySubscribers(threadId, data);

                // Broadcast to other tabs
                this.channel.postMessage({
                    type: 'MESSAGE_RECEIVED',
                    threadId,
                    message: data,
                    originTabId: this.tabId
                });
            } catch (err) {
                console.error('[SharedWS] Error parsing WebSocket message:', err);
            }
        };

        this.socket.onerror = (error) => {
            console.error('[SharedWS] WebSocket error:', error);
        };

        this.socket.onclose = () => {
            console.log('[SharedWS] WebSocket closed');
            this.socket = null;
        };
    }

    _flushMessageQueue() {
        if (this.messageQueue.length === 0) return;

        console.log(`[SharedWS] Flushing ${this.messageQueue.length} queued messages`);

        this.messageQueue.forEach(msg => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(msg);
            }
        });

        this.messageQueue = [];
    }

    _sendViaWebSocket(threadId, payload) {
        if (!this.isLeader) return false;

        // Ensure payload includes threadId
        let message;
        try {
            const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
            message = JSON.stringify({ ...parsed, threadId });
        } catch {
            // Plain text message
            message = JSON.stringify({ threadId, content: payload });
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            return true;
        }

        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
            console.log(`[SharedWS] WebSocket connecting - queuing message`);
            this.messageQueue.push(message);
            return true;
        }

        console.error('[SharedWS] Cannot send - WebSocket not available');
        return false;
    }

    _closeWebSocket() {
        if (!this.isLeader) return;

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.messageQueue = [];
    }

    _notifySubscribers(threadId, message) {
        this.subscribers.forEach(callback => {
            try {
                callback(threadId, message);
            } catch (err) {
                console.error('[SharedWS] Error in subscriber callback:', err);
            }
        });
    }

    // ========== PUBLIC API ==========

    /**
     * Register a thread (signals that we need the WebSocket)
     * @param {string} threadId - Thread ID
     */
    connectThread(threadId) {
        this.activeThreads.add(threadId);

        if (this.isLeader) {
            this._scheduleConnect();
        } else {
            this.channel.postMessage({
                type: 'REGISTER_THREAD',
                threadId,
                originTabId: this.tabId
            });
        }
    }

    /**
     * Send a message via WebSocket
     * @param {string} threadId - Thread ID
     * @param {string} text - Message text or JSON string
     * @returns {boolean}
     */
    sendMessage(threadId, text) {
        if (this.isLeader) {
            return this._sendViaWebSocket(threadId, text);
        } else {
            this.channel.postMessage({
                type: 'SEND_MESSAGE',
                threadId,
                message: text,
                originTabId: this.tabId
            });
            return true;
        }
    }

    /**
     * Subscribe to incoming messages
     * @param {Function} callback - (threadId, message) => void
     * @returns {Function} - Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Unregister a thread
     * @param {string} threadId - Thread ID
     */
    disconnectThread(threadId) {
        this.activeThreads.delete(threadId);

        if (this.isLeader) {
            if (this.activeThreads.size === 0) {
                this._scheduleDisconnect();
            }
        } else {
            this.channel.postMessage({
                type: 'UNREGISTER_THREAD',
                threadId,
                originTabId: this.tabId
            });
        }
    }

    isLeaderTab() {
        return this.isLeader;
    }
}

// Export singleton instance
const sharedWebSocketService = new SharedWebSocketService();
export default sharedWebSocketService;