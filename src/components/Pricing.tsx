import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Básico",
    price: "29,90",
    description: "Ideal para pequenos comércios que estão começando a se organizar.",
    features: [
      "Cadastro até 1.000 produtos",
      "Controle de estoque simples",
      "1 Usuário",
      "Suporte por e-mail",
    ],
    highlighted: false
  },
  {
    name: "Profissional",
    price: "59,90",
    description: "Para negócios em crescimento que precisam de mais recursos.",
    features: [
      "Cadastro até 10.000 produtos",
      "Controle de estoque avançado",
      "Relatórios financeiros",
      "Até 3 Usuários",
      "Suporte prioritário via WhatsApp",
    ],
    highlighted: true
  },
  {
    name: "Empresarial",
    price: "99,90",
    description: "Solução completa para comércios de grande volume.",
    features: [
      "Produtos ilimitados",
      "Múltiplas lojas/filiais",
      "API para integrações",
      "Usuários ilimitados",
      "Gerente de conta dedicado",
    ],
    highlighted: false
  }
];

export default function Pricing() {
  return (
    <section id="planos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-cm-green text-sm font-bold tracking-widest uppercase mb-3">Preços Transparentes</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-cm-blue mb-4">
            Planos que cabem no seu bolso
          </h3>
          <p className="text-base text-slate-500">
            Comece grátis por 7 dias. Sem compromisso, cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-3xl p-8 border ${plan.highlighted ? 'border-2 border-cm-green bg-green-50 relative scale-100 md:scale-105 z-10 shadow-xl shadow-green-100' : 'bg-slate-50 border-slate-200 shadow-sm'} flex flex-col`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cm-green text-white px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  MAIS ESCOLHIDO
                </div>
              )}
              
              <h4 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-cm-green' : 'text-slate-400 uppercase text-sm'}`}>{plan.name}</h4>
              <p className="text-slate-500 text-[11px] mb-6 h-10">{plan.description}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-black text-cm-blue">R$ {plan.price}</span>
                <span className="text-slate-500 text-xs font-normal">/mês</span>
              </div>

              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-signup'))}
                className={`w-full py-3.5 rounded-xl text-sm font-bold mb-8 transition-colors ${plan.highlighted ? 'bg-cm-green hover:bg-green-600 text-white shadow-md shadow-green-200' : 'bg-transparent border border-cm-blue text-cm-blue hover:bg-blue-50'}`}
              >
                Começar Agora
              </button>

              <div className="space-y-4 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-cm-green' : 'text-slate-400'}`} />
                    <span className="text-slate-600 text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
