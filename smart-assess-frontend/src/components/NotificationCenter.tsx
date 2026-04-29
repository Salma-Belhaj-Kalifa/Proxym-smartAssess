import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, User, FileText, CheckCircle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_CANDIDATURE':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'TEST_SUBMITTED':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'TEST_COMPLETED':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_CANDIDATURE':
        return 'border-blue-200 bg-blue-50';
      case 'TEST_SUBMITTED':
        return 'border-green-200 bg-green-50';
      case 'TEST_COMPLETED':
        return 'border-emerald-200 bg-emerald-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'NEW_CANDIDATURE':
        return `Nouvelle candidature: ${notification.data.candidateName}`;
      case 'TEST_SUBMITTED':
        return `Test soumis: ${notification.data.candidateName}`;
      case 'TEST_COMPLETED':
        return `Test terminé: ${notification.data.candidateName}`;
      default:
        return 'Notification système';
    }
  };

  const getNotificationDetails = (notification: any) => {
    switch (notification.type) {
      case 'NEW_CANDIDATURE':
        return {
          subtitle: `Poste${notification.data.positions?.length > 1 ? 's' : ''}: ${notification.data.positions?.join(', ') || 'Non spécifié'}`,
          company: notification.data.company,
          status: notification.data.status
        };
      case 'TEST_SUBMITTED':
      case 'TEST_COMPLETED':
        return {
          subtitle: null,
          submittedAt: notification.data.submittedAt || notification.data.completedAt
        };
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: any, index: number) => {
    // Marquer comme lu d'abord
    markAsRead(index);
    
    // Naviguer vers la page appropriée sans recharger la page
    switch (notification.type) {
      case 'NEW_CANDIDATURE':
        navigate(`/manager/candidats/${notification.data.candidatureId}/generer-test`);
        break;
      case 'TEST_SUBMITTED':
      case 'TEST_COMPLETED':
        navigate(`/manager/test-results/${notification.data.testId}`);
        break;
    }
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto shadow-lg border z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => {
                  const details = getNotificationDetails(notification);
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${getNotificationColor(
                        notification.type
                      )}`}
                      onClick={() => handleNotificationClick(notification, index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {getNotificationMessage(notification)}
                              </p>
                              {details?.subtitle && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {details.subtitle}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(index);
                              }}
                            >
                              <CheckCircle className="h-3 w-3 text-gray-400" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {new Date(notification.timestamp).toLocaleString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
