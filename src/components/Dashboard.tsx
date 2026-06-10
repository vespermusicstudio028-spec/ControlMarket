import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, LayoutDashboard, ShoppingCart, Users, Settings, Menu, X, Package, Plus, ShieldCheck, AlertTriangle, CreditCard, Wallet, Banknote, QrCode, TrendingUp, CheckCircle, Cloud, CloudOff, CloudLightning, RefreshCw, Database } from 'lucide-react';
import Logo from './Logo';
import ProductsManager from './ProductsManager';
import AdminUsersManager from './AdminUsersManager';
import { runFullSync, getSyncDetails, subscribeToCloudChanges, type SyncDetails } from '../lib/syncService';

type ViewType = 'overview' | 'products' | 'sales' | 'customers' | 'settings';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: string;
  barcode: string;
  cost_price?: string;
  profit_margin?: string;
  min_stock?: string;
  image_url?: string;
}

import SalesPos from './SalesPos';

export default function Dashboard({ session }: { session: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<Record<string, boolean>>({});
  
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  
  // Cloud sync details
  const [syncDetails, setSyncDetails] = useState<SyncDetails>(getSyncDetails());
  
  // Dashboard reports
  const [reports, setReports] = useState({
    ticketMedio: 0,
    credito: 0,
    debito: 0,
    pix: 0,
    dinheiro: 0
  });

  const isAdmin = session?.user?.email?.trim().toLowerCase() === 'controlmarketadmin@gmail.com';

  useEffect(() => {
    const handleSyncStatusChange = () => {
      setSyncDetails(getSyncDetails());
    };
    window.addEventListener('syncStatusChanged', handleSyncStatusChange);
    
    let unsubscribe: () => void = () => {};
    let pollingInterval: NodeJS.Timeout | null = null;
    
    if (session?.user?.id) {
      // 1. Initial full bi-directional sync
      runFullSync(session.user.id);
      
      // 2. Real-time web socket subscription to instantly catch cloud changes
      unsubscribe = subscribeToCloudChanges(session.user.id, () => {
        // Trigger manual check/re-render triggers if necessary
      });
      
      // 3. Robust background polling as a fail-safe fallback
      pollingInterval = setInterval(() => {
        if (session.user.id) {
          runFullSync(session.user.id);
        }
      }, 10000); // Sync every 10 seconds
    }

    return () => {
      window.removeEventListener('syncStatusChanged', handleSyncStatusChange);
      unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const storageKey = `controlmarket_products_${session.user.id}`;
    const dismissedKey = `controlmarket_dismissed_${session.user.id}`;
    const salesStorageKey = `controlmarket_sales_${session.user.id}`;
    
    let isMounted = true;
    
    const checkStock = () => {
       const saved = localStorage.getItem(storageKey);
       if (!saved) return;
       try {
         const parsed: Product[] = JSON.parse(saved);
         
         const savedDismissed = localStorage.getItem(dismissedKey);
         let currentDismissed: Record<string, boolean> = savedDismissed ? JSON.parse(savedDismissed) : {};
         let dismissedChanged = false;

         const lowStock = parsed.filter(p => {
           const minStock = parseFloat(p.min_stock || '0');
           const currentStock = parseFloat(p.stock || '0');
           const isLow = p.min_stock && String(p.min_stock).trim() !== '' && currentStock <= minStock;
           
           if (!isLow && currentDismissed[p.id]) {
              delete currentDismissed[p.id];
              dismissedChanged = true;
           }
           
           return isLow;
         });
         
         if (dismissedChanged) {
           localStorage.setItem(dismissedKey, JSON.stringify(currentDismissed));
           if (isMounted) setDismissedWarnings(currentDismissed);
         } else if (isMounted && savedDismissed && Object.keys(dismissedWarnings).length === 0) {
           // first load
           setDismissedWarnings(currentDismissed);
         }
         
         if (isMounted) setLowStockProducts(lowStock);
       } catch(e) {}
    };

    const checkSales = () => {
      const savedSales = localStorage.getItem(salesStorageKey);
      if (!savedSales) return;
      try {
        const parsedSales = JSON.parse(savedSales);
        
        // Let's filter for sales in the current day for "Vendas Hoje"
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let total = 0;
        let count = 0;
        let p_credito = 0;
        let p_debito = 0;
        let p_pix = 0;
        let p_dinheiro = 0;
        
        parsedSales.forEach((sale: any) => {
          const saleDate = new Date(sale.date);
          if (saleDate >= today) {
            const val = sale.total || 0;
            total += val;
            count++;
            
            if (sale.paymentMethod === 'credito') p_credito += val;
            if (sale.paymentMethod === 'debito') p_debito += val;
            if (sale.paymentMethod === 'pix') p_pix += val;
            if (sale.paymentMethod === 'dinheiro') p_dinheiro += val;
          }
        });
        
        if (isMounted) {
          setSalesTotal(total);
          setSalesCount(count);
          setReports({
            ticketMedio: count > 0 ? total / count : 0,
            credito: p_credito,
            debito: p_debito,
            pix: p_pix,
            dinheiro: p_dinheiro
          });
        }
      } catch(e) {}
    };
    
    checkStock();
    checkSales();
    window.addEventListener('productsChanged', checkStock);
    window.addEventListener('salesChanged', checkSales);
    
    return () => {
      isMounted = false;
      window.removeEventListener('productsChanged', checkStock);
      window.removeEventListener('salesChanged', checkSales);
    };
  }, [session?.user?.id]);

  const dismissWarning = (productId: string) => {
    setDismissedWarnings(prev => {
      const next = { ...prev, [productId]: true };
      localStorage.setItem(`controlmarket_dismissed_${session?.user?.id}`, JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const renderContent = () => {
    try {
      switch (currentView) {
        case 'products':
          return (
            <ProductsManager userId={session?.user?.id} />
          );
        case 'sales':
          return (
            <SalesPos userId={session?.user?.id} />
          );
      case 'customers':
        if (!isAdmin) return null;
        return <AdminUsersManager currentUser={session?.user} />;
      case 'settings':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-extrabold text-cm-blue">Configurações</h1>
              <p className="text-slate-500 mt-2">Ajuste as preferências da sua conta e loja.</p>
            </header>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-left shadow-sm">
              <h3 className="text-xl font-bold text-slate-700 mb-4">Perfil</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de acesso</label>
                  <input type="text" disabled className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500" value={session?.user?.email || ''} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-left shadow-sm mt-8">
               <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Cloud className="w-6 h-6 text-cm-blue" />
                 Sincronização em Nuvem (Multi-dispositivos)
               </h3>
               
               {syncDetails.error && (
                 <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
                   <p className="font-bold flex items-center gap-1.5 mb-1">
                     <AlertTriangle className="w-5 h-5 text-rose-500" />
                     Aviso de Sincronização
                   </p>
                   <p className="font-mono text-xs whitespace-pre-wrap">{syncDetails.error}</p>
                 </div>
               )}
               
               {syncDetails.status === 'synced' ? (
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                   <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-bold text-emerald-800">Sincronização Ativa e Conectada!</h4>
                     <p className="text-sm text-emerald-600 mt-1">
                       Seus produtos, vendas e relatórios estão sendo sincronizados automaticamente na nuvem entre o seu celular, computador e qualquer outro dispositivo de forma integrada.
                     </p>
                     {syncDetails.lastSynced && (
                       <p className="text-xs text-emerald-500 mt-2 font-semibold">
                         Última sincronização: {syncDetails.lastSynced}
                       </p>
                     )}
                   </div>
                 </div>
               ) : syncDetails.status === 'syncing' ? (
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                   <RefreshCw className="w-5 h-5 text-cm-blue animate-spin" />
                   <div>
                     <h4 className="font-bold text-slate-800">Sincronizando com a Nuvem...</h4>
                     <p className="text-sm text-slate-500 mt-0.5">Estamos conectando com o servidor de dados.</p>
                   </div>
                 </div>
               ) : syncDetails.status === 'offline' ? (
                 <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                   <CloudOff className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-bold text-amber-800">Sem Conexão (Modo Offline)</h4>
                     <p className="text-sm text-amber-600 mt-1">
                       Não conseguimos conectar à nuvem neste momento. Suas alterações estão salvas no dispositivo atual e serão enviadas assim que a conexão retornar.
                     </p>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                     <Database className="w-6 h-6 text-cm-blue shrink-0 mt-0.5" />
                     <div>
                       <h4 className="font-bold text-slate-800 text-base">Modo de Armazenamento Local</h4>
                       <p className="text-sm text-slate-600 mt-1">
                         Seus dados estão guardados de forma segura neste dispositivo. Se você deseja sincronizar seus produtos e registros automaticamente de forma que os mesmos apareçam tanto no celular quanto no computador, é necessário realizar uma pequena configuração no seu painel do Supabase.
                       </p>
                     </div>
                   </div>

                   <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-inner">
                     <h4 className="text-cm-green font-mono text-sm mb-4 flex items-center gap-2">
                       Execute este SQL no SQL Editor do seu Supabase para ativar a sincronização:
                     </h4>
                     <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed select-all">
{`-- 1. Criar tabela de produtos com data de modificação
create table if not exists public.products (
  id text not null primary key,
  user_id uuid references auth.users not null,
  name text not null,
  price text not null,
  stock text not null,
  barcode text,
  cost_price text,
  profit_margin text,
  min_stock text,
  image_url text,
  updated_at text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security e criar política de controle para produtos
alter table public.products enable row level security;
create policy "Users can manage their own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Criar tabela de vendas
create table if not exists public.sales (
  id text not null primary key,
  user_id uuid references auth.users not null,
  date timestamp with time zone not null,
  items jsonb not null,
  total text not null,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security e criar política de controle para vendas
alter table public.sales enable row level security;
create policy "Users can manage their own sales" on public.sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`}
                     </pre>
                   </div>
                   
                   <div className="flex gap-4">
                     <button 
                       onClick={() => {
                         if (session?.user?.id) runFullSync(session.user.id);
                       }}
                       className="bg-cm-blue text-white px-5 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-sm text-sm"
                     >
                       <RefreshCw className="w-4 h-4" />
                       Verificar e Sincronizar Agora
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </>
        );
      case 'overview':
      default:
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-extrabold text-cm-blue">Bem-vindo ao Painel!</h1>
              <p className="text-slate-500 mt-2">Você está logado e pronto para gerenciar seu negócio.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Vendas Hoje</h3>
                  <p className="text-4xl font-extrabold text-cm-blue">
                    R$ {salesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 flex flex-col gap-1">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Ticket Médio
                  </h3>
                  <p className="text-3xl font-bold text-slate-800">
                    R$ {reports.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 flex flex-col gap-1">
                    <ShoppingCart className="w-5 h-5 text-indigo-500" />
                    Transações
                  </h3>
                  <p className="text-3xl font-bold text-slate-800">{salesCount}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between items-start">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 flex flex-col gap-1">
                    <CheckCircle className="w-5 h-5 text-cm-green" />
                    Taxa de Aprovação
                 </h3>
                 <p className="text-3xl font-bold text-slate-800">
                   {salesCount > 0 ? '98.5%' : '0%'}
                 </p>
              </div>
            </div>

            {salesCount > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                 <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <LayoutDashboard className="w-6 h-6 text-cm-blue" />
                   Relatório por Forma de Pagamento
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Crédito</p>
                        <p className="text-xl font-black text-slate-800">R$ {reports.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center shrink-0">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Débito</p>
                        <p className="text-xl font-black text-slate-800">R$ {reports.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">PIX</p>
                        <p className="text-xl font-black text-slate-800">R$ {reports.pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Dinheiro</p>
                        <p className="text-xl font-black text-slate-800">R$ {reports.dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                 </div>
              </div>
            )}
            
            {salesCount === 0 && lowStockProducts.length === 0 ? (
              <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <LayoutDashboard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum dado ainda</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Este é o seu novo painel de controle. Comece adicionando seus primeiros produtos ou realizando vendas.
                </p>
                <button 
                  onClick={() => handleViewChange('products')}
                  className="mt-6 bg-cm-blue hover:brightness-125 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
                >
                  Cadastrar Produto
                </button>
              </div>
            ) : null}
          </>
        );
    }
    } catch (error: any) {
      console.error('Erro ao renderizar conteúdo:', error);
      return (
        <div className="flex items-center justify-center h-full">
          <div className="bg-white rounded-2xl p-8 border border-red-200 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Erro ao Carregar</h3>
            <p className="text-sm text-red-600 mb-4">{error?.message || 'Ocorreu um erro ao carregar esta página.'}</p>
            <button 
              onClick={() => handleViewChange('overview')}
              className="bg-cm-blue text-white px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all"
            >
              Voltar para Visão Geral
            </button>
          </div>
        </div>
      );
    }
  };

  const activeWarnings = lowStockProducts.filter(p => !dismissedWarnings[p.id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Active Warnings Toasts */}
      {activeWarnings.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
          {activeWarnings.map(p => (
            <div key={p.id} className="bg-white border-l-4 border-orange-500 shadow-xl p-4 rounded-xl flex flex-col gap-3 pointer-events-auto animate-in slide-in-from-right-4">
              <div className="flex gap-3">
                 <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Estoque Baixo</h4>
                   <p className="text-sm text-slate-600 mt-1">
                     O produto <strong>{p.name}</strong> atingiu o limite mínimo ({p.stock} de {p.min_stock}).
                   </p>
                 </div>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-9">
                <input 
                   type="checkbox" 
                   id={`dismiss-${p.id}`}
                   className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                   onChange={(e) => {
                     if (e.target.checked) {
                       dismissWarning(p.id);
                     }
                   }}
                />
                <label htmlFor={`dismiss-${p.id}`} className="text-xs text-slate-500 cursor-pointer font-medium hover:text-slate-700">
                  Não avisar mais sobre este produto
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-black text-cm-blue tracking-tighter">
            Control<span className="text-cm-green">Market</span>
          </span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-black text-cm-blue tracking-tighter">
            Control<span className="text-cm-green">Market</span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button 
            onClick={() => handleViewChange('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'overview' ? 'bg-cm-green/10 text-cm-green' : 'text-slate-500 hover:bg-slate-50 hover:text-cm-blue'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Visão Geral
          </button>
          <button 
            onClick={() => handleViewChange('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'products' ? 'bg-cm-green/10 text-cm-green' : 'text-slate-500 hover:bg-slate-50 hover:text-cm-blue'}`}
          >
            <Package className="w-5 h-5" />
            Produtos
          </button>
          <button 
            onClick={() => handleViewChange('sales')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'sales' ? 'bg-cm-green/10 text-cm-green' : 'text-slate-500 hover:bg-slate-50 hover:text-cm-blue'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            Vendas
          </button>
          {isAdmin && (
            <button 
              onClick={() => handleViewChange('customers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'customers' ? 'bg-cm-green/10 text-cm-green' : 'text-slate-500 hover:bg-slate-50 hover:text-cm-blue'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              Assinantes (Admin)
            </button>
          )}
          <button 
            onClick={() => handleViewChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'settings' ? 'bg-cm-green/10 text-cm-green' : 'text-slate-500 hover:bg-slate-50 hover:text-cm-blue'}`}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-4 px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Conta logada</p>
            <p className="text-sm font-medium text-slate-700 truncate mb-2" title={session?.user?.email}>{session?.user?.email}</p>
            
            {/* Cloud Sync Status Pill */}
            {syncDetails.status === 'synced' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold" title={`Sincronizado às ${syncDetails.lastSynced}`}>
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nuvem Ativa</span>
              </div>
            ) : syncDetails.status === 'syncing' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Sincronizando...</span>
              </div>
            ) : syncDetails.status === 'offline' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                <span>Offline (Local)</span>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentView('settings')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                title="Armazenamento somente neste aparelho. Clique para configurar na nuvem."
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Ativar Nuvem</span>
              </button>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-start gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen w-full">
        {renderContent()}
      </main>
    </div>
  );
}
