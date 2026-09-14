import { http } from "@/lib/api-client";
import type { Category } from "@/lib/types";

export const categoriesApi = {
  list: () => http.get<Category[]>("/categories"),
};
