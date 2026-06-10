import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 text-slate-500 font-medium text-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-4">
              <Logo className="w-10 h-10" />
              <span className="text-xl font-black text-cm-blue tracking-tighter">
                Control<span className="text-cm-green">Market</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">ControlMarket © 2026</p>
            <p className="text-xs text-slate-400">Controle Inteligente, Resultados Reais</p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
            <a href="#" className="hover:text-cm-blue transition-colors">Início</a>
            <a href="#funcionalidades" className="hover:text-cm-blue transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-cm-blue transition-colors">Planos</a>
            <a href="#contato" className="hover:text-cm-blue transition-colors">Contato</a>
            <a href="#privacidade" className="hover:text-cm-blue transition-colors">Política de Privacidade</a>
          </div>

        </div>
      </div>
    </footer>
  );
}
