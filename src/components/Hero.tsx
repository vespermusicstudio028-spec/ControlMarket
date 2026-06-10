import { motion } from 'motion/react';
import { ArrowRight, PlayCircle, BarChart2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 bg-cm-blue p-8 md:p-12 lg:p-16 rounded-3xl relative">
          {/* Decorative Geometric Elements */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full border border-white/10 hidden md:block"></div>
          <div className="absolute right-10 top-10 w-[30%] h-[30%] bg-cm-green/10 rounded-3xl rotate-12 hidden md:block"></div>
          
          <motion.div 
            className="flex-1 text-center lg:text-left relative z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-cm-green text-[10px] uppercase font-bold px-3 py-1 rounded-full text-white inline-block mb-4 tracking-widest shadow-sm">Controle Inteligente, Resultados Reais</span>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Controle seu estoque e<br className="hidden md:block" /> seus produtos com<br className="hidden md:block" /> mais eficiência.
            </h1>
            <p className="text-sm md:text-base lg:text-base text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              O ControlMarket ajuda mercados, açougues, padarias e comércios a organizar seus produtos, controlar estoque e aumentar seus lucros.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-signup'))}
                className="w-full sm:w-auto bg-cm-green hover:brightness-110 text-white px-6 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Teste Grátis <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto bg-transparent border border-white/30 hover:bg-white/10 text-white px-6 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-5 h-5" /> Saiba Mais
              </button>
            </div>
            <p className="mt-5 text-xs text-blue-200/60 font-medium">
              Teste grátis por 7 dias. Não requer cartão de crédito.
            </p>
          </motion.div>

          <motion.div 
            className="flex-1 w-full max-w-2xl lg:max-w-none relative z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Dashboard Mockup */}
            <div className="relative rounded-2xl md:rounded-[2rem] bg-white shadow-2xl border border-gray-100 p-2 sm:p-4">
              <div className="absolute inset-0 bg-gradient-to-tr from-cm-blue/5 to-cm-green/5 rounded-2xl md:rounded-[2rem]"></div>
              <div className="rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-[4/3] flex flex-col relative z-10 shadow-inner">
                {/* Header Mockup */}
                <div className="h-10 md:h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1"></div>
                  <div className="w-32 h-4 bg-gray-100 rounded-full hidden sm:block"></div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200"></div>
                </div>
                {/* Body Mockup */}
                <div className="flex-1 p-2 md:p-4 flex gap-4">
                  {/* Sidebar Mockup */}
                  <div className="w-16 md:w-40 h-full bg-white rounded-lg border border-gray-200 hidden sm:block p-3">
                    <div className="h-6 bg-cm-blue/10 w-full rounded mb-3"></div>
                    <div className="h-6 bg-gray-100 w-full rounded mb-3"></div>
                    <div className="h-6 bg-gray-100 w-full rounded mb-3"></div>
                    <div className="h-6 bg-gray-100 w-3/4 rounded mb-3"></div>
                  </div>
                  {/* Main content Mockup */}
                  <div className="flex-1 flex flex-col gap-2 md:gap-4">
                    <div className="flex gap-2 md:gap-4 h-20 md:h-24">
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 flex flex-col justify-between">
                        <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                        <div className="h-6 md:h-8 w-3/4 bg-cm-blue/20 rounded"></div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 flex flex-col justify-between">
                        <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                        <div className="h-6 md:h-8 w-3/4 bg-cm-green/20 rounded"></div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 flex flex-col justify-between hidden md:flex">
                        <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                        <div className="h-8 w-1/2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white/80 rounded-lg border border-gray-200 relative overflow-hidden backdrop-blur-sm p-4 flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                         <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                         <div className="h-4 w-16 bg-gray-100 rounded"></div>
                       </div>
                       
                       {/* Chart bars mock */}
                       <div className="flex-1 flex items-end justify-between px-2 gap-1 md:gap-3">
                          {[40, 70, 45, 90, 65, 80, 55, 100].map((h, i) => (
                             <div key={i} className={`w-full rounded-t-sm transition-all ${i === 7 ? 'bg-cm-green' : 'bg-cm-blue/20'}`} style={{ height: `${h}%` }}></div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-2 md:-right-8 top-1/4 bg-white p-3 md:p-4 rounded-xl shadow-xl border border-gray-100 z-20 flex items-center gap-3 md:gap-4"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cm-green/10 flex items-center justify-center text-cm-green">
                  <BarChart2 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Vendas Hoje</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900">+ R$ 4.250</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
