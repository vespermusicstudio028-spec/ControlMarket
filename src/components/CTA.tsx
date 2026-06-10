import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="pb-24 pt-10 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-cm-green text-white rounded-[2.5rem] shadow-xl p-12 md:p-20 text-center">
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cm-blue/20 to-transparent"></div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                Transforme a gestão do seu comércio.
              </h2>
              <p className="text-lg md:text-xl text-green-50 mb-10 max-w-2xl mx-auto">
                Junte-se a centenas de empresários que otimizaram seus lucros e ganharam mais tempo livre usando o ControlMarket.
              </p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-signup'))}
                className="bg-cm-blue hover:brightness-125 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-cm-blue/20 flex items-center justify-center gap-2 mx-auto"
              >
                Solicitar Demonstração <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
