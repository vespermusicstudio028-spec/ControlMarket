import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

const features = [
  {
    title: "Controle de Estoque e Vendas Simplificado",
    description: "Uma visão clara e em tempo real do que entra, do que sai e do que está parado nas prateleiras. Evite perdas e venda mais.",
    items: [
      "Integração com leitores de código de barras",
      "Alertas de validade e estoque mínimo",
      "Inventário rápido e preciso"
    ],
    imageAlt: "Tela de Controle de Estoque",
    reversed: false
  },
  {
    title: "Dashboard Financeiro e Relatórios",
    description: "Tome decisões baseadas em dados concretos. Acompanhe seu faturamento, lucro e despesas com gráficos fáceis de entender.",
    items: [
      "Ticket médio e produtos mais vendidos",
      "Fechamento de caixa otimizado",
      "Exportação para contabilidade"
    ],
    imageAlt: "Dashboard Financeiro",
    reversed: true
  }
];

export default function Features() {
  return (
    <section id="funcionalidades" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {features.map((feature, index) => (
          <div key={index} className={`flex flex-col ${feature.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20 ${index !== 0 ? 'mt-24' : ''}`}>
            
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: feature.reversed ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-3xl md:text-4xl font-extrabold text-cm-blue mb-6">
                {feature.title}
              </h3>
              <p className="text-base text-slate-500 mb-8 max-w-lg">
                {feature.description}
              </p>
              <ul className="space-y-4">
                {feature.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cm-green shrink-0 mt-0.5" />
                    <span className="text-slate-600 font-bold text-sm tracking-wide">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              className="flex-1 w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-slate-50 rounded-3xl shadow-xl border border-slate-200 p-2 sm:p-4 aspect-video relative flex flex-col overflow-hidden group">
                 {/* Decorative background blur */}
                 <div className={`absolute top-0 w-64 h-64 bg-opacity-20 blur-3xl rounded-full ${feature.reversed ? 'bg-cm-green -right-10' : 'bg-cm-blue -left-10'}`}></div>
                 
                 {/* Internal Mockup Area */}
                 <div className="bg-white flex-1 rounded-2xl border border-slate-200 overflow-hidden relative z-10 flex shadow-sm">
                   {/* Mockup Sidebar */}
                   <div className="hidden sm:flex w-32 border-r border-slate-100 bg-slate-50 flex-col py-4 px-2 gap-2">
                     <div className="h-3 w-16 bg-slate-200 rounded mx-2 mb-4"></div>
                     <div className={`h-8 w-full rounded-xl ${feature.reversed ? 'bg-white border border-slate-100' : 'bg-cm-blue/10'}`}></div>
                     <div className={`h-8 w-full rounded-xl ${feature.reversed ? 'bg-cm-green/10' : 'bg-white border border-slate-100'}`}></div>
                     <div className="h-8 w-full bg-white border border-slate-100 rounded-xl"></div>
                   </div>
                   {/* Main Area */}
                   <div className="flex-1 p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        <div className="h-6 w-16 bg-cm-green/20 rounded"></div>
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                         <div className="h-3 w-48 bg-slate-100 rounded mb-2"></div>
                         <div className="h-8 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
                         <div className="h-8 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
                         <div className="h-8 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
                         <div className="h-8 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
                      </div>
                   </div>
                 </div>
              </div>
            </motion.div>

          </div>
        ))}

      </div>
    </section>
  );
}
