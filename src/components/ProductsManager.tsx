import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Edit2, Trash2, X, CheckCircle2, Barcode, Camera, Zap, ZapOff, ImagePlus } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { saveProductToCloud, deleteProductFromCloud } from '../lib/syncService';

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
  updated_at?: string;
}

export default function ProductsManager({ userId }: { userId: string }) {
  const storageKey = `controlmarket_products_${userId}`;

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse products from local storage');
      }
    }
    return [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [minStock, setMinStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null); // Limpar erro anterior

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setImageUrl(dataUrl);
        
        // Use Gemini API to extract details
        try {
          setIsAnalyzing(true);
          console.log('Enviando imagem para análise...');
          const response = await fetch('/api/product/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl, mimeType: 'image/jpeg' })
          });
          
          console.log('Resposta recebida:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Dados analisados:', data);
            
            if (data.name) {
              // Build complete name with unit and quantity if available
              let completeProductName = data.name || '';
              if (data.quantity && data.unit) {
                completeProductName = `${completeProductName} ${data.quantity}${data.unit}`;
              } else if (data.quantity) {
                completeProductName = `${completeProductName} ${data.quantity}`;
              } else if (data.unit) {
                completeProductName = `${completeProductName} ${data.unit}`;
              }
              
              console.log('Nome completo do produto:', completeProductName);
              setName(completeProductName);
            }
            if (data.barcode && data.barcode.trim()) {
              console.log('Código de barras encontrado:', data.barcode);
              setBarcode(data.barcode);
            }
          } else {
            const errorText = await response.text();
            console.error('Erro na análise:', response.status, errorText);
            
            let errorMessage = 'Erro ao analisar imagem. Tente novamente.';
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.code === 'GEMINI_API_KEY_NOT_SET') {
                errorMessage = 'Serviço de análise não configurado. Contate o administrador.';
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (e) {
              // JSON parse failed, use generic message
              if (response.status === 503) {
                errorMessage = 'Serviço de análise temporariamente indisponível.';
              }
            }
            
            setAnalysisError(errorMessage);
          }
        } catch (err) {
          console.error("Erro na análise da imagem:", err);
          setAnalysisError('Erro ao conectar com o servidor de análise. Tente novamente.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Save to local storage whenever products change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(products));
    window.dispatchEvent(new Event('productsChanged'));
  }, [products, storageKey]);

  // Listen for background updates (e.g. from cloud sync)
  useEffect(() => {
    const handleProductsChange = () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(products)) {
            setProducts(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('productsChanged', handleProductsChange);
    return () => {
      window.removeEventListener('productsChanged', handleProductsChange);
    };
  }, [storageKey, products]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
    setBarcode('');
    setCostPrice('');
    setProfitMargin('');
    setMinStock('');
    setImageUrl('');
    setAnalysisError(null);
    setIsScanning(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setStock(product.stock);
    setBarcode(product.barcode || '');
    setCostPrice(product.cost_price || '');
    setProfitMargin(product.profit_margin || '');
    setMinStock(product.min_stock || '');
    setImageUrl(product.image_url || '');
    setIsScanning(false);
    setIsModalOpen(true);
  };

  const deleteProduct = (id: string) => {
    if (window.confirm("Certeza que deseja excluir este produto?")) {
      setProducts(products.filter(p => p.id !== id));
      deleteProductFromCloud(userId, id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const currentTimestamp = new Date().toISOString();

    if (editingId) {
      const updatedProduct = { 
        id: editingId, 
        name, 
        price, 
        stock, 
        barcode, 
        cost_price: costPrice, 
        profit_margin: profitMargin, 
        min_stock: minStock, 
        image_url: imageUrl,
        updated_at: currentTimestamp
      };
      setProducts(products.map(p => 
        p.id === editingId ? updatedProduct : p
      ));
      saveProductToCloud(userId, updatedProduct);
    } else {
      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        price,
        stock,
        barcode,
        cost_price: costPrice,
        profit_margin: profitMargin,
        min_stock: minStock,
        image_url: imageUrl,
        updated_at: currentTimestamp
      };
      setProducts([...products, newProduct]);
      saveProductToCloud(userId, newProduct);
    }
    setIsModalOpen(false);
  };

  const parseNumber = (val: string) => parseFloat(val.replace(',', '.')) || 0;
  const formatNumber = (val: number) => val.toFixed(2).replace('.', ',');

  const suggestedPrice = costPrice && profitMargin ? formatNumber(parseNumber(costPrice) * (1 + parseNumber(profitMargin) / 100)) : '';

  const actualProfitMargin = costPrice && price && parseNumber(costPrice) > 0 
    ? (((parseNumber(price) - parseNumber(costPrice)) / parseNumber(costPrice)) * 100).toFixed(1).replace('.', ',') + '%'
    : '';

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-cm-blue">Produtos</h1>
          <p className="text-slate-500 mt-2">Gerencie seu catálogo de produtos.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-cm-green hover:brightness-110 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Produto
        </button>
      </header>

      {products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum produto cadastrado</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Seu catálogo está vazio. Comece a adicionar produtos para começar a vender.
          </p>
          <button 
            onClick={openAddModal}
            className="bg-cm-blue hover:brightness-125 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Produto</th>
                  <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Código</th>
                  <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Preço</th>
                  <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Estoque</th>
                  <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm font-mono">{product.barcode || '-'}</td>
                    <td className="py-4 px-6 text-slate-600">R$ {product.price}</td>
                    <td className="py-4 px-6 text-slate-600">{product.stock || '-'}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2 text-slate-400 hover:text-cm-blue hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h3 className="text-2xl font-extrabold text-cm-blue mb-6">
                {editingId ? 'Editar Produto' : 'Cadastrar Produto'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div 
                      className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden transition-all ${
                        imageUrl ? 'border-transparent' : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt="Preview" className={`w-full h-full object-cover transition-opacity ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`} />
                          {isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="w-5 h-5 border-2 border-cm-blue/30 border-t-cm-blue rounded-full animate-spin mb-1"></span>
                              <span className="text-[9px] font-bold text-cm-blue uppercase tracking-wider text-center px-1 bg-white/80 rounded">Analisando...</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center w-full h-full">
                          <button 
                            type="button"
                            className="flex-1 w-full flex flex-col items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-cm-blue"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImagePlus className="w-6 h-6 mb-1" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Galeria</span>
                          </button>
                          <div className="h-[1px] w-full bg-slate-200"></div>
                          <button 
                            type="button"
                            className="flex-1 w-full flex flex-col items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-cm-green"
                            onClick={() => cameraInputRef.current?.click()}
                          >
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Câmera</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl('');
                          setAnalysisError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          if (cameraInputRef.current) cameraInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageCapture}
                    />
                    <input 
                      type="file" 
                      accept="image/*"
                      capture="environment"
                      className="hidden" 
                      ref={cameraInputRef}
                      onChange={handleImageCapture}
                    />
                  </div>
                </div>

                {analysisError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <div className="text-red-500 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Erro na análise</p>
                      <p className="text-sm text-red-600">{analysisError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Código de Barras</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Barcode className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                        placeholder="Ex: 7891234567890"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScanning(!isScanning)}
                      className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isScanning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {isScanning ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isScanning && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 relative overflow-hidden">
                    <ScannerElement onScan={(text) => {
                      setBarcode(text);
                      setIsScanning(false);
                    }} />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Nome do Produto</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="Ex: Camiseta Básica"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Custo (R$)</label>
                    <input
                      type="text"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Lucro (%)</label>
                    <input
                      type="text"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="45"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Sugestão (R$)</label>
                    <input
                      disabled
                      type="text"
                      value={suggestedPrice}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Preço de Venda (R$)</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                        placeholder="0,00"
                      />
                      {actualProfitMargin && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-xs font-bold text-cm-green">{actualProfitMargin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Estoque Atual</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cm-green focus:ring-2 focus:ring-cm-green/20 outline-none transition-all bg-slate-50 focus:bg-white"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-cm-green hover:brightness-110 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ScannerElement({ onScan }: { onScan: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraState, setCameraState] = useState<'starting' | 'running' | 'error'>('starting');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let startPromise: Promise<any> | null = null;

    const initScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        startPromise = html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
          },
          (decodedText) => {
            if (isMounted && onScanRef.current) {
              onScanRef.current(decodedText);
            }
          },
          (errorMessage) => {
            // parse errors
          }
        );
        
        await startPromise;
        if (isMounted) setCameraState('running');
      } catch (err: any) {
        if (isMounted) {
          setError("Não foi possível acessar a câmera. Verifique as permissões de acesso.");
          setCameraState('error');
        }
        console.error("Error starting scanner:", err);
      }
    };

    // Small delay to ensure DOM is ready and prevent strict mode double-firing overlap
    const timer = setTimeout(initScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && startPromise) {
        startPromise.then(() => {
          html5QrCode?.stop().then(() => {
            html5QrCode?.clear();
          }).catch(() => {
            html5QrCode?.clear();
          });
        }).catch(() => {
          // start failed, nothing to stop
          html5QrCode?.clear();
        });
      }
    };
  }, []); // Empty dependency array prevents restart loops

  const toggleFlash = async () => {
    if (!scannerRef.current || cameraState !== 'running') return;
    try {
      const newState = !isFlashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }] as any
      });
      setIsFlashOn(newState);
    } catch (err) {
      console.error("Failed to toggle flash", err);
      alert("A lanterna não é suportada ou ocorreu um erro neste dispositivo.");
    }
  };

  return (
    <div className="w-full relative">
      {error && <div className="p-4 mb-2 text-sm text-red-500 bg-red-50 rounded-lg text-center relative z-10">{error}</div>}
      {/* 
        DO NOT place any React children inside #reader. 
        html5-qrcode manipulates the DOM inside this element. 
        If React tries to update its children later, it will throw a NotFoundError and crash the app with a white screen.
      */}
      <div id="reader" className="w-full overflow-hidden rounded-lg bg-black min-h-[200px]"></div>
      
      {cameraState === 'running' && (
        <button
          type="button"
          onClick={toggleFlash}
          className="absolute bottom-4 right-4 z-[20] shadow-lg bg-white/20 hover:bg-white/40 p-3 rounded-full backdrop-blur-md transition-colors"
          title={isFlashOn ? "Desligar lanterna" : "Ligar lanterna"}
        >
          {isFlashOn ? <ZapOff className="w-6 h-6 text-yellow-300" /> : <Zap className="w-6 h-6 text-white" />}
        </button>
      )}
    </div>
  );
}
