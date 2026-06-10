import { supabase } from './supabase';

export type SyncStatus = 'synced' | 'local_only' | 'offline' | 'syncing';

export interface SyncDetails {
  status: SyncStatus;
  lastSynced: string | null;
  error?: string;
}

// Broadcasters
const broadcastProductsChanged = () => {
  window.dispatchEvent(new Event('productsChanged'));
};

const broadcastSalesChanged = () => {
  window.dispatchEvent(new Event('salesChanged'));
};

const broadcastSyncStatusChanged = () => {
  window.dispatchEvent(new Event('syncStatusChanged'));
};

// Internal state
let currentSyncDetails: SyncDetails = {
  status: 'syncing',
  lastSynced: null
};

export const getSyncDetails = (): SyncDetails => {
  return currentSyncDetails;
};

const setSyncDetails = (details: Partial<SyncDetails>) => {
  currentSyncDetails = { ...currentSyncDetails, ...details };
  broadcastSyncStatusChanged();
};

/**
 * Perform bi-directional sync for Products
 */
export const syncProducts = async (userId: string): Promise<boolean> => {
  const storageKey = `controlmarket_products_${userId}`;
  const localRaw = localStorage.getItem(storageKey);
  const localProducts = localRaw ? JSON.parse(localRaw) : [];

  try {
    // 1. Fetch from Supabase
    const { data: remoteProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        setSyncDetails({ 
          status: 'local_only', 
          error: 'Tabela "products" não existe no Supabase. Crie-a usando o script SQL abaixo.' 
        });
      } else {
        setSyncDetails({ 
          status: 'offline', 
          error: `Erro ao sincronizar produtos: ${error.message}` 
        });
      }
      return false;
    }

    const remoteProds = remoteProducts || [];
    const hasUpdatedAtColumn = remoteProds.length === 0 || ('updated_at' in remoteProds[0]);

    // 2. Last-Write-Wins Union & Merge
    const mergedMap = new Map<string, any>();
    
    // Add remote products first
    remoteProds.forEach((rp: any) => {
      mergedMap.set(rp.id, {
        id: rp.id,
        name: rp.name,
        price: rp.price,
        stock: rp.stock,
        barcode: rp.barcode || '',
        cost_price: rp.cost_price || '',
        profit_margin: rp.profit_margin || '',
        min_stock: rp.min_stock || '',
        image_url: rp.image_url || '',
        updated_at: rp.updated_at || new Date(0).toISOString()
      });
    });

    // Merge local products with Last-Write-Wins
    localProducts.forEach((lp: any) => {
      const existing = mergedMap.get(lp.id);
      if (!existing) {
        // Local-only product (e.g. created offline)
        mergedMap.set(lp.id, {
          ...lp,
          updated_at: lp.updated_at || new Date().toISOString()
        });
      } else {
        // Compare updated_at timestamps
        if (hasUpdatedAtColumn) {
          const localTime = lp.updated_at ? new Date(lp.updated_at).getTime() : 0;
          const remoteTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
          
          if (localTime > remoteTime) {
            // Local is newer
            mergedMap.set(lp.id, lp);
          } else {
            // Remote is newer (Keep remote)
          }
        } else {
          // Fallback legacy behavior: local version wins
          mergedMap.set(lp.id, lp);
        }
      }
    });

    const finalProducts = Array.from(mergedMap.values());

    // 3. Save merged back into local storage
    localStorage.setItem(storageKey, JSON.stringify(finalProducts));
    broadcastProductsChanged();

    // 4. Push final merged products list back to remote
    const toUpsert = finalProducts.map((p: any) => {
      const item: any = {
        id: p.id,
        user_id: userId,
        name: p.name,
        price: p.price,
        stock: p.stock,
        barcode: p.barcode || '',
        cost_price: p.cost_price || '',
        profit_margin: p.profit_margin || '',
        min_stock: p.min_stock || '',
        image_url: p.image_url || ''
      };
      if (hasUpdatedAtColumn) {
        item.updated_at = p.updated_at || new Date().toISOString();
      }
      return item;
    });

    if (toUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('products')
        .upsert(toUpsert);
      
      if (upsertError) {
        // Self-heal: If updated_at is missing from remote table schema, try to upsert without it
        if (upsertError.message?.includes('column "updated_at"') || upsertError.code === '42703') {
          const fallbackUpsert = toUpsert.map(({ updated_at, ...rest }) => rest);
          const { error: fallbackError } = await supabase
            .from('products')
            .upsert(fallbackUpsert);
          
          if (fallbackError) {
            console.error("Fallback products upsert failed:", fallbackError);
            setSyncDetails({ 
              status: 'offline', 
              error: `Erro ao enviar produtos para a nuvem: ${fallbackError.message}` 
            });
            return false;
          }
        } else {
          console.error("Error upserting products to cloud:", upsertError);
          setSyncDetails({ 
            status: 'offline', 
            error: `Erro ao enviar produtos para a nuvem: ${upsertError.message}` 
          });
          return false;
        }
      }
    }

    return true;
  } catch (err: any) {
    console.error("Error during products cloud sync:", err);
    setSyncDetails({ status: 'offline', error: err.message || String(err) });
    return false;
  }
};

