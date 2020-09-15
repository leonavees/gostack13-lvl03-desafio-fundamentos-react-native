import React, {
    createContext,
    useState,
    useCallback,
    useContext,
    useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
    id: string;
    title: string;
    image_url: string;
    price: number;
    quantity: number;
}

interface CartContext {
    products: Product[];
    addToCart(item: Omit<Product, 'quantity'>): void;
    increment(id: string): void;
    decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        async function loadProducts(): Promise<void> {
            const storageProducts = await AsyncStorage.getItem(
                '@GoMarketplace:cart',
            );

            if (storageProducts) {
                setProducts(JSON.parse(storageProducts));
            }
        }

        loadProducts();
    }, []);

    const addToCart = useCallback(
        async (product: Product) => {
            const productExistsIndex = products.findIndex(
                item => item.id === product.id,
            );

            if (productExistsIndex < 0) {
                product.quantity = 1;
                setProducts(state => [...state, product]);
            } else {
                const newCartProducts = products.map(item => {
                    if (item.id === product.id) {
                        item.quantity += 1;
                    }

                    return item;
                });

                setProducts(newCartProducts);
            }

            await AsyncStorage.setItem(
                '@GoMarketplace:cart',
                JSON.stringify(products),
            );
        },
        [products],
    );

    const increment = useCallback(
        async id => {
            setProducts(state => {
                return state.map(product => {
                    if (product.id === id) {
                        product.quantity += 1;
                    }

                    return product;
                });
            });

            await AsyncStorage.setItem(
                '@GoMarketplace:cart',
                JSON.stringify(products),
            );
        },
        [products],
    );

    const decrement = useCallback(
        async id => {
            const product = products.find(item => item.id === id) as Product;

            if (product.quantity - 1 <= 0) {
                setProducts(state => state.filter(item => item.id !== id));
            } else {
                setProducts(state =>
                    state.map(item => {
                        if (item.id === product.id) {
                            item.quantity -= 1;
                        }

                        return item;
                    }),
                );
            }

            await AsyncStorage.setItem(
                '@GoMarketplace:cart',
                JSON.stringify(products),
            );
        },
        [products],
    );

    const value = React.useMemo(
        () => ({ addToCart, increment, decrement, products }),
        [products, addToCart, increment, decrement],
    );

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};

function useCart(): CartContext {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(`useCart must be used within a CartProvider`);
    }

    return context;
}

export { CartProvider, useCart };
