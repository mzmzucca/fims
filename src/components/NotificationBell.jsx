// /src/components/NotificationBell.jsx
import { useState, useEffect } from 'react';
import { Icon } from '../lib/icons';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { fetchNotifications, markAsRead, markAllAsRead, countUnread } = useSupabaseSync();

  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [notifsResult, countResult] = await Promise.all([
        fetchNotifications(userId, 20),
        countUnread(userId)
      ]);
      
      if (notifsResult.success) {
        setNotifications(notifsResult.notifications);
      }
      if (countResult.success) {
        setUnreadCount(countResult.count);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Polling para notificações em tempo real
    const interval = setInterval(() => {
      if (userId) {
        countUnread(userId).then(result => {
          if (result.success && result.count !== unreadCount) {
            loadNotifications();
          }
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (notificationId) => {
    const result = await markAsRead(notificationId);
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead(userId);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        <Icon name="bell" size={20} color="#1E2A3A" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#A32D2D',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(4px, -4px)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: 380,
          maxHeight: 500,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          zIndex: 1000,
          marginTop: 8
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notificações</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>
                <div style={{ 
                  width: 24, 
                  height: 24, 
                  border: '3px solid #E5E7EB', 
                  borderTopColor: '#3B82F6', 
                  borderRadius: '50%', 
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px'
                }} />
                <p>Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                <Icon name="bell" size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    background: notif.read ? 'white' : '#F0F7FF',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onClick={() => {
                    if (!notif.read) {
                      handleMarkAsRead(notif.id);
                    }
                    if (notif.link) {
                      window.location.href = notif.link;
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{notif.title}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{notif.message}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                        {formatTime(notif.created_at)}
                        {!notif.read && (
                          <span style={{ 
                            marginLeft: 8, 
                            background: '#3B82F6', 
                            color: 'white',
                            padding: '1px 8px',
                            borderRadius: 10,
                            fontSize: 10
                          }}>
                            Nova
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <div style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: '#3B82F6',
                        flexShrink: 0,
                        marginTop: 4
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
