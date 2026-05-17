import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Image, Sparkles, Loader2 } from "lucide-react";
import {
  useListCategories, useCreateCategory, useDeleteCategory,
  useListMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  getListCategoriesQueryKey, getListMenuItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { VegBadge } from "@/components/VegBadge";
import { SpiceBadge } from "@/components/SpiceBadge";
import { MediaUploader } from "@/components/MediaUploader";
import { useToast } from "@/hooks/use-toast";
import type { MenuItem } from "@workspace/api-client-react";

type SpiceLevel = "mild" | "medium" | "spicy";

const DEFAULT_CATEGORIES = [
  "Starters", "Main Course", "Breads", "Rice & Biryani",
  "Fast Food", "Snacks", "Desserts", "Beverages",
  "Chinese", "South Indian", "North Indian", "Seafood",
];

const EMPTY_FORM = { name: "", description: "", price: "", categoryId: "", isVeg: true, isAvailable: true, imageUrl: "", videoUrl: "", preparationTime: "", spiceLevel: "" as SpiceLevel | "", tags: "" };

export default function AdminMenu() {
  const [tab, setTab] = useState<"items" | "categories">("items");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [catName, setCatName] = useState("");
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading: catsLoading } = useListCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useListMenuItems(
    filterCat ? { categoryId: filterCat } : {},
    { query: { queryKey: getListMenuItemsQueryKey(filterCat ? { categoryId: filterCat } : {}) } }
  );
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const openCreate = () => { setEditItem(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description ?? "", price: String(item.price),
      categoryId: String(item.categoryId), isVeg: item.isVeg, isAvailable: item.isAvailable,
      imageUrl: item.imageUrl ?? "", videoUrl: item.videoUrl ?? "",
      preparationTime: item.preparationTime ? String(item.preparationTime) : "",
      spiceLevel: (item.spiceLevel as SpiceLevel) ?? "", tags: item.tags ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, description: form.description || undefined, price: Number(form.price),
      categoryId: Number(form.categoryId), isVeg: form.isVeg, isAvailable: form.isAvailable,
      imageUrl: form.imageUrl || undefined, videoUrl: form.videoUrl || undefined,
      preparationTime: form.preparationTime ? Number(form.preparationTime) : undefined,
      spiceLevel: (form.spiceLevel as SpiceLevel) || undefined, tags: form.tags || undefined,
    };
    try {
      if (editItem) {
        await updateMenuItem.mutateAsync({ id: editItem.id, data });
        toast({ title: "Item updated" });
      } else {
        await createMenuItem.mutateAsync({ data });
        toast({ title: "Item created" });
      }
      queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
      setShowForm(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteMenuItem.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
    toast({ title: "Item deleted" });
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await createCategory.mutateAsync({ data: { name: catName } });
    queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    setCatName(""); toast({ title: "Category created" });
  };

  const handleDeleteCat = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await deleteCategory.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    toast({ title: "Category deleted" });
  };

  const [addingDefaults, setAddingDefaults] = useState(false);
  const handleAddDefaults = async () => {
    const existing = new Set(categories.map(c => c.name.toLowerCase().trim()));
    const toAdd = DEFAULT_CATEGORIES.filter(n => !existing.has(n.toLowerCase()));
    if (toAdd.length === 0) { toast({ title: "Sab categories pehle se hain!" }); return; }
    setAddingDefaults(true);
    try {
      for (const name of toAdd) {
        await createCategory.mutateAsync({ data: { name } });
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      toast({ title: `${toAdd.length} default categories add ho gayi!` });
    } finally {
      setAddingDefaults(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-sm text-gray-500 mt-1">Add, edit and manage your menu items</p>
          </div>
          {tab === "items" && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm" data-testid="add-item-btn">
              <Plus size={16} /> Add Item
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["items", "categories"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${tab === t ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Item Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <h2 className="font-bold text-gray-900">{editItem ? "Edit Item" : "Add Menu Item"}</h2>
                  <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" data-testid="item-name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Price (₹) *</label>
                      <input required type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" data-testid="item-price" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Category *</label>
                      {categories.length === 0 ? (
                        <div className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-xl text-xs text-amber-700">
                          <p className="font-semibold mb-1">Pehle categories add karo</p>
                          <button
                            type="button"
                            onClick={handleAddDefaults}
                            disabled={addingDefaults}
                            className="underline font-bold text-amber-800 disabled:opacity-60"
                          >
                            {addingDefaults ? "Adding..." : "👉 Default categories add karo"}
                          </button>
                        </div>
                      ) : (
                        <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white" data-testid="item-category">
                          <option value="">-- Select Category --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Spice Level</label>
                      <select value={form.spiceLevel} onChange={e => setForm(f => ({ ...f, spiceLevel: e.target.value as SpiceLevel | "" }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none bg-white">
                        <option value="">None</option>
                        <option value="mild">Mild</option>
                        <option value="medium">Medium</option>
                        <option value="spicy">Spicy</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Prep Time (min)</label>
                      <input type="number" min={1} value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600 block">Options</label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.isVeg} onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))} className="accent-green-600" />
                        <span className="text-gray-700">Veg</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="accent-primary" />
                        <span className="text-gray-700">Available</span>
                      </label>
                    </div>
                  </div>
                  <MediaUploader label="Food Photo" accept="image" value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} />
                  <MediaUploader label="Video Preview (optional)" accept="video" value={form.videoUrl} onChange={url => setForm(f => ({ ...f, videoUrl: url }))} />
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="popular, bestseller, spicy" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={createMenuItem.isPending || updateMenuItem.isPending} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2" data-testid="save-item-btn">
                      {(createMenuItem.isPending || updateMenuItem.isPending) && <Loader2 size={14} className="animate-spin" />}
                      {editItem ? "Save Changes" : "Create Item"}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === "items" ? (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
              <button onClick={() => setFilterCat(null)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold ${filterCat === null ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"}`}>All</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setFilterCat(c.id)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold ${filterCat === c.id ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{c.name}</button>
              ))}
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {itemsLoading ? (
                <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : menuItems.length === 0 ? (
                <div className="p-12 text-center">
                  <Image size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No items yet</p>
                  <p className="text-sm text-gray-400">Click "Add Item" to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {menuItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors" data-testid={`menu-item-${item.id}`}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex-shrink-0 flex items-center justify-center"><Image size={18} className="text-red-200" /></div>
                      )}
                      <VegBadge isVeg={item.isVeg} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          {!item.isAvailable && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Unavailable</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{item.categoryName}</span>
                          <SpiceBadge level={item.spiceLevel} />
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">₹{item.price}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors" data-testid={`edit-item-${item.id}`}><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteItem(item.id, item.name)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" data-testid={`delete-item-${item.id}`}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Categories Tab */
          <div className="space-y-4">
            {/* Default categories quick-add */}
            {categories.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
              >
                <p className="text-sm font-semibold text-amber-800 mb-1">Koi category nahi hai</p>
                <p className="text-xs text-amber-600 mb-3">
                  Ek click mein 12 common restaurant categories add karo — Starters, Main Course, Fast Food, Desserts aur aur bhi.
                </p>
                <button
                  onClick={handleAddDefaults}
                  disabled={addingDefaults}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  <Sparkles size={14} />
                  {addingDefaults ? "Adding..." : "Add Default Categories"}
                </button>
                <p className="text-[11px] text-amber-500 mt-2">
                  Starters · Main Course · Breads · Rice &amp; Biryani · Fast Food · Snacks · Desserts · Beverages · Chinese · South Indian · North Indian · Seafood
                </p>
              </motion.div>
            )}

            {categories.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleAddDefaults}
                  disabled={addingDefaults}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/40 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                >
                  <Sparkles size={11} />
                  {addingDefaults ? "Adding..." : "Add Default Categories"}
                </button>
              </div>
            )}

            <form onSubmit={handleCreateCat} className="flex gap-3">
              <input
                value={catName} onChange={e => setCatName(e.target.value)} placeholder="New category name"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="cat-name-input"
              />
              <button type="submit" disabled={createCategory.isPending} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" data-testid="add-cat-btn">
                Add Category
              </button>
            </form>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {catsLoading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No categories yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{cat.name}</p>
                        {cat.description && <p className="text-xs text-gray-400">{cat.description}</p>}
                      </div>
                      <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors" data-testid={`delete-cat-${cat.id}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
