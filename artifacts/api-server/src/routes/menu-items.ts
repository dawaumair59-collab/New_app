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
    .select({
      id: menuItemsTable.id,
      name: menuItemsTable.name,
      description: menuItemsTable.description,
      price: menuItemsTable.price,
      categoryId: menuItemsTable.categoryId,
      categoryName: categoriesTable.name,
      isVeg: menuItemsTable.isVeg,
      isAvailable: menuItemsTable.isAvailable,
      imageUrl: menuItemsTable.imageUrl,
      videoUrl: menuItemsTable.videoUrl,
      preparationTime: menuItemsTable.preparationTime,
      spiceLevel: menuItemsTable.spiceLevel,
      tags: menuItemsTable.tags,
      createdAt: menuItemsTable.createdAt,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(menuItemsTable.name);

  res.json(items.map(item => ({ ...item, price: Number(item.price) })));
});

router.post("/menu-items", async (req, res): Promise<void> => {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(menuItemsTable).values({ ...parsed.data, price: String(parsed.data.price) }).returning();
  res.status(201).json({ ...item, price: Number(item.price) });
});

router.get("/menu-items/:id", async (req, res): Promise<void> => {
  const params = GetMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select({
      id: menuItemsTable.id,
      name: menuItemsTable.name,
      description: menuItemsTable.description,
      price: menuItemsTable.price,
      categoryId: menuItemsTable.categoryId,
      categoryName: categoriesTable.name,
      isVeg: menuItemsTable.isVeg,
      isAvailable: menuItemsTable.isAvailable,
      imageUrl: menuItemsTable.imageUrl,
      videoUrl: menuItemsTable.videoUrl,
      preparationTime: menuItemsTable.preparationTime,
      spiceLevel: menuItemsTable.spiceLevel,
      tags: menuItemsTable.tags,
      createdAt: menuItemsTable.createdAt,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(eq(menuItemsTable.id, params.data.id));

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json({ ...item, price: Number(item.price) });
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

  const [item] = await db
    .update(menuItemsTable)
    .set(updateData)
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json({ ...item, price: Number(item.price) });
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
