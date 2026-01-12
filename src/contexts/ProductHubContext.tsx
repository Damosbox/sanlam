import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { ProductType } from "@/components/broker/dashboard/ProductSelector";

interface ProductHubContextType {
  selectedProduct: ProductType;
  setSelectedProduct: (product: ProductType) => void;
}

const ProductHubContext = createContext<ProductHubContextType | undefined>(undefined);

const STORAGE_KEY = "product-hub-selected-product";

export const ProductHubProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored as ProductType;
    }
    return "all";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedProduct);
  }, [selectedProduct]);

  return (
    <ProductHubContext.Provider value={{ selectedProduct, setSelectedProduct }}>
      {children}
    </ProductHubContext.Provider>
  );
};

export const useProductHub = () => {
  const context = useContext(ProductHubContext);
  if (!context) {
    throw new Error("useProductHub must be used within a ProductHubProvider");
  }
  return context;
};
