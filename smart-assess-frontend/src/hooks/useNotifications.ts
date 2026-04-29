import { useEffect, useState, useCallback } from 'react';
import { WebSocketService, NotificationMessage } from '@/services/websocketService';
import { toast } from 'sonner';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>(() => {
    // Charger les notifications depuis localStorage au démarrage
    const savedNotifications = localStorage.getItem('notifications');
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    // Charger le compteur depuis localStorage au démarrage
    const savedCount = localStorage.getItem('unreadCount');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [wsService] = useState(() => new WebSocketService());

  const showToast = useCallback((notification: NotificationMessage) => {
    const { type, data } = notification;
    
    switch (type) {
      case 'NEW_CANDIDATURE':
        toast.success(`Nouvelle candidature: ${data.candidateName}`, {
          description: `Poste${data.positions && data.positions.length > 1 ? 's' : ''}: ${data.positions?.join(', ') || 'Non spécifié'}`,
          action: {
            label: 'Voir',
            onClick: () => {
              // Naviguer vers la page des candidatures
              window.location.href = '/manager/candidatures';
            }
          }
        });
        break;
        
      case 'TEST_SUBMITTED':
        toast.info(`Test soumis: ${data.candidateName}`, {
          action: {
            label: 'Voir',
            onClick: () => {
              // Navigrer vers les résultats du test
              window.location.href = `/manager/tests/${data.testId}/results`;
            }
          }
        });
        break;
        
      case 'TEST_COMPLETED':
        toast.info(`Test terminé: ${data.candidateName}`, {
          action: {
            label: 'Voir',
            onClick: () => {
              window.location.href = `/manager/tests/${data.testId}/results`;
            }
          }
        });
        break;
        
      default:
        toast('Notification système', {
          description: 'Une nouvelle notification est disponible'
        });
    }
  }, []);

  useEffect(() => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('auth_token');
        
    if (!token) {
      console.warn(' No authentication token found');
      return;
    }

    wsService.connect(token, (notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev];
        // Sauvegarder dans localStorage
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(prev => {
        const updated = prev + 1;
        // Sauvegarder dans localStorage
        localStorage.setItem('unreadCount', updated.toString());
        return updated;
      });
      
      // Afficher une notification toast
      showToast(notification);
    });

    // Vérifier l'état de connexion après un délai
    const checkConnection = () => {
      console.log(' WebSocket connection status:', wsService.isConnected());
    };
    
    setTimeout(checkConnection, 2000);
    setTimeout(checkConnection, 5000);

    return () => {
      console.log(' useNotifications: Disconnecting WebSocket...');
      wsService.disconnect();
    };
  }, [wsService, showToast]);

  const markAsRead = useCallback((index: number) => {
    setNotifications(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Sauvegarder dans localStorage
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => {
      const updated = Math.max(0, prev - 1);
      // Sauvegarder dans localStorage
      localStorage.setItem('unreadCount', updated.toString());
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    // Sauvegarder dans localStorage
    localStorage.setItem('notifications', '[]');
    localStorage.setItem('unreadCount', '0');
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    // Sauvegarder dans localStorage
    localStorage.setItem('notifications', '[]');
    localStorage.setItem('unreadCount', '0');
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected: wsService.isConnected()
  };
}
