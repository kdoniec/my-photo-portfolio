import { useState } from "react";
import type { CategoryDTO, StatsDTO } from "@/types";
import type { CategoryFormData } from "@/lib/schemas/category.schema";
import { useCategories } from "@/components/hooks/useCategories";
import { CategoriesGrid } from "./CategoriesGrid";
import { CategoryDialog } from "./CategoryDialog";
import { LimitBadge } from "@/components/admin/shared/LimitBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CategoriesManagerProps {
  initialCategories: CategoryDTO[];
  stats: StatsDTO;
}

export function CategoriesManager({ initialCategories, stats }: CategoriesManagerProps) {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories(initialCategories);
  const [categoryDialog, setCategoryDialog] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    category: CategoryDTO | null;
  }>({
    isOpen: false,
    mode: "create",
    category: null,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    category: CategoryDTO | null;
  }>({
    isOpen: false,
    category: null,
  });

  const handleAddCategory = () => {
    setCategoryDialog({
      isOpen: true,
      mode: "create",
      category: null,
    });
  };

  const handleEditCategory = (category: CategoryDTO) => {
    setCategoryDialog({
      isOpen: true,
      mode: "edit",
      category,
    });
  };

  const handleCategorySubmit = async (data: CategoryFormData) => {
    try {
      if (categoryDialog.mode === "create") {
        await createCategory({
          name: data.name,
          description: data.description || null,
        });
        toast.success("Kategoria została utworzona");
      } else if (categoryDialog.mode === "edit" && categoryDialog.category) {
        await updateCategory(categoryDialog.category.id, {
          name: data.name,
          description: data.description || null,
          cover_photo_id: data.cover_photo_id || null,
        });
        toast.success("Kategoria została zaktualizowana");
      }
      setCategoryDialog({ isOpen: false, mode: "create", category: null });
    } catch (err) {
      toast.error(
        categoryDialog.mode === "create" ? "Nie udało się utworzyć kategorii" : "Nie udało się zaktualizować kategorii",
        {
          description: err instanceof Error ? err.message : "Nieznany błąd",
        }
      );
      throw err;
    }
  };

  const handleDeleteClick = (category: CategoryDTO) => {
    setDeleteConfirmation({
      isOpen: true,
      category,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.category) return;

    try {
      const result = await deleteCategory(deleteConfirmation.category.id);
      toast.success(`Kategoria "${deleteConfirmation.category.name}" została usunięta`, {
        description:
          result.affected_photos_count > 0
            ? `${result.affected_photos_count} zdjęć zostało odkategorizowanych`
            : undefined,
      });
      setDeleteConfirmation({ isOpen: false, category: null });
    } catch (err) {
      toast.error("Nie udało się usunąć kategorii", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  const isLimitReached = stats.categories.count >= stats.categories.limit;

  return (
    <div className="space-y-6" data-test-id="categories-manager">
      {/* Header section */}
      <div className="flex items-center justify-between" data-test-id="categories-header">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Zarządzanie kategoriami</h2>
          <LimitBadge current={stats.categories.count} limit={stats.categories.limit} />
        </div>
        <Button onClick={handleAddCategory} disabled={isLimitReached || isLoading} data-test-id="add-category-button">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj kategorię
        </Button>
      </div>

      {isLimitReached && (
        <div
          className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-800 dark:text-yellow-200"
          data-test-id="categories-limit-alert"
        >
          <p className="text-sm font-medium">Osiągnięto limit kategorii ({stats.categories.limit})</p>
          <p className="text-sm">Usuń istniejącą kategorię, aby dodać nową.</p>
        </div>
      )}

      {/* Categories grid */}
      <CategoriesGrid categories={categories} onEdit={handleEditCategory} onDelete={handleDeleteClick} />

      {/* Category dialog (create/edit) */}
      <CategoryDialog
        isOpen={categoryDialog.isOpen}
        onOpenChange={(open) => !open && setCategoryDialog({ isOpen: false, mode: "create", category: null })}
        mode={categoryDialog.mode}
        category={categoryDialog.category}
        onSubmit={handleCategorySubmit}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirmation({ isOpen: false, category: null })}
      >
        <AlertDialogContent data-test-id="delete-category-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę kategorię?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation.category && (
                <>
                  Kategoria <strong>{deleteConfirmation.category.name}</strong> zostanie trwale usunięta.
                  {deleteConfirmation.category.photos_count > 0 && (
                    <span className="mt-2 block text-yellow-600 dark:text-yellow-400">
                      <strong>Uwaga:</strong> {deleteConfirmation.category.photos_count} zdjęć w tej kategorii zostanie
                      odkategorizowanych.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-test-id="delete-category-cancel">Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-test-id="delete-category-confirm"
            >
              Usuń kategorię
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
