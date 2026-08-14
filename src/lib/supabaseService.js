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

export const markMessageAsRead = async (messageId) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// SERVIÇO DE FOTOS
// ============================================================

export const uploadPhoto = async (inspectionId, itemId, file) => {
  try {
    await ensureBucket();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${inspectionId}/${itemId}/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert({
        inspection_id: inspectionId,
        item_id: itemId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        public_url: urlData.publicUrl
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      photo: {
        id: photoData.id,
        filename: file.name,
        url: urlData.publicUrl,
        path: filePath
      }
    };
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return { success: false, error: error.message };
  }
};

export const getPhotosByInspection = async (inspectionId) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const grouped = {};
    data.forEach(photo => {
      if (!grouped[photo.item_id]) grouped[photo.item_id] = [];
      grouped[photo.item_id].push({
        id: photo.id,
        filename: photo.file_name,
        url: photo.public_url,
        created_at: photo.created_at
      });
    });

    return { success: true, photos: grouped };
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    return { success: false, error: error.message, photos: {} };
  }
};

export const deletePhotosByInspection = async (inspectionId) => {
  try {
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('id, storage_path')
      .eq('inspection_id', inspectionId);

    if (fetchError) throw fetchError;

    if (photos && photos.length > 0) {
      const paths = photos.map(p => p.storage_path);
      const { error: storageError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove(paths);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('inspection_id', inspectionId);

      if (dbError) throw dbError;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar fotos da inspeção:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// SERVIÇO DE INSPEÇÕES (ADICIONADO)
// ============================================================

export const saveInspectionToSupabase = async (inspection) => {
  try {
    const { data, error } = await supabase
      .from('inspections_sync')
      .upsert({
        id: inspection.id,
        location_id: inspection.location_id,
        location_name: inspection.location_name,
        inspector_id: inspection.inspector_id,
        inspector_name: inspection.inspector_name,
        supervisor_id: inspection.supervisor_id,
        supervisor_name: inspection.supervisor_name,
        status: inspection.status,
        score_pct: inspection.score_pct,
        date: inspection.date,
        items: inspection.items,
        sections: inspection.sections,
        notes: inspection.notes,
        alert_level: inspection.alert_level,
        template_id: inspection.template_id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar inspeção:', error);
    return { success: false, error: error.message };
  }
};

export const getInspectionsFromSupabase = async (filters = {}) => {
  try {
    let query = supabase
      .from('inspections_sync')
      .select('*')
      .order('date', { ascending: false });

    if (filters.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, inspections: data };
  } catch (error) {
    console.error('Erro ao buscar inspeções:', error);
    return { success: false, error: error.message, inspections: [] };
  }
};
