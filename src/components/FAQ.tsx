import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Preciso instalar algo no meu computador?",
    answer: "Não! O ControlMarket funciona 100% na nuvem. Você só precisa de um navegador e acesso à internet para gerenciar seu comércio de qualquer lugar do mundo."
  },
  {
    question: "O sistema funciona no celular?",
    answer: "Sim, nossa plataforma é totalmente responsiva e pode ser acessada perfeitamente de computadores, tablets e smartphones."
  },
  {
    question: "Posso cadastrar produtos ilimitados?",
    answer: "O limite de produtos depende do plano contratado. O plano Básico permite até 1.000 produtos, enquanto o Empresarial não possui limites de cadastro."
  },
  {
    question: "Os dados do meu comércio ficam seguros?",
    answer: "Garantimos segurança de nível bancário. Seus dados são criptografados, armazenados em servidores seguros na nuvem da AWS/Google e com backups automáticos diários."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-cm-green text-sm font-bold tracking-widest uppercase mb-3">Dúvidas?</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-cm-blue mb-4">
            Perguntas Frequentes
          </h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <button 
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-bold text-cm-blue pr-8">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-slate-600 text-sm">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