/**
 * Perform bi-directional sync for Sales
 */
export const syncSales = async (userId: string): Promise<boolean> => {
  const storageKey = `controlmarket_sales_${userId}`;
  const localRaw = localStorage.getItem(storageKey);
  const localSales = localRaw ? JSON.parse(localRaw) : [];

  try {
    // 1. Fetch from Supabase
    const { data: remoteSales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        setSyncDetails({ 
          status: 'local_only', 
          error: 'Tabela "sales" não existe no Supabase. Crie-a usando o script SQL abaixo.' 
        });
      } else {
        setSyncDetails({ 
          status: 'offline', 
          error: `Erro ao sincronizar vendas: ${error.message}` 
        });
      }
      return false;
    }

    const remSales = remoteSales || [];

    // 2. Union & Merge (Sales are immutable, unioning by ID is safe)
    const mergedMap = new Map<string, any>();
    
    remSales.forEach((rs: any) => {
      mergedMap.set(rs.id, {
        id: rs.id,
        date: rs.date,
        items: rs.items,
        total: parseFloat(rs.total),
        paymentMethod: rs.payment_method
      });
    });

    localSales.forEach((ls: any) => {
      mergedMap.set(ls.id, ls);
    });

    const finalSales = Array.from(mergedMap.values());

    // 3. Save merged to LocalStorage
    localStorage.setItem(storageKey, JSON.stringify(finalSales));
    broadcastSalesChanged();

    // 4. Push local-only variations to remote
    const toInsert = finalSales.map((s: any) => ({
      id: s.id,
      user_id: userId,
      date: s.date,
      items: s.items,
      total: String(s.total),
      payment_method: s.paymentMethod
    }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('sales')
        .upsert(toInsert);
      
      if (insertError) {
        console.error("Error pushing sales to cloud:", insertError);
        setSyncDetails({ 
          status: 'offline', 
          error: `Erro ao enviar vendas para a nuvem: ${insertError.message}` 
        });
        return false;
      }
    }

    return true;
  } catch (err: any) {
    console.error("Error during sales cloud sync:", err);
    setSyncDetails({ status: 'offline', error: err.message || String(err) });
    return false;
  }
};

/**
 * Main function to run full bi-directional sync
 */
export const runFullSync = async (userId: string) => {
  if (!userId) return;
  
  setSyncDetails({ status: 'syncing', error: undefined });

  const prodSuccess = await syncProducts(userId);
  const salesSuccess = await syncSales(userId);

  if (prodSuccess && salesSuccess) {
    setSyncDetails({
      status: 'synced',
      lastSynced: new Date().toLocaleTimeString('pt-BR'),
      error: undefined
    });
  }
};

/**
 * Subscribe to real-time additions/modifications in the cloud
 */
export const subscribeToCloudChanges = (userId: string, onUpdate: () => void) => {
  if (!userId) return () => {};

  const productsChannel = supabase
    .channel(`realtime-products-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('Real-time product push received:', payload);
        await syncProducts(userId);
        onUpdate();
      }
    )
    .subscribe();

  const salesChannel = supabase
    .channel(`realtime-sales-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sales',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('Real-time sales push received:', payload);
        await syncSales(userId);
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(productsChannel);
    supabase.removeChannel(salesChannel);
  };
};

/**
 * Save single product directly to cloud (background/fire-and-forget style)
 */
export const saveProductToCloud = async (userId: string, product: any) => {
  try {
    const payload: any = {
      id: product.id,
      user_id: userId,
      name: product.name,
      price: product.price,
      stock: product.stock,
      barcode: product.barcode || '',
      cost_price: product.cost_price || '',
      profit_margin: product.profit_margin || '',
      min_stock: product.min_stock || '',
      image_url: product.image_url || '',
      updated_at: product.updated_at || new Date().toISOString()
    };
    
    const { error } = await supabase.from('products').upsert(payload);
    if (error) {
      if (error.message?.includes('column "updated_at"') || error.code === '42703') {
        const { updated_at, ...fallbackPayload } = payload;
        const { error: fallbackError } = await supabase.from('products').upsert(fallbackPayload);
        if (fallbackError) {
          console.error("Background fallback product upload failed:", fallbackError);
        }
      } else {
        console.error("Background product upload failed:", error);
      }
    }
  } catch (e) {
    console.error("Background product upload failed:", e);
  }
};

/**
 * Delete product from cloud
 */
export const deleteProductFromCloud = async (userId: string, productId: string) => {
  try {
    await supabase.from('products').delete().eq('id', productId).eq('user_id', userId);
  } catch (e) {
    console.error("Background product delete failed:", e);
  }
};

/**
 * Save single sale to cloud
 */
export const saveSaleToCloud = async (userId: string, sale: any) => {
  try {
    await supabase.from('sales').insert({
      id: sale.id,
      user_id: userId,
      date: sale.date,
      items: sale.items,
      total: String(sale.total),
      payment_method: sale.paymentMethod
    });
  } catch (e) {
    console.error("Background sale upload failed:", e);
  }
};
