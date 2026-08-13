// /src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cblsvfzjhehidbyntpkl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o35pKaoXVY0pGINev3XhqQ_XoIHA4Or';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const PHOTOS_BUCKET = 'inspection-photos';

// Função para verificar e criar o bucket se não existir
export const ensureBucket = async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const bucketExists = buckets.some(b => b.name === PHOTOS_BUCKET);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(PHOTOS_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
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
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================

// Registrar novo usuário
export const signUp = async (email, password, userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role || 'inspector',
          avatar: userData.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: userData.name,
          email: email,
          role: userData.role || 'inspector',
          avatar: userData.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
          active: true
        });
      
      if (profileError) console.warn('Erro ao salvar perfil:', profileError);
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao registrar:', error);
    return { success: false, error: error.message };
  }
};

// Login
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userError) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'inspector',
          avatar: data.user.user_metadata?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
          active: true
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return { success: true, user: newUser };
    }
    
    return { success: true, user: userData };
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

// Buscar usuário atual
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return { success: true, user: null };
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email,
          email: user.email,
          role: user.user_metadata?.role || 'inspector',
          avatar: user.user_metadata?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
          active: true
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return { success: true, user: newUser };
    }
    
    return { success: true, user: userData };
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
