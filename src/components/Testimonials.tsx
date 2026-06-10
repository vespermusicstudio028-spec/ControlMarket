import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Proprietário, Minimercado Dois Irmãos",
    content: "O ControlMarket mudou a nossa rotina. Antes perdíamos horas contando estoque em planilhas, agora tudo é atualizado no momento da venda. O faturamento aumentou porque não deixamos faltar produtos-chave.",
    rating: 5,
    initials: "CM"
  },
  {
    name: "Ana Patrícia",
    role: "Gerente, Padaria Sabor de Pão",
    content: "Sistema incrivelmente fácil de usar. Os caixas aprenderam a usar em menos de uma hora. Os relatórios me ajudam a entender quais são os pães e doces que mais vendem por horário.",
    rating: 5,
    initials: "AP"
  },
  {
    name: "Roberto Vilela",
    role: "Dono, Casa de Carnes Prime",
    content: "Controlar quebra de açougue sempre foi minha maior dor de cabeça. Com o ControlMarket eu consigo precificar meus cortes com precisão garantindo a margem de lucro que preciso. Excelente suporte.",
    rating: 5,
    initials: "RV"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-cm-green text-sm font-bold tracking-widest uppercase mb-3">Histórias de Sucesso</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-cm-blue mb-4">
            Quem usa, recomenda
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-cm-green text-cm-green" />
                ))}
              </div>
              <p className="text-slate-600 italic flex-1 mb-8">
                "{testimonial.content}"
              </p>
              <div className="mt-auto">
                <div className="w-12 h-12 bg-slate-100 text-cm-blue rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {testimonial.initials}
                </div>
                <h4 className="font-bold text-cm-blue">{testimonial.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
