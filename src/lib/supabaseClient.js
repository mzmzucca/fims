// /src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cblsvfzjhehidbyntpkl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_o35pKaoXVY0pGINev3XhqQ_XoIHA4Or';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const PHOTOS_BUCKET = 'inspection-photos';

// ============================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================

// Login
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return { success: false, error: 'Usuário não encontrado na base de dados' };
    }
    
    return { 
      success: true, 
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar || userData.name?.charAt(0) || 'U',
        active: userData.active
      }
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, error: error.message };
  }
};

// Logout
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { success: false, error: error.message };
  }
};

// Buscar usuário atual (para persistir após reload)
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return { success: true, user: null };
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();
    
    if (userError) {
      return { success: true, user: null };
    }
    
    return { 
      success: true, 
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar || userData.name?.charAt(0) || 'U',
        active: userData.active
      }
    };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return { success: false, error: error.message, user: null };
  }
};

// Listar todos os usuários
export const listUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return { success: true, users: data };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return { success: false, error: error.message, users: [] };
  }
};

// Resetar senha
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// FUNÇÕES DE STORAGE (BUCKET)
// ============================================================

export const ensureBucket = async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const bucketExists = buckets.some(b => b.name === PHOTOS_BUCKET);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(PHOTOS_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 10485760,
      });
      if (createError) throw createError;
      console.log('✅ Bucket criado com sucesso!');
    }
    return true;
  } catch (error) {
    console.error('Erro ao criar bucket:', error);
    return false;
  }
};
