import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <Logo className="w-12 h-12" />
            <span className="text-2xl font-black text-cm-blue tracking-tighter">
              Control<span className="text-cm-green">Market</span>
            </span>
          </div>

          <nav className="hidden md:flex gap-6">
            <a href="#funcionalidades" className="text-slate-600 hover:text-cm-blue font-medium text-xs uppercase tracking-widest transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="text-slate-600 hover:text-cm-blue font-medium text-xs uppercase tracking-widest transition-colors">Benefícios</a>
            <a href="#segmentos" className="text-slate-600 hover:text-cm-blue font-medium text-xs uppercase tracking-widest transition-colors">Segmentos</a>
            <a href="#planos" className="text-slate-600 hover:text-cm-blue font-medium text-xs uppercase tracking-widest transition-colors">Planos</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
              className="text-slate-600 hover:text-cm-blue font-medium text-xs uppercase tracking-widest transition-colors cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-signup'))}
              className="bg-cm-blue hover:bg-blue-900 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-colors shadow-md"
            >
              Solicitar Demonstração
            </button>
          </div>

          <button className="md:hidden text-slate-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-slate-100 px-4 py-4 absolute w-full shadow-lg"
        >
          <div className="flex flex-col gap-4">
            <a href="#funcionalidades" className="text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Funcionalidades</a>
            <a href="#beneficios" className="text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Benefícios</a>
            <a href="#segmentos" className="text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Segmentos</a>
            <a href="#planos" className="text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Planos</a>
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('open-login')); }}
                className="text-center text-cm-blue font-medium py-2.5 border border-cm-blue/20 rounded-lg hover:bg-slate-50"
              >
                Entrar
              </button>
              <button 
                onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('open-signup')); }}
                className="text-center bg-cm-green hover:bg-green-600 text-white font-medium py-2.5 rounded-lg"
              >
                Teste Grátis
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
