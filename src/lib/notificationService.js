// /src/lib/notificationService.js
import { supabase } from './supabaseClient';

// Enviar notificação
export const sendNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { success: false, error: error.message };
  }
};

// Buscar notificações do usuário
export const getNotifications = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return { success: true, notifications: data };
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return { success: false, error: error.message, notifications: [] };
  }
};

// Marcar notificação como lida
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return { success: false, error: error.message };
  }
};

// Marcar todas como lidas
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return { success: false, error: error.message };
  }
};

// Contar notificações não lidas
export const countUnreadNotifications = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    return { success: true, count };
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// Inscrever para notificações em tempo real
export const subscribeToNotifications = (userId, onNotification) => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new);
      }
    )
    .subscribe();

  return channel;
};
