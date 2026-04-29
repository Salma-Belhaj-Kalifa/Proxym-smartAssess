import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface NotificationMessage {
  type: 'NEW_CANDIDATURE' | 'TEST_SUBMITTED' | 'TEST_COMPLETED';
  timestamp: string;
  read?: boolean;
  data: {
    candidatureId?: number;
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    positions?: string[];
    company?: string;
    status?: string;
    testId?: number;
    score?: number;
    submittedAt?: string;
    completedAt?: string;
    duration?: number;
  };
}

export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  connect(token: string, onNotification: (message: NotificationMessage) => void) {
    if (this.client && this.client.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => console.log('WebSocket Debug:', str),
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log(' WebSocket Connected');
      this.reconnectAttempts = 0;
      
      // S'abonner aux notifications managers
      const subscription = this.client.subscribe('/topic/manager-notifications', (message) => {
        try {
          const notification = JSON.parse(message.body) as NotificationMessage;
          console.log('🔔 Notification received:', notification);
          onNotification(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      });
      
      this.subscriptions.set('manager-notifications', subscription);
    };

    this.client.onStompError = (frame) => {
      console.error(' WebSocket STOMP Error:', frame);
      this.handleReconnect(token, onNotification);
    };

    this.client.onDisconnect = () => {
      console.log(' WebSocket Disconnected');
      this.handleReconnect(token, onNotification);
    };

    this.client.onWebSocketError = (error) => {
      console.error(' WebSocket Error:', error);
      this.handleReconnect(token, onNotification);
    };

    this.client.activate();
  }

  private handleReconnect(token: string, onNotification: (message: NotificationMessage) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(` Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.client) {
          this.client.deactivate();
        }
        this.connect(token, onNotification);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error(' Max reconnection attempts reached');
    }
  }

  disconnect() {
    console.log(' Disconnecting WebSocket...');
    
    // Unsubscribe from all topics
    this.subscriptions.forEach((subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions.clear();

    // Deactivate client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  sendNotification(message: NotificationMessage) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: '/app/notifications',
        body: JSON.stringify(message)
      });
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
}
