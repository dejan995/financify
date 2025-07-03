import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderTree, Edit, Trash2 } from "lucide-react";
import { getCategoryColor } from "@/lib/utils";
import CategoryForm from "@/components/forms/category-form";

export default function Categories() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
  };

  const expenseCategories = (categories || []).filter(cat => cat.type === "expense");
  const incomeCategories = (categories || []).filter(cat => cat.type === "income");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your transactions with custom categories
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Expense Categories
            </CardTitle>
            <CardDescription>
              Categories for tracking your spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseCategories.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No expense categories found
                </p>
              ) : (
                expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.parentId && (
                          <p className="text-sm text-muted-foreground">
                            Subcategory
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {category.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Income Categories
            </CardTitle>
            <CardDescription>
              Categories for tracking your income
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomeCategories.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No income categories found
                </p>
              ) : (
                incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.parentId && (
                          <p className="text-sm text-muted-foreground">
                            Subcategory
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {category.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All expense and income categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Categories</CardTitle>
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseCategories.length}</div>
            <p className="text-xs text-muted-foreground">
              For tracking spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income Categories</CardTitle>
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomeCategories.length}</div>
            <p className="text-xs text-muted-foreground">
              For tracking income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Form Dialog */}
      {isFormOpen && (
        <CategoryForm
          onClose={handleCloseForm}
          category={selectedCategory}
        />
      )}
    </div>
  );
}