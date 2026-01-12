import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Prisma } from "@e-com/db";

type Location = {
  country: string;
  city: string;
} | null;

type Store = {
  cart: Prisma.ProductCreateInput[];
  wishList: Prisma.ProductCreateInput[];
  addToCart: (product: Prisma.ProductCreateInput, user: Prisma.UserCreateInput, location: Location, deviceInfo: string) => void;
  removeFromCart: (id: string, user: Prisma.UserCreateInput, location: Location, deviceInfo: string) => void;
  addToWishlist: (product: Prisma.ProductCreateInput, user: Prisma.UserCreateInput, location: Location, deviceInfo: string) => void;
  removeFromWishlist: (id: string, user: Prisma.UserCreateInput, location: Location, deviceInfo: string) => void;
};

export const useCartStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishList: [],

      // We are sending user, location and deviceInfo for the Kafka serve
      addToCart: (product, user, location, deviceInfo) => {
        set((state) => {
          const existingProduct = state.cart.find((item) => item.id === product.id);
          if (existingProduct) {
            cart: state.cart.map((item) => (item.id === product.id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item));
          }

          return {
            cart: [...state.cart, { ...product, quantity: product?.quantity }],
          };
        });
      },
      removeFromCart: (id, user, location, deviceInfo) => {
        const findProduct = get().cart.find((item) => item.id === id);
        set((state) => {
          return {
            cart: state.cart?.filter((item) => item.id !== id),
          };
        });
      },
      addToWishlist: (product, user, location, deviceInfo) => {
        set((state) => {
          const existingProduct = state.wishList.find((item) => item.id === product.id);
          if (existingProduct) {
            return state;
          }

          return {
            wishList: [...state.wishList, product],
          };
        });
      },
      removeFromWishlist: (id, user, location, deviceInfo) => {
        const findProduct = get().wishList.find((item) => item.id === id);
        set((state) => {
          return {
            wishList: state.wishList?.filter((item) => item.id !== id),
          };
        });
      },
    }),
    {
      name: "cart",
    }
  )
);
