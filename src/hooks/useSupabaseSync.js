// /src/hooks/useSupabaseSync.js
import { useState } from 'react';
import { 
  loadTemplatesFromSupabase, 
  saveTemplatesToSupabase,
  uploadPhoto,
  getPhotosByInspection,
  deletePhotosByInspection,
  saveInspectionToSupabase,
  getInspectionsFromSupabase,
  sendNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
  sendMessage,
  getMessages,
  markMessageAsRead
} from '../lib/supabaseService';
import { ensureBucket } from '../lib/supabaseClient';
import { saveTemplatesToStorage } from '../utils/excelTemplateImporter';

export function useSupabaseSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');

  const initializeBucket = async () => {
    setSyncing(true);
    setSyncStatus('Inicializando storage...');
    try {
      const result = await ensureBucket();
      if (result) {
        setSyncStatus('✅ Storage inicializado com sucesso!');
        return { success: true };
      } else {
        setSyncStatus('❌ Erro ao inicializar storage');
        return { success: false };
      }
    } catch (error) {
      setSyncError(error.message);
      setSyncStatus(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const syncTemplatesFromSupabase = async () => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncError(null);
    setSyncStatus('Carregando templates do Supabase...');

    try {
      setSyncProgress(30);
      const result = await loadTemplatesFromSupabase();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setSyncProgress(70);
      if (result.templates && Object.keys(result.templates).length > 0) {
        saveTemplatesToStorage(result.templates);
        setSyncStatus(`✅ ${Object.keys(result.templates).length} templates carregados do Supabase`);
      } else {
        setSyncStatus('ℹ️ Nenhum template encontrado no Supabase');
      }

      setSyncProgress(100);
      return { success: true, templates: result.templates, clients: result.clients };
    } catch (error) {
      setSyncError(error.message);
      setSyncStatus(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const syncTemplatesToSupabase = async () => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncError(null);
    setSyncStatus('Enviando templates para o Supabase...');

    try {
      const templates = JSON.parse(localStorage.getItem('fims_templates') || '{}');
      
      if (Object.keys(templates).length === 0) {
        setSyncStatus('⚠️ Nenhum template encontrado no localStorage');
        return { success: false, error: 'Nenhum template encontrado' };
      }

      setSyncProgress(50);
      const result = await saveTemplatesToSupabase(templates);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setSyncProgress(100);
      setSyncStatus(`✅ ${Object.keys(templates).length} templates enviados para o Supabase`);
      return { success: true, count: Object.keys(templates).length };
    } catch (error) {
      setSyncError(error.message);
      setSyncStatus(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const uploadInspectionPhotos = async (inspectionId, itemId, file) => {
    try {
      setSyncStatus('Fazendo upload da foto...');
      const result = await uploadPhoto(inspectionId, itemId, file);
      if (result.success) {
        setSyncStatus('✅ Foto enviada com sucesso!');
      } else {
        setSyncStatus(`❌ Erro: ${result.error}`);
      }
      return result;
    } catch (error) {
      setSyncError(error.message);
      setSyncStatus(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const fetchInspectionPhotos = async (inspectionId) => {
    try {
      setSyncStatus('Buscando fotos...');
      const result = await getPhotosByInspection(inspectionId);
      if (result.success) {
        const count = Object.values(result.photos).flat().length;
        setSyncStatus(`✅ ${count} fotos carregadas`);
      }
      return result;
    } catch (error) {
      setSyncError(error.message);
      return { success: false, error: error.message, photos: {} };
    }
  };

  const deleteInspectionPhotos = async (inspectionId) => {
    try {
      setSyncStatus('Removendo fotos...');
      const result = await deletePhotosByInspection(inspectionId);
      if (result.success) {
        setSyncStatus('✅ Fotos removidas com sucesso');
      }
      return result;
    } catch (error) {
      setSyncError(error.message);
      return { success: false, error: error.message };
    }
  };

  const saveInspection = async (inspection) => {
    try {
      setSyncStatus('Salvando inspeção...');
      const result = await saveInspectionToSupabase(inspection);
      if (result.success) {
        setSyncStatus('✅ Inspeção salva com sucesso!');
      }
      return result;
    } catch (error) {
      setSyncError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============================================================
  // NOTIFICAÇÕES
  // ============================================================

  const sendNotificationToUser = async (userId, title, message, type = 'info', link = null) => {
    try {
      const result = await sendNotification(userId, title, message, type, link);
      return result;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return { success: false, error: error.message };
    }
  };

  const fetchNotifications = async (userId, limit = 20) => {
    try {
      const result = await getNotifications(userId, limit);
      return result;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return { success: false, error: error.message, notifications: [] };
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      return result;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return { success: false, error: error.message };
    }
  };

  const markAllAsRead = async (userId) => {
    try {
      const result = await markAllNotificationsAsRead(userId);
      return result;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return { success: false, error: error.message };
    }
  };

  const countUnread = async (userId) => {
    try {
      const result = await countUnreadNotifications(userId);
      return result;
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      return { success: false, error: error.message, count: 0 };
    }
  };

  // ============================================================
  // MENSAGENS
  // ============================================================

  const sendMessageToUser = async (senderId, receiverId, message) => {
    try {
      const result = await sendMessage(senderId, receiverId, message);
      return result;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return { success: false, error: error.message };
    }
  };

  const fetchMessages = async (userId1, userId2) => {
    try {
      const result = await getMessages(userId1, userId2);
      return result;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return { success: false, error: error.message, messages: [] };
    }
  };

  const markMessageRead = async (messageId) => {
    try {
      const result = await markMessageAsRead(messageId);
      return result;
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    syncing,
    syncProgress,
    syncError,
    syncStatus,
    initializeBucket,
    syncTemplatesFromSupabase,
    syncTemplatesToSupabase,
    uploadInspectionPhotos,
    fetchInspectionPhotos,
    deleteInspectionPhotos,
    saveInspection,
    sendNotificationToUser,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    countUnread,
    sendMessageToUser,
    fetchMessages,
    markMessageRead
  };
}
