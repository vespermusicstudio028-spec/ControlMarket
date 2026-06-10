export type PaymentMethod = 'credito' | 'debito' | 'pix' | 'dinheiro' | null;

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'approved' | 'declined';
  timestamp: string;
}

export const processPayment = async (amount: number, method: PaymentMethod): Promise<PaymentTransaction> => {
  return new Promise((resolve, reject) => {
    const transactionId = Math.random().toString(36).substring(2, 15);
    
    // Simulate terminal interaction delay for Cards
    const delay = (method === 'credito' || method === 'debito') ? 3000 : 1000;

    setTimeout(() => {
      // Simulate 90% approval rate
      const isApproved = Math.random() > 0.1;
      
      if (isApproved || method === 'dinheiro' || method === 'pix') {
        resolve({
          id: transactionId,
          amount,
          method,
          status: 'approved',
          timestamp: new Date().toISOString()
        });
      } else {
        reject({
          id: transactionId,
          amount,
          method,
          status: 'declined',
          error: 'Transação recusada pelo emissor do cartão.',
          timestamp: new Date().toISOString()
        });
      }
    }, delay);
  });
};
