import { Router, type IRouter } from "express";
import { eq, and, ilike, type SQL } from "drizzle-orm";
import { db, menuItemsTable, categoriesTable } from "@workspace/db";
import {
  ListMenuItemsQueryParams,
  CreateMenuItemBody,
  GetMenuItemParams,
  UpdateMenuItemParams,
  UpdateMenuItemBody,
  DeleteMenuItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const selectFields = {
  id: menuItemsTable.id,
  name: menuItemsTable.name,
  description: menuItemsTable.description,
  price: menuItemsTable.price,
  originalPrice: menuItemsTable.originalPrice,
  categoryId: menuItemsTable.categoryId,
  categoryName: categoriesTable.name,
  isVeg: menuItemsTable.isVeg,
  isAvailable: menuItemsTable.isAvailable,
  isBestseller: menuItemsTable.isBestseller,
  imageUrl: menuItemsTable.imageUrl,
  videoUrl: menuItemsTable.videoUrl,
  preparationTime: menuItemsTable.preparationTime,
  spiceLevel: menuItemsTable.spiceLevel,
  tags: menuItemsTable.tags,
  ingredients: menuItemsTable.ingredients,
  calories: menuItemsTable.calories,
  protein: menuItemsTable.protein,
  carbs: menuItemsTable.carbs,
  fat: menuItemsTable.fat,
  allergenInfo: menuItemsTable.allergenInfo,
  pairWithIds: menuItemsTable.pairWithIds,
  createdAt: menuItemsTable.createdAt,
};

function toItem(item: Record<string, unknown>) {
  return {
    ...item,
    price: Number(item.price),
    originalPrice: item.originalPrice != null ? Number(item.originalPrice) : null,
  };
}

router.get("/menu-items", async (req, res): Promise<void> => {
  const query = ListMenuItemsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { categoryId, search, isVeg, isAvailable } = query.data;
  const conditions: SQL[] = [];

  if (categoryId != null) conditions.push(eq(menuItemsTable.categoryId, categoryId));
  if (isAvailable != null) conditions.push(eq(menuItemsTable.isAvailable, isAvailable));
  if (isVeg != null) conditions.push(eq(menuItemsTable.isVeg, isVeg));
  if (search) conditions.push(ilike(menuItemsTable.name, `%${search}%`));

  const items = await db
    .select(selectFields)
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(menuItemsTable.name);

  res.json(items.map(toItem));
});

router.post("/menu-items", async (req, res): Promise<void> => {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { price, originalPrice, ...rest } = parsed.data;
  const [item] = await db
    .insert(menuItemsTable)
    .values({ ...rest, price: String(price), originalPrice: originalPrice != null ? String(originalPrice) : null })
    .returning();
  res.status(201).json(toItem(item as Record<string, unknown>));
});

router.get("/menu-items/:id", async (req, res): Promise<void> => {
  const params = GetMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select(selectFields)
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(eq(menuItemsTable.id, params.data.id));

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json(toItem(item as Record<string, unknown>));
});

router.patch("/menu-items/:id", async (req, res): Promise<void> => {
  const params = UpdateMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if ("originalPrice" in parsed.data) {
    updateData.originalPrice = parsed.data.originalPrice != null ? String(parsed.data.originalPrice) : null;
  }

  const [item] = await db
    .update(menuItemsTable)
    .set(updateData)
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json(toItem(item as Record<string, unknown>));
});

router.delete("/menu-items/:id", async (req, res): Promise<void> => {
  const params = DeleteMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
