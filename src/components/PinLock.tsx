import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

interface PinLockProps {
  userId: string;
  onUnlock: () => void;
  onLogout: () => void;
  userEmail: string;
}

const PIN_STORAGE_KEY = (userId: string) => `controlmarket_pin_${userId}`;
const PIN_ENABLED_KEY = (userId: string) => `controlmarket_pin_enabled_${userId}`;

// Obfuscação simples do PIN (não é criptografia real, apenas dificulta leitura direta)
const obfuscatePin = (pin: string): string => btoa(`cm_${pin}_lock`);
const deobfuscatePin = (hash: string): string => {
  try {
    const decoded = atob(hash);
    return decoded.replace('cm_', '').replace('_lock', '');
  } catch {
    return '';
  }
};

export const isPinEnabled = (userId: string): boolean => {
  return localStorage.getItem(PIN_ENABLED_KEY(userId)) === 'true';
};

export const savePin = (userId: string, pin: string) => {
  localStorage.setItem(PIN_STORAGE_KEY(userId), obfuscatePin(pin));
  localStorage.setItem(PIN_ENABLED_KEY(userId), 'true');
};

export const removePin = (userId: string) => {
  localStorage.removeItem(PIN_STORAGE_KEY(userId));
  localStorage.setItem(PIN_ENABLED_KEY(userId), 'false');
};

export const verifyPin = (userId: string, pin: string): boolean => {
  const stored = localStorage.getItem(PIN_STORAGE_KEY(userId));
  if (!stored) return false;
  return deobfuscatePin(stored) === pin;
};

export default function PinLock({ userId, onUnlock, onLogout, userEmail }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockSecondsLeft, setBlockSecondsLeft] = useState(0);
  const [shake, setShake] = useState(false);

  const MAX_ATTEMPTS = 5;
  const BLOCK_SECONDS = 30;

  // Contagem regressiva do bloqueio
  useEffect(() => {
    if (!blocked) return;
    const interval = setInterval(() => {
      setBlockSecondsLeft(prev => {
        if (prev <= 1) {
          setBlocked(false);
          setAttempts(0);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [blocked]);

  const handleDigit = useCallback((digit: string) => {
    if (blocked || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      setTimeout(() => {
        if (verifyPin(userId, newPin)) {
          onUnlock();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setShake(true);
          setTimeout(() => setShake(false), 500);

          if (newAttempts >= MAX_ATTEMPTS) {
            setBlocked(true);
            setBlockSecondsLeft(BLOCK_SECONDS);
            setError(`Muitas tentativas. Aguarde ${BLOCK_SECONDS} segundos.`);
          } else {
            setError(`PIN incorreto. ${MAX_ATTEMPTS - newAttempts} tentativas restantes.`);
          }
          setPin('');
        }
      }, 200);
    }
  }, [pin, blocked, attempts, userId, onUnlock]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  // Suporte a teclado físico
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleDigit, handleDelete]);

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cm-blue to-slate-900 flex items-center justify-center p-4">
      {/* Efeito de partículas decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cm-green/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card principal */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          
          {/* Logo e título */}
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Logo className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-white font-extrabold text-xl mb-1">ControlMarket</h1>
          <p className="text-white/50 text-xs mb-6 truncate">{userEmail}</p>

          {/* Ícone de cadeado */}
          <div className={`w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl transition-all ${
            blocked ? 'bg-rose-500/20 border border-rose-500/40' : 'bg-cm-green/20 border border-cm-green/40'
          }`}>
            <Lock className={`w-8 h-8 ${blocked ? 'text-rose-400' : 'text-cm-green'}`} />
          </div>

          <h2 className="text-white font-bold text-lg mb-1">
            {blocked ? 'Acesso Bloqueado' : 'Digite seu PIN'}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {blocked
              ? `Desbloqueio em ${blockSecondsLeft}s...`
              : 'Insira o PIN de 4 dígitos para acessar'}
          </p>

          {/* Indicadores de dígitos */}
          <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length > i
                    ? 'bg-cm-green border-cm-green scale-110'
                    : 'bg-transparent border-white/40'
                }`}
              />
            ))}
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl px-4 py-2 mb-4">
              <p className="text-rose-300 text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {digits.map((d, i) => {
              if (d === null) return <div key={i} />;
              if (d === 'del') {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    disabled={blocked}
                    className="h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/15 active:scale-95 transition-all disabled:opacity-30"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(String(d))}
                  disabled={blocked || pin.length >= 4}
                  className="h-14 flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-xl hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 select-none"
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Botão sair */}
          <button
            onClick={onLogout}
            className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
