import { z } from "zod";

import { publicProcedure, router } from "../index";
import { getState, publicProduct, recordAnalytics } from "../mock/eventownia/store";

export const catalogRouter = router({
  categories: publicProcedure.query(() => {
    const state = getState();
    return state.categories
      .filter((category) => category.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }),

  products: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          active: z.boolean().optional(),
          q: z.string().optional(),
          limit: z.number().min(1).max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input }) => {
      const state = getState();
      const query = input?.q?.trim().toLowerCase();
      const category = input?.category
        ? state.categories.find((item) => item.slug === input.category || item.id === input.category)
        : null;
      const limit = input?.limit ?? 50;
      const items = state.products
        .filter((product) => product.publicVisible)
        .filter((product) => (input?.active === false ? true : product.active))
        .filter((product) => (category ? product.categoryId === category.id : true))
        .filter((product) =>
          query
            ? [product.namePl, product.shortDescriptionPl, product.sku]
                .join(" ")
                .toLowerCase()
                .includes(query)
            : true,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, limit)
        .map((product) => publicProduct(product.id));

      return {
        items,
        nextCursor: null,
      };
    }),

  productBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => {
    const state = getState();
    const product = state.products.find(
      (item) => item.slug === input.slug && item.publicVisible && item.active,
    );
    if (product) recordAnalytics("product_viewed", "product", product.id);
    return product ? publicProduct(product.id) : null;
  }),

  categoryBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => {
    const state = getState();
    const category = state.categories.find((item) => item.slug === input.slug);
    if (!category) return null;
    const products = state.products
      .filter((product) => product.categoryId === category.id && product.publicVisible && product.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((product) => publicProduct(product.id));
    return { ...category, products };
  }),
});
