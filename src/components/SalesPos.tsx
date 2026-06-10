import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2, Barcode, Camera, Zap, ZapOff, Package, X, CreditCard, Wallet, Banknote, QrCode, Loader2, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { processPayment } from '../lib/paymentGateway';
import Receipt, { ReceiptData } from './Receipt';
import { saveProductToCloud, saveSaleToCloud } from '../lib/syncService';

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

interface CartItem extends Product {
  quantity: number;
}

type PaymentMethod = 'credito' | 'debito' | 'pix' | 'dinheiro' | null;

export default function SalesPos({ userId }: { userId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  // Manual Code state
  const [manualCode, setManualCode] = useState('');

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const storageKey = `controlmarket_products_${userId}`;

  useEffect(() => {
    const loadProducts = () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(products)) {
            setProducts(parsed);
          }
        } catch (e) {
          console.error('Failed to parse products from local storage');
        }
      }
    };
    
    loadProducts();
    window.addEventListener('productsChanged', loadProducts);
    return () => {
      window.removeEventListener('productsChanged', loadProducts);
    };
  }, [storageKey, products]);

  const startPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        if (startPromiseRef.current) {
          startPromiseRef.current.then(() => {
            scannerRef.current?.stop().then(() => {
              scannerRef.current?.clear();
            }).catch(() => {
              scannerRef.current?.clear();
            });
          }).catch(() => {
            scannerRef.current?.clear();
          });
        } else {
          try { scannerRef.current.clear(); } catch(e) {}
        }
      }
    };
  }, []);

  const toggleScanner = async () => {
    if (isScanning) {
      if (scannerRef.current && startPromiseRef.current) {
        try {
          await startPromiseRef.current;
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // ignore error if it fails to stop or wasn't running fully
          try { scannerRef.current.clear(); } catch(err) {}
        }
        scannerRef.current = null;
        startPromiseRef.current = null;
      }
      setIsScanning(false);
      setFlashEnabled(false);
      return;
    }

    try {
      setIsScanning(true);
      
      // small delay to allow DOM to render the reader div
      setTimeout(() => {
        try {
          const scanner = new Html5Qrcode("pos-reader");
          scannerRef.current = scanner;

          startPromiseRef.current = scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 150 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              handleBarcodeScanned(decodedText);
            },
            (error) => {
              // Ignore standard scanning errors
            }
          );
          
          startPromiseRef.current.catch((err) => {
            console.error("Failed to start scanner:", err);
            setIsScanning(false);
          });

        } catch (err) {
          console.error("Failed to setup scanner:", err);
          setIsScanning(false);
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      setIsScanning(false);
    }
  };

  const toggleFlash = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !flashEnabled } as any]
      });
      setFlashEnabled(!flashEnabled);
    } catch (err) {
      console.error("Failed to toggle flash:", err);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100); // 100ms beep
    } catch(e) {}
  };

  const productsRef = useRef<Product[]>([]);
  const lastScannedRef = useRef<{code: string, time: number}>({code: '', time: 0});

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const handleBarcodeScanned = (code: string) => {
    const now = Date.now();
    // Prevent scanning the exact same product within 2 seconds
    if (lastScannedRef.current.code === code && now - lastScannedRef.current.time < 2000) {
      return; 
    }

    const product = productsRef.current.find(p => p.barcode === code);
    if (product) {
      lastScannedRef.current = {code, time: now};
      addToCart(product);
      playBeep();
    }
  };

  const handleManualCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualCode(value);
    if (!value.trim()) return;
    
    const product = products.find(p => p.barcode === value.trim());
    if (product) {
      addToCart(product);
      playBeep();
      setManualCode('');
    }
  };

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existing = currentCart.find(item => item.id === product.id);
      if (existing) {
        return currentCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(currentCart => currentCart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !paymentMethod) return;
    
    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      // Send value to simulated integrated terminal
      await processPayment(total, paymentMethod);

      // Simulate checkout by decrementing stock
      const currentTimestamp = new Date().toISOString();
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          const currentStock = parseFloat(p.stock || '0');
          const newStock = Math.max(0, currentStock - cartItem.quantity);
          return { ...p, stock: newStock.toString(), updated_at: currentTimestamp };
        }
        return p;
      });

      localStorage.setItem(storageKey, JSON.stringify(updatedProducts));
      window.dispatchEvent(new Event('productsChanged'));
      
      // Replicate product stock changes in the background
      cart.forEach(cartItem => {
         const matchingProduct = updatedProducts.find(p => p.id === cartItem.id);
         if (matchingProduct) {
            saveProductToCloud(userId, matchingProduct);
         }
      });
      
      const saleId = crypto.randomUUID();
      const saleDate = new Date().toISOString();

      const sale = {
        id: saleId,
        date: saleDate,
        items: cart,
        total: total,
        paymentMethod
      };
      
      const salesStorageKey = `controlmarket_sales_${userId}`;
      const storedSales = localStorage.getItem(salesStorageKey);
      const sales = storedSales ? JSON.parse(storedSales) : [];
      sales.push(sale);
      localStorage.setItem(salesStorageKey, JSON.stringify(sales));
      window.dispatchEvent(new Event('salesChanged'));

      // Replicate sale to the cloud in the background
      saveSaleToCloud(userId, sale);

      // Show receipt
      setReceiptData({
        id: saleId,
        date: saleDate,
        items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
        total,
        paymentMethod
      });
      
      setShowPaymentModal(false);
      
    } catch (err: any) {
      setPaymentError(err.error || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setPaymentMethod(null);
    setReceiptData(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(',', '.') || '0');
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="h-full flex flex-col-reverse md:flex-row gap-6 p-6">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Pagamento</h3>
              {!isProcessingPayment && (
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isProcessingPayment ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-16 h-16 text-cm-blue animate-spin mb-6" />
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Processando...</h4>
                  <p className="text-slate-500 text-center">
                    {(paymentMethod === 'credito' || paymentMethod === 'debito') 
                      ? 'Aguardando aprovação no terminal de pagamento. Insira ou aproxime o cartão.'
                      : 'Finalizando transação no sistema...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Total a Pagar</p>
                    <div className="text-4xl font-black text-cm-blue">
                       R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {paymentError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-red-800">Transação Recusada</h5>
                        <p className="text-sm text-red-600 mt-1">{paymentError}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() => setPaymentMethod('credito')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'credito' ? 'border-cm-blue bg-blue-50 text-cm-blue' : 'border-slate-200 hover:border-cm-blue/50 text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="font-bold">Cartão de Crédito</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('debito')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'debito' ? 'border-cm-blue bg-blue-50 text-cm-blue' : 'border-slate-200 hover:border-cm-blue/50 text-slate-700'
                      }`}
                    >
                      <Wallet className="w-6 h-6" />
                      <span className="font-bold">Cartão de Débito</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-500/50 text-slate-700'
                      }`}
                    >
                      <QrCode className="w-6 h-6" />
                      <span className="font-bold">PIX</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('dinheiro')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'dinheiro' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-600/50 text-slate-700'
                      }`}
                    >
                      <Banknote className="w-6 h-6" />
                      <span className="font-bold">Dinheiro</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={!paymentMethod}
                    className="w-full mt-6 bg-cm-green hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Confirmar Transação
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <Receipt data={receiptData} onNewSale={handleNewSale} />
      )}

      {/* Left side: Products & Scanner */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header / Actions */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
               <Package className="w-16 h-16 text-slate-300 mb-4" />
               <p className="text-lg">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden hover:border-cm-green hover:shadow-md transition-all cursor-pointer group flex flex-col"
                >
                  <div className="aspect-square bg-slate-50 relative p-4 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{product.name}</h4>
                      <div className="text-xs text-slate-400 mt-1">{product.barcode || 'S/ Código'}</div>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="font-extrabold text-cm-blue">R$ {product.price}</span>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Est: {product.stock || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart / POS Panel */}
      <div className="w-full md:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-cm-blue" />
          <h2 className="text-lg font-black text-slate-800">Carrinho Atual</h2>
          <span className="ml-auto bg-cm-green text-white text-xs font-bold px-2 py-1 rounded-full">
            {cart.length} itens
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <ShoppingCart className="w-16 h-16 text-slate-200 mb-4" />
              <p>Adicione ou escaneie produtos para iniciar a venda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded bg-white" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded text-slate-300">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
                    <div className="text-cm-blue font-bold text-sm">R$ {item.price}</div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Panel */}
        <div className="p-6 bg-slate-50 border-t border-slate-200">
           <div className="flex justify-between items-end mb-6">
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</span>
             <span className="text-3xl font-black text-cm-blue">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
           </div>
           
           <button
            onClick={toggleScanner}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all shadow-md mb-4 ${
              isScanning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {isScanning ? <X className="w-6 h-6" /> : <Barcode className="w-6 h-6" />}
            {isScanning ? 'Parar Leitor' : 'Ler Código'}
          </button>

          {/* Scanner View */}
          {isScanning && (
            <div className="mb-4 bg-slate-900 rounded-xl p-4 overflow-hidden shadow-inner w-full flex flex-col items-center">
              <div className="w-full relative rounded-lg overflow-hidden bg-black aspect-square shadow-md">
                <div id="pos-reader" className="w-full h-full"></div>
                <button
                    type="button"
                    onClick={toggleFlash}
                    className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all z-10"
                    title="Flash"
                  >
                    {flashEnabled ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  </button>
              </div>
              <p className="text-center text-slate-300 mt-3 text-sm font-semibold">Escaneie o produto</p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={manualCode}
              onChange={handleManualCodeChange}
              placeholder="Digitar código do produto..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-cm-blue focus:ring-2 focus:ring-cm-blue/20"
            />
          </div>

           <button
             onClick={() => setShowPaymentModal(true)}
             disabled={cart.length === 0}
             className="w-full bg-cm-green hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
           >
             <CheckCircle2 className="w-6 h-6" />
             Finalizar Venda
           </button>
        </div>

      </div>
    </div>
  );
}
