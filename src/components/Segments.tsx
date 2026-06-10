import { motion } from 'motion/react';
import { ShoppingBag, Coffee, Apple, ShoppingCart as Convenience, Pill, Truck, Store, Croissant } from 'lucide-react';

const segments = [
  { name: "Mercados & Minimercados", icon: ShoppingBag },
  { name: "Açougues & Casas de Carnes", icon: Coffee },
  { name: "Padarias & Confeitarias", icon: Croissant },
  { name: "Hortifrutis & Quitandas", icon: Apple },
  { name: "Lojas de Conveniência", icon: Convenience },
  { name: "Farmácias & Drogarias", icon: Pill },
  { name: "Distribuidoras de Bebidas", icon: Truck },
  { name: "Lojas em Geral", icon: Store },
];

export default function Segments() {
  return (
    <section id="segmentos" className="py-24 bg-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-cm-green text-sm font-bold tracking-widest uppercase mb-3">Versatilidade</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-cm-blue mb-4">
            Feito para o seu segmento
          </h3>
          <p className="text-base text-slate-500">
            Não importa o tamanho ou nicho do seu comércio, o ControlMarket tem as ferramentas certas para impulsionar suas vendas e organizar sua gestão.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {segments.map((segment, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-3xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 mx-auto bg-slate-100 text-cm-blue rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <segment.icon className="w-6 h-6" />
              </div>
              <h4 className="text-cm-blue font-bold text-sm md:text-sm uppercase">{segment.name}</h4>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
