// /scripts/createUsers.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://SEU_NOVO_PROJETO.supabase.co',
  'SUA_CHAVE_SERVICE_ROLE' // Use a chave service_role do Supabase
);

const users = [
  { email: 'sergio@nemchem.co.mz', password: 'Nemchem2024!', name: 'Sergio Zucca', role: 'ceo' },
  { email: 'marcello@nemchem.co.mz', password: 'Nemchem2024!', name: 'Marcello Zucca', role: 'supervisor' },
  { email: 'contratos@nemchem.co.mz', password: 'Nemchem2024!', name: 'Rafael Massinga', role: 'supervisor' },
  { email: 'supervisao@nemchem.co.mz', password: 'Nemchem2024!', name: 'Naldo Macovela', role: 'inspector' },
  { email: 'alberto@nemchem.co.mz', password: 'Nemchem2024!', name: 'Alberto Ndjindji', role: 'inspector' },
  { email: 'shepherdtinovimbachikanda@gmail.com', password: 'Nemchem2024!', name: 'Shepherd Tinovimba', role: 'inspector' },
  { email: 'armando@nemchem.co.mz', password: 'Nemchem2024!', name: 'Armando Uqueio', role: 'inspector' },
  { email: 'maluane.helder@gmail.com', password: 'Nemchem2024!', name: 'Helder Maluane', role: 'admin' },
  { email: 'fernandonicolaochikanda@gmail.com', password: 'Nemchem2024!', name: 'Fernando Chikanda', role: 'admin' }
];

async function createUsers() {
  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
          avatar: user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        }
      });
      
      if (error) {
        console.error(`❌ Erro ao criar ${user.email}:`, error.message);
      } else {
        console.log(`✅ Usuário criado: ${user.email}`);
      }
    } catch (e) {
      console.error(`❌ Erro: ${user.email}`, e);
    }
  }
}

createUsers();
