import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const upCart = [...cart];
      const isExistent = upCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const qtdAtual = isExistent ? isExistent.amount : 0;
      const amount = qtdAtual + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (isExistent) {
        isExistent.amount = amount;
      } else {
        const produto = await api.get(`/products/${productId}`)
        const novoProduto = {
          ...produto.data,
          amount: 1
        }
        upCart.push(novoProduto);
      }
      setCart(upCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart));



    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const upCart = [...cart];
      const productIndex = upCart.findIndex(product => product.id === productId)

      if(productIndex >= 0){
        upCart.splice(productIndex, 1);
        setCart(upCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart));
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if ( amount <= 0 ) {
        return;
      }
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const upCart = [...cart];
      const isExistent = upCart.find(product => product.id === productId);

      if(isExistent) {
        isExistent.amount = amount;
        setCart(upCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart));
      } else{
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
