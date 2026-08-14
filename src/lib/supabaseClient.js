// /src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uaspabiqnmcwohluymeb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_B08e9mtpZ8BCdauYElZlQw_4dgOaszz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const PHOTOS_BUCKET = 'inspection-photos';

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

// ============================================================
// AUTENTICAÇÃO
// ============================================================

export const signIn = async (email, password) => {
  try {
    // 1. Autenticar no Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // 2. Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    // 3. Se não encontrar na tabela users, criar
    if (userError) {
      const newUser = {
        id: data.user.id,
        name: data.user.user_metadata?.name || email.split('@')[0],
        email: email,
        role: data.user.user_metadata?.role || 'inspector',
        avatar: data.user.user_metadata?.name?.charAt(0)?.toUpperCase() || email.charAt(0).toUpperCase(),
        active: true
      };
      
      const { error: insertError } = await supabase
        .from('users')
        .insert(newUser);
      
      if (insertError) {
        console.error('Erro ao criar usuário na tabela:', insertError);
        return { success: false, error: 'Erro ao criar perfil do usuário' };
      }
      
      return { success: true, user: newUser };
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
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email ou senha incorretos' };
    }
    return { success: false, error: error.message };
  }
};

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
      // Criar perfil se não existir
      const newUser = {
        id: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        role: user.user_metadata?.role || 'inspector',
        avatar: user.user_metadata?.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase(),
        active: true
      };
      
      await supabase.from('users').insert(newUser);
      return { success: true, user: newUser };
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

export const updateUser = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, user: data };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return { success: false, error: error.message };
  }
};
