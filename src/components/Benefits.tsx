import { motion } from 'motion/react';
import { Package, BarChart3, Tag, TrendingUp, Search, Cloud } from 'lucide-react';

const benefits = [
  {
    icon: Package,
    title: "Cadastro de Produtos",
    description: "Cadastre milhares de produtos rapidamente com código de barras e variações.",
    color: "bg-blue-50 text-cm-blue"
  },
  {
    icon: BarChart3,
    title: "Controle de Estoque",
    description: "Acompanhe entradas e saídas em tempo real e receba alertas de estoque baixo.",
    color: "bg-green-50 text-cm-green"
  },
  {
    icon: Tag,
    title: "Gestão de Preços",
    description: "Atualize preços de forma simples, em lote ou aplicando margens de lucro automáticas.",
    color: "bg-orange-50 text-orange-600"
  },
  {
    icon: TrendingUp,
    title: "Relatórios Inteligentes",
    description: "Visualize indicadores de vendas, produtos mais vendidos e previsão de estoque.",
    color: "bg-blue-50 text-cm-blue"
  },
  {
    icon: Search,
    title: "Busca Rápida",
    description: "Localize qualquer produto instantaneamente com nossa busca otimizada.",
    color: "bg-green-50 text-cm-green"
  },
  {
    icon: Cloud,
    title: "Backup em Nuvem",
    description: "Seus dados protegidos com criptografia e acessíveis de qualquer lugar.",
    color: "bg-orange-50 text-orange-600"
  }
];

export default function Benefits() {
  return (
    <section id="beneficios" className="py-24 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-cm-green text-sm font-bold tracking-widest uppercase mb-3">Tudo que você precisa</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-cm-blue mb-4">
            Gestão completa para o seu negócio
          </h3>
          <p className="text-base text-slate-500">
            Dê adeus às planilhas complexas. O ControlMarket centraliza todas as operações essenciais do seu comércio em um único lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-start"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${benefit.color} group-hover:scale-110 transition-transform`}>
                <benefit.icon className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-cm-blue mb-1">{benefit.title}</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-1 hidden sm:block">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
