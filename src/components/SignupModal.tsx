import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SignupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setHasSubmitted(false);
      setFormError(null);
      setFullName('');
      setEmail('');
      setWhatsapp('');
      setBusinessName('');
      setPassword('');
    };
    window.addEventListener('open-signup', handleOpen);
    return () => window.removeEventListener('open-signup', handleOpen);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    
    try {
      if (email && password) {
        const { supabase } = await import('../lib/supabase');
        
        // Try logging in first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            // Attempt to sign up if wrong credentials
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: email,
              password: password,
              options: {
                data: {
                  name: fullName,
                  phone: whatsapp,
                  business_name: businessName
                }
              }
            });
            
            if (signUpError) {
              if (signUpError.message.includes('User already registered')) {
                setFormError("Este e-mail já está cadastrado e a senha está incorreta.");
              } else {
                setFormError("Erro ao criar conta: " + signUpError.message);
              }
            } else {
               // Success sign up! Let's insert into profiles immediately as dual protection
               if (signUpData?.user) {
                 try {
                   await supabase.from('profiles').insert({
                     id: signUpData.user.id,
                     email: email,
                     name: fullName,
                     phone: whatsapp,
                     business_name: businessName,
                     status: 'trial',
                     trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                   });
                 } catch (pErr) {
                   console.warn("Direct profile insertion warning (probably handled by trigger):", pErr);
                 }
               }
               setHasSubmitted(true);
            }
          } else {
            setFormError("Erro ao acessar conta: " + signInError.message);
          }
        } else {
          // Success sign in
          // Make sure profile row exists or update it
          if (signInData?.user) {
            try {
              await supabase.from('profiles').upsert({
                id: signInData.user.id,
                email: email,
                name: fullName || undefined,
                phone: whatsapp || undefined,
                business_name: businessName || undefined
              }, { onConflict: 'id' });
            } catch (pErr) {
              console.warn("Direct profile update warning:", pErr);
            }
          }
          setHasSubmitted(true);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {hasSubmitted ? (
              <div className="p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-cm-green" />
                </div>
                <h3 className="text-2xl font-extrabold text-cm-blue mb-2">Acesso Confirmado!</h3>
                <p className="text-slate-500 mb-8">
                  Tudo certo! Redirecionando para o seu painel de controle do ControlMarket.
                </p>
                <button
                  onClick={closeModal}
                  className="w-full bg-cm-blue hover:brightness-125 text-white py-3.5 rounded-xl font-bold transition-colors"
                >
                  Ir para o painel
                </button>
              </div>
            ) : (
              <div className="p-8">
                <h3 className="text-2xl font-extrabold text-cm-blue mb-2">Comece seu teste grátis</h3>
                <p className="text-sm text-slate-500 mb-8">
                  Preencha os dados abaixo para criar sua conta de 7 dias gratuitos. Sem cartão de crédito.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                      {formError}
                    </div>
                  )}
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">E-mail Corporativo</label>
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Nome do Comércio</label>
                    <input
                      required
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                      placeholder="Mercado Dois Irmãos"
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
                      <>Criar Conta <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-4">
                    Ao criar conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
