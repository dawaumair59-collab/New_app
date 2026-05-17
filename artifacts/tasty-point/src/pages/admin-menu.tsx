import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Image, Sparkles, Loader2, Star } from "lucide-react";
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

const EMPTY_FORM = {
  name: "", description: "", price: "", originalPrice: "", categoryId: "",
  isVeg: true, isAvailable: true, isBestseller: false,
  imageUrl: "", videoUrl: "",
  preparationTime: "", spiceLevel: "" as SpiceLevel | "", tags: "",
  ingredients: "", calories: "", protein: "", carbs: "", fat: "",
  allergenInfo: "", pairWithIds: [] as number[],
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 mt-1">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white";

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
      originalPrice: item.originalPrice ? String(item.originalPrice) : "",
      categoryId: String(item.categoryId), isVeg: item.isVeg, isAvailable: item.isAvailable,
      isBestseller: item.isBestseller ?? false,
      imageUrl: item.imageUrl ?? "", videoUrl: item.videoUrl ?? "",
      preparationTime: item.preparationTime ? String(item.preparationTime) : "",
      spiceLevel: (item.spiceLevel as SpiceLevel) ?? "", tags: item.tags ?? "",
      ingredients: item.ingredients ?? "", calories: item.calories ? String(item.calories) : "",
      protein: item.protein ?? "", carbs: item.carbs ?? "", fat: item.fat ?? "",
      allergenInfo: item.allergenInfo ?? "",
      pairWithIds: item.pairWithIds ? item.pairWithIds.split(",").map(Number).filter(Boolean) : [],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      categoryId: Number(form.categoryId),
      isVeg: form.isVeg,
      isAvailable: form.isAvailable,
      isBestseller: form.isBestseller,
      imageUrl: form.imageUrl || undefined,
      videoUrl: form.videoUrl || undefined,
      preparationTime: form.preparationTime ? Number(form.preparationTime) : undefined,
      spiceLevel: (form.spiceLevel as SpiceLevel) || undefined,
      tags: form.tags || undefined,
      ingredients: form.ingredients || undefined,
      calories: form.calories ? Number(form.calories) : undefined,
      protein: form.protein || undefined,
      carbs: form.carbs || undefined,
      fat: form.fat || undefined,
      allergenInfo: form.allergenInfo || undefined,
      pairWithIds: form.pairWithIds.length > 0 ? form.pairWithIds.join(",") : undefined,
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
      toast({ title: "Error saving item", variant: "destructive" });
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

  const togglePairItem = (id: number) => {
    setForm(f => ({
      ...f,
      pairWithIds: f.pairWithIds.includes(id)
        ? f.pairWithIds.filter(x => x !== id)
        : [...f.pairWithIds, id],
    }));
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

                  {/* ── BASIC INFO ── */}
                  <SectionLabel>Basic Info</SectionLabel>
                  <Field label="Item Name *">
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} data-testid="item-name" placeholder="e.g. Classic Burger" />
                  </Field>
                  <Field label="Description">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Short description of the dish..." />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price (₹) *">
                      <input required type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} data-testid="item-price" placeholder="150" />
                    </Field>
                    <Field label="Original Price (₹)">
                      <input type="number" min={0} step="0.01" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} className={inputCls} placeholder="200 (for strikethrough)" />
                    </Field>
                  </div>

                  <Field label="Category *">
                    {categories.length === 0 ? (
                      <div className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-xl text-xs text-amber-700">
                        <p className="font-semibold mb-1">Pehle categories add karo</p>
                        <button type="button" onClick={handleAddDefaults} disabled={addingDefaults} className="underline font-bold text-amber-800 disabled:opacity-60">
                          {addingDefaults ? "Adding..." : "👉 Default categories add karo"}
                        </button>
                      </div>
                    ) : (
                      <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className={inputCls} data-testid="item-category">
                        <option value="">-- Select Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                  </Field>

                  {/* ── OPTIONS ── */}
                  <SectionLabel>Options</SectionLabel>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Spice Level">
                      <select value={form.spiceLevel} onChange={e => setForm(f => ({ ...f, spiceLevel: e.target.value as SpiceLevel | "" }))} className={inputCls}>
                        <option value="">None</option>
                        <option value="mild">Mild 🌶</option>
                        <option value="medium">Medium 🌶🌶</option>
                        <option value="spicy">Spicy 🌶🌶🌶</option>
                      </select>
                    </Field>
                    <Field label="Prep Time (min)">
                      <input type="number" min={1} value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))} className={inputCls} placeholder="15" />
                    </Field>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-2">Toggles</label>
                      <div className="space-y-1.5">
                        {[
                          { label: "🥦 Veg", key: "isVeg" as const, color: "accent-green-600" },
                          { label: "✅ Available", key: "isAvailable" as const, color: "accent-primary" },
                          { label: "🔥 Bestseller", key: "isBestseller" as const, color: "accent-yellow-500" },
                        ].map(({ label, key, color }) => (
                          <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className={color} />
                            <span className="text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Field label="Tags (comma-separated)">
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="popular, bestseller, spicy" className={inputCls} />
                  </Field>

                  {/* ── MEDIA ── */}
                  <SectionLabel>Media</SectionLabel>
                  <MediaUploader label="Food Photo" accept="image" value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} />
                  <MediaUploader label="Video Preview (optional)" accept="video" value={form.videoUrl} onChange={url => setForm(f => ({ ...f, videoUrl: url }))} />

                  {/* ── NUTRITION ── */}
                  <SectionLabel>Nutrition Info (Optional)</SectionLabel>
                  <Field label="Ingredients (comma-separated with emoji)">
                    <input value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} placeholder="🥩 Beef, 🧀 Cheddar, 🥬 Lettuce" className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Calories", key: "calories" as const, placeholder: "520", unit: "kcal" },
                      { label: "Protein", key: "protein" as const, placeholder: "28g" },
                      { label: "Carbs", key: "carbs" as const, placeholder: "38g" },
                      { label: "Fat", key: "fat" as const, placeholder: "24g" },
                    ].map(({ label, key, placeholder }) => (
                      <Field key={key} label={label}>
                        <input
                          value={form[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className={inputCls}
                          type={key === "calories" ? "number" : "text"}
                        />
                      </Field>
                    ))}
                  </div>
                  <Field label="Allergen Info">
                    <input value={form.allergenInfo} onChange={e => setForm(f => ({ ...f, allergenInfo: e.target.value }))} placeholder="Gluten, Dairy, Soy" className={inputCls} />
                  </Field>

                  {/* ── PAIR IT WITH ── */}
                  {menuItems.filter(m => !editItem || m.id !== editItem.id).length > 0 && (
                    <>
                      <SectionLabel>Pair It With (Upsell Items)</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {menuItems
                          .filter(m => !editItem || m.id !== editItem.id)
                          .map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => togglePairItem(m.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                form.pairWithIds.includes(m.id)
                                  ? "bg-primary text-white border-primary"
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/40"
                              }`}
                            >
                              {form.pairWithIds.includes(m.id) && <span>✓</span>}
                              {m.name}
                              <span className="opacity-60">₹{m.price}</span>
                            </button>
                          ))}
                      </div>
                    </>
                  )}

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
                <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : menuItems.length === 0 ? (
                <div className="p-12 text-center">
                  <Image size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No items yet</p>
                  <p className="text-gray-400 text-sm">Click "Add Item" to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {menuItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <VegBadge isVeg={item.isVeg} />
                          <span className="font-semibold text-gray-900 text-sm truncate">{item.name}</span>
                          {item.isBestseller && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">🔥 Best</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-primary">₹{item.price}</span>
                          {item.originalPrice && <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>}
                          <SpiceBadge level={item.spiceLevel} />
                          <span className="text-xs text-gray-400">{item.categoryName}</span>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isAvailable ? "bg-green-400" : "bg-gray-300"}`} />
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors" data-testid={`edit-item-${item.id}`}><Pencil size={14} /></button>
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
            {categories.length === 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Koi category nahi hai</p>
                <p className="text-xs text-amber-600 mb-3">Ek click mein 12 common restaurant categories add karo.</p>
                <button onClick={handleAddDefaults} disabled={addingDefaults} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                  <Sparkles size={14} />
                  {addingDefaults ? "Adding..." : "Add Default Categories"}
                </button>
                <p className="text-[11px] text-amber-500 mt-2">Starters · Main Course · Breads · Rice &amp; Biryani · Fast Food · Snacks · Desserts · Beverages · Chinese · South Indian · North Indian · Seafood</p>
              </motion.div>
            )}
            {categories.length > 0 && (
              <div className="flex justify-end">
                <button onClick={handleAddDefaults} disabled={addingDefaults} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/40 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60">
                  <Sparkles size={11} /> {addingDefaults ? "Adding..." : "Add Default Categories"}
                </button>
              </div>
            )}
            <form onSubmit={handleCreateCat} className="flex gap-3">
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="New category name" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" data-testid="cat-name-input" />
              <button type="submit" disabled={createCategory.isPending} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" data-testid="add-cat-btn">Add Category</button>
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
                      <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors" data-testid={`delete-cat-${cat.id}`}><Trash2 size={14} /></button>
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
