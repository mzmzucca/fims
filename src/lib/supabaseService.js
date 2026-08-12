// /src/lib/supabaseService.js
import { supabase, PHOTOS_BUCKET } from './supabaseClient';

// ============================================================
// SERVIÇO DE TEMPLATES
// ============================================================

// Salvar templates no Supabase
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
        onConflict: 'client_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar templates:', error);
    return { success: false, error: error.message };
  }
};

// Carregar templates do Supabase
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

// Buscar template por nome do cliente
export const getTemplateFromSupabase = async (clientName) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .ilike('client_name', `%${clientName}%`)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const item = data[0];
    return {
      clientId: item.client_id,
      clientName: item.client_name,
      sections: item.sections,
      totalItems: item.total_items,
      version: item.version
    };
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return null;
  }
};

// ============================================================
// SERVIÇO DE FOTOS
// ============================================================

// Upload de foto para o Supabase Storage
export const uploadPhoto = async (inspectionId, itemId, file) => {
  try {
    // Garantir que o bucket existe
    await ensureBucket();
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${inspectionId}/${itemId}/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `photos/${fileName}`;

    // Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    // Salvar metadados na tabela photos
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

// Buscar fotos de uma inspeção
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

// Deletar foto
export const deletePhoto = async (photoId, storagePath) => {
  try {
    // Deletar do Storage
    const { error: storageError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Deletar da tabela photos
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) throw dbError;

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return { success: false, error: error.message };
  }
};

// Deletar todas as fotos de uma inspeção
export const deletePhotosByInspection = async (inspectionId) => {
  try {
    // Buscar todas as fotos da inspeção
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('id, storage_path')
      .eq('inspection_id', inspectionId);

    if (fetchError) throw fetchError;

    if (photos && photos.length > 0) {
      // Deletar do Storage
      const paths = photos.map(p => p.storage_path);
      const { error: storageError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove(paths);

      if (storageError) throw storageError;

      // Deletar da tabela
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
// SERVIÇO DE INSPEÇÕES
// ============================================================

// Salvar inspeção no Supabase
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

// Buscar inspeções do Supabase
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

// ============================================================
// FUNÇÃO PARA CRIAR AS TABELAS (executar uma vez no SQL Editor)
// ============================================================

export const createTablesSQL = `
-- Tabela templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  sections JSONB NOT NULL,
  total_items INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_client_id ON templates(client_id);
CREATE INDEX IF NOT EXISTS idx_templates_client_name ON templates(client_name);

-- Tabela photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_photos_item_id ON photos(item_id);

-- Tabela inspections_sync
CREATE TABLE IF NOT EXISTS inspections_sync (
  id TEXT PRIMARY KEY,
  location_id INTEGER,
  location_name TEXT,
  inspector_id INTEGER,
  inspector_name TEXT,
  supervisor_id INTEGER,
  supervisor_name TEXT,
  status TEXT,
  score_pct INTEGER,
  date DATE,
  items JSONB,
  sections JSONB,
  notes TEXT,
  alert_level TEXT,
  template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_sync_location ON inspections_sync(location_id);
CREATE INDEX IF NOT EXISTS idx_inspections_sync_date ON inspections_sync(date);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_sync_updated_at ON inspections_sync;
CREATE TRIGGER update_inspections_sync_updated_at
BEFORE UPDATE ON inspections_sync
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;
