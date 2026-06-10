import React from 'react';
import { Printer, Share2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Logo from './Logo';

export interface ReceiptData {
  id: string;
  date: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: number;
  paymentMethod: string;
}

export default function Receipt({ data, onNewSale }: { data: ReceiptData, onNewSale: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Comprovante de Venda - ControlMarket\n\nNº: ${data.id}\nData: ${new Date(data.date).toLocaleString('pt-BR')}\nValor Total: R$ ${data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nForma de Pagamento: ${data.paymentMethod.toUpperCase()}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300 print:shadow-none print:max-w-full">
        <div className="p-6 text-center border-b border-slate-100 print:hidden">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">Pagamento Aprovado</h2>
          <p className="text-slate-500 mt-1">Transação concluída com sucesso.</p>
        </div>

        {/* Receipt Content to Print */}
        <div className="p-8 bg-white text-slate-800 text-sm font-mono print:p-4" id="receipt-content">
          <div className="flex flex-col items-center mb-6">
             <Logo className="w-10 h-10 mb-2 grayscale" />
             <h3 className="font-bold text-lg">CONTROLMARKET</h3>
             <p className="text-xs text-slate-500">CNPJ: 00.000.000/0001-00</p>
          </div>
          
          <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>DATA:</span>
              <span>{new Date(data.date).toLocaleDateString('pt-BR')} {new Date(data.date).toLocaleTimeString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>NSU:</span>
              <span>{data.id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-2">
              <span>DESC/QTD</span>
              <span>VL TOTAL</span>
            </div>
            {data.items.map((item, i) => {
              const price = parseFloat(item.price.replace(',', '.') || '0');
              const itemTotal = price * item.quantity;
              return (
                <div key={i} className="mb-2">
                  <div className="truncate">{item.name}</div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{item.quantity}x R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 pt-2 mb-4">
            <div className="flex justify-between text-lg font-black">
              <span>TOTAL</span>
              <span>R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-bold mt-1">
              <span>PAGAMENTO</span>
              <span className="uppercase">{data.paymentMethod}</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-slate-500 mt-8 mb-4">
            *** OBRIGADO PELA PREFERÊNCIA ***<br/>
            SISTEMA CONTROMARKET
          </div>
        </div>

        <div className="p-4 bg-slate-50 grid grid-cols-2 gap-3 print:hidden">
           <button onClick={handlePrint} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 font-bold hover:bg-slate-100 transition-colors text-slate-700">
             <Printer className="w-5 h-5" /> Imprimir
           </button>
           <button onClick={handleShare} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 border border-green-200 font-bold hover:bg-green-100 transition-colors">
             <Share2 className="w-5 h-5" /> WhatsApp
           </button>
           <button onClick={onNewSale} className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl bg-cm-blue text-white font-black hover:brightness-110 transition-colors shadow-md mt-2">
             <ArrowLeft className="w-5 h-5" /> Nova Venda
           </button>
        </div>
      </div>
    </div>
  );
}
