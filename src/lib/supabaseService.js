// /src/lib/supabaseService.js
import { supabase, PHOTOS_BUCKET, ensureBucket } from './supabaseClient';

// ============================================================
// SERVIÇO DE TEMPLATES
// ============================================================

export const saveTemplatesToSupabase = async (templates) => {
  try {
    const templateList = Object.keys(templates).map(key => {
      const t = templates[key];
      return {
        client_id: t.clientId,
        client_name: t.clientName,
        sections: t.sections,
        total_items: t.totalItems || 0,
        version: t.version || '1.0'
      };
    });

    if (templateList.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from('templates')
      .upsert(templateList, { 
        onConflict: 'client_id'
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar templates:', error);
    return { success: false, error: error.message };
  }
};

export const loadTemplatesFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('client_name');

    if (error) throw error;

    const templates = {};
    const clients = [];
    
    data.forEach(item => {
      const template = {
        clientId: item.client_id,
        clientName: item.client_name,
        sections: item.sections,
        totalItems: item.total_items,
        version: item.version,
        lastUpdated: item.updated_at
      };
      templates[item.client_id] = template;
      clients.push({
        id: item.client_id,
        name: item.client_name,
        sections: item.sections?.length || 0,
        items: item.total_items || 0,
        lastUpdated: item.updated_at
      });
    });

    return { success: true, templates, clients };
  } catch (error) {
    console.error('Erro ao carregar templates:', error);
    return { success: false, error: error.message, templates: {}, clients: [] };
  }
};

// ============================================================
// SERVIÇO DE NOTIFICAÇÕES
// ============================================================

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

// ============================================================
// SERVIÇO DE MENSAGENS
// ============================================================

export const sendMessage = async (senderId, receiverId, message) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message,
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, message: data };
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return { success: false, error: error.message };
  }
};

export const getMessages = async (userId1, userId2) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId1},receiver_id.eq.${userId1}`)
      .or(`sender_id.eq.${userId2},receiver_id.eq.${userId2}`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { success: true, messages: data };
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return { success: false, error: error.message, messages: [] };
  }
};
