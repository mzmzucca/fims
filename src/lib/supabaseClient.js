// /src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Usando as variáveis do Vercel
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cblsvfzjhehidbyntpkl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o35pKaoXVY0pGINev3XhqQ_XoIHA4Or';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bucket para fotos
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
