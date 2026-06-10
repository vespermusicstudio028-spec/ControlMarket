import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form input states
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const handleOpenLogin = () => {
      setMode('login');
      setIsOpen(true);
      setHasSubmitted(false);
      setFormError(null);
      setFullName('');
      setWhatsapp('');
      setEmail('');
      setPassword('');
    };
    const handleOpenSignup = () => {
      setMode('signup');
      setIsOpen(true);
      setHasSubmitted(false);
      setFormError(null);
      setFullName('');
      setWhatsapp('');
      setEmail('');
      setPassword('');
    };
    window.addEventListener('open-login', handleOpenLogin);
    window.addEventListener('open-signup', handleOpenSignup);
    return () => {
      window.removeEventListener('open-login', handleOpenLogin);
      window.removeEventListener('open-signup', handleOpenSignup);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    
    try {
      if (email && password) {
        if (mode === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (error) {
            if (error.message.includes('Email not confirmed')) {
              setFormError("Por favor, verifique sua caixa de entrada para confirmar seu e-mail antes de acessar.");
            } else if (error.message.includes('Invalid login credentials')) {
              setFormError("E-mail ou senha incorretos.");
            } else {
              setFormError("Erro ao acessar conta: " + error.message);
            }
          } else {
            // Success login - update profile row name and phone if we have them
            if (data?.user) {
              try {
                await supabase.from('profiles').upsert({
                  id: data.user.id,
                  email: email,
                  name: fullName || undefined,
                  phone: whatsapp || undefined,
                }, { onConflict: 'id' });
              } catch (pErr) {
                console.warn("Profile update warning on login:", pErr);
              }
            }

            if (data?.session) {
              window.dispatchEvent(new CustomEvent('supabase-auth-changed', { detail: data.session }));
            }

            setIsOpen(false);
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                name: fullName,
                phone: whatsapp,
              }
            }
          });

          if (error) {
            setFormError("Erro ao criar conta: " + error.message);
          } else {
             // Let user know they might need to confirm email depending on Supabase settings
             if (data?.user) {
               try {
                 await supabase.from('profiles').insert({
                   id: data.user.id,
                   email: email,
                   name: fullName,
                   phone: whatsapp,
                   status: 'trial',
                   trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                 });
               } catch (pErr) {
                 console.warn("Profile insertion warning on signup:", pErr);
               }
             }
             setHasSubmitted(true);
          }
        }
      }
    } catch (error: any) {
      setFormError("Erro inesperado: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const closeModal = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full h-full md:h-auto md:max-h-[90vh] max-w-md bg-white md:rounded-3xl shadow-2xl flex flex-col"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto">
              {hasSubmitted ? (
                <div className="p-10 text-center flex flex-col items-center justify-center min-h-full">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-cm-green" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-cm-blue mb-2">Conta Criada!</h3>
                  <p className="text-slate-500 mb-8">
                    Sua conta foi criada. Por favor, verifique sua caixa de entrada para confirmar seu e-mail (se necessário) e faça login.
                  </p>
                  <button
                    onClick={closeModal}
                    className="w-full bg-cm-blue hover:brightness-125 text-white py-3.5 rounded-xl font-bold transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="p-8 pb-10 md:pb-8 pt-12 md:pt-8 min-h-full flex flex-col justify-center">
                  <h3 className="text-2xl font-extrabold text-cm-blue mb-2">
                    {mode === 'login' ? 'Acesse sua conta' : 'Comece seu teste grátis'}
                  </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {mode === 'login' 
                    ? 'Preencha seus dados para entrar no painel do ControlMarket.' 
                    : 'Crie sua conta. Você terá 7 dias gratuitos, sem cartão de crédito.'}
                </p>



                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                      {formError}
                    </div>
                  )}
                  {mode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Nome Completo</label>
                        <input
                          required
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                          placeholder="João da Silva"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">WhatsApp</label>
                        <input
                          required
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">E-mail</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                      placeholder="joao@seumercado.com.br"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Senha</label>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>

                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-cm-green hover:brightness-110 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>{mode === 'login' ? 'Entrar' : 'Criar Conta'} <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>

                  <div className="text-center mt-4 text-sm text-slate-500 hover:text-cm-blue cursor-pointer" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    {mode === 'login' ? "Não tem uma conta? Criar conta" : "Já tem conta? Fazer login"}
                  </div>
                </form>
              </div>
            )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
