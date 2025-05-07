import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// Base URL for WebSocket connection
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create a class to manage the WebSocket connection
class SocketManager {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.connectionListeners = [];
  }
  
  // Add connection status listener
  addConnectionListener(listener) {
    this.connectionListeners.push(listener);
    // Immediately notify the listener of the current connection status
    listener(this.connected);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }
  
  // Notify all connection listeners
  notifyConnectionListeners(status) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Connect to WebSocket
  connect() {
    if (this.stompClient) {
      return;
    }

    const socket = new SockJS(`${SOCKET_URL}/ws`);
    this.stompClient = Stomp.over(socket);
    
    // Disable debug logging
    this.stompClient.debug = () => {};

    this.stompClient.connect(
      {},
      () => {
        console.log('Socket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Notify listeners of connection status
        this.notifyConnectionListeners(true);
        
        // Resubscribe to all topics
        this.subscriptions.forEach((callback, topic) => {
          this.subscribe(topic, callback);
        });
        
        // Authenticate user if ID is available
        const userId = localStorage.getItem('userId');
        if (userId) {
          this.sendUserStatus(userId, 'online');
        }
      },
      (error) => {
        console.error('Socket connection error:', error);
        this.connected = false;
        this.stompClient = null;
        
        // Notify listeners of connection status
        this.notifyConnectionListeners(false);
        
        // Try to reconnect
        this.reconnect();
      }
    );
  }

  // Reconnect to WebSocket
  reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnect attempts reached. Please refresh the page.');
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.stompClient && this.connected) {
      // Set user status to offline before disconnecting
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.sendUserStatus(userId, 'offline');
      }
      
      this.stompClient.disconnect();
      this.stompClient = null;
      this.connected = false;
      console.log('Socket disconnected');
    }
  }

  // Subscribe to a topic
  subscribe(topic, callback) {
    if (!this.stompClient || !this.connected) {
      // Store subscription for later when connection is established
      this.subscriptions.set(topic, callback);
      return { unsubscribe: () => {} };
    }
    
    const subscription = this.stompClient.subscribe(topic, (message) => {
      const data = JSON.parse(message.body);
      callback(data);
    });
    
    // Store subscription for reconnection
    this.subscriptions.set(topic, callback);
    
    return {
      unsubscribe: () => {
        subscription.unsubscribe();
        this.subscriptions.delete(topic);
      }
    };
  }

  // Send a message to a destination
  send(destination, body) {
    if (this.stompClient && this.connected) {
      try {
        this.stompClient.send(destination, {}, JSON.stringify(body));
      } catch (error) {
        console.error('Error sending message:', error);
        // If there's an error sending the message, try to reconnect
        this.connected = false;
        this.reconnect();
      }
    } else {
      console.warn('Cannot send message, socket not connected');
      // Try to connect if not connected
      if (!this.reconnectTimeout) {
        this.connect();
      }
    }
  }

  // Send user status update
  sendUserStatus(userId, status) {
    try {
      this.send('/app/status', { userId, status, timestamp: new Date() });
    } catch (error) {
      console.error('Error sending user status:', error);
      
      // Fallback: Use REST API to update status
      this.updateUserStatusViaREST(userId, status);
    }
  }
  
  // Fallback method to update user status via REST API
  async updateUserStatusViaREST(userId, status) {
    try {
      const response = await fetch(`${SOCKET_URL}/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Create a custom event to notify components about the status change
      const event = new CustomEvent('user-status-change', {
        detail: { userId, status }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Fallback REST API update failed:', error);
    }
  }

  // Subscribe to user status updates
  subscribeToUserStatus(callback) {
    return this.subscribe('/topic/status', callback);
  }
}

// Create a singleton instance
const socketManager = new SocketManager();

// Export the socket manager instance
export default socketManager;

// Connect to socket
export const connectSocket = () => {
  socketManager.connect();
};

// Disconnect from socket
export const disconnectSocket = () => {
  socketManager.disconnect();
};

// Authenticate user
export const authenticateUser = (userId) => {
  if (userId) {
    socketManager.sendUserStatus(userId, 'online');
  }
};

// Update user activity
export const updateUserActivity = (userId, status) => {
  if (userId) {
    socketManager.sendUserStatus(userId, status);
  }
};