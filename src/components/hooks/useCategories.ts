import { useState } from "react";
import type {
  CategoryDTO,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryResponseDTO,
  CategoryListResponseDTO,
} from "@/types";
import { useStats } from "@/components/admin/context/StatsContext";

export function useCategories(initialData: CategoryDTO[]) {
  const [categories, setCategories] = useState<CategoryDTO[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshStats } = useStats();

  const fetchCategories = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error("Nie udało się pobrać kategorii");
      }

      const data: CategoryListResponseDTO = await response.json();
      setCategories(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać kategorii";
      setError(errorMessage);
      console.error("Błąd podczas pobierania kategorii:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryCommand): Promise<CategoryDTO> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się utworzyć kategorii");
      }

      const newCategory: CategoryDTO = await response.json();
      setCategories((prev) => [...prev, newCategory]);
      await refreshStats();

      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się utworzyć kategorii";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryCommand): Promise<CategoryDTO> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zaktualizować kategorii");
      }

      const updatedCategory: CategoryDTO = await response.json();
      setCategories((prev) => prev.map((cat) => (cat.id === id ? updatedCategory : cat)));
      await refreshStats();

      return updatedCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować kategorii";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<DeleteCategoryResponseDTO> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się usunąć kategorii");
      }

      const result: DeleteCategoryResponseDTO = await response.json();
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      await refreshStats();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć kategorii";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
