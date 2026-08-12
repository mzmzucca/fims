// /src/components/SyncButton.jsx
import { useState, useEffect } from 'react';
import { Icon } from '../lib/icons';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

export default function SyncButton() {
  const { 
    syncing, 
    syncStatus, 
    syncTemplatesFromSupabase, 
    syncTemplatesToSupabase,
    initializeBucket
  } = useSupabaseSync();

  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (syncStatus) {
      setStatusMessage(syncStatus);
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const handleSyncFrom = async () => {
    const result = await syncTemplatesFromSupabase();
    if (result.success) {
      setStatusMessage(`✅ ${result.clients?.length || 0} templates carregados`);
    } else {
      setStatusMessage(`❌ Erro: ${result.error}`);
    }
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 5000);
  };

  const handleSyncTo = async () => {
    const result = await syncTemplatesToSupabase();
    if (result.success) {
      setStatusMessage(`✅ ${result.count} templates enviados`);
    } else {
      setStatusMessage(`❌ Erro: ${result.error}`);
    }
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 5000);
  };

  const handleInitBucket = async () => {
    const result = await initializeBucket();
    if (result.success) {
      setStatusMessage('✅ Storage inicializado com sucesso!');
    } else {
      setStatusMessage(`❌ Erro: ${result.error}`);
    }
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleSyncFrom}
          disabled={syncing}
          title="Carregar templates do Supabase"
        >
          <Icon name="download" size={13} />
          {syncing ? '...' : 'Carregar do Cloud'}
        </button>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={handleSyncTo}
          disabled={syncing}
          title="Enviar templates para o Supabase"
        >
          <Icon name="upload" size={13} />
          {syncing ? '...' : 'Enviar para Cloud'}
        </button>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleInitBucket}
          disabled={syncing}
          title="Inicializar Storage"
          style={{ background: '#0F6E56', color: 'white' }}
        >
          <Icon name="folder" size={13} />
          Iniciar Storage
        </button>
        {showStatus && (
          <span style={{ 
            fontSize: 12, 
            color: statusMessage.includes('✅') ? '#0F6E56' : 
                   statusMessage.includes('❌') ? '#A32D2D' : 
                   statusMessage.includes('⚠️') ? '#BA7517' : '#888'
          }}>
            {statusMessage}
          </span>
        )}
      </div>
      {syncing && (
        <div style={{ 
          width: '100%', 
          height: 4, 
          background: '#E5E7EB', 
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: '#3B82F6',
            animation: 'progress 1.5s ease-in-out infinite'
          }} />
        </div>
      )}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
