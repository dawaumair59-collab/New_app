import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, restaurantTablesTable } from "@workspace/db";
import {
  CreateTableBody,
  GetTableParams,
  UpdateTableParams,
  UpdateTableBody,
  DeleteTableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildQrCode(tableNumber: number): string {
  return `/menu?table=${tableNumber}`;
}

router.get("/tables", async (_req, res): Promise<void> => {
  const tables = await db
    .select()
    .from(restaurantTablesTable)
    .orderBy(restaurantTablesTable.tableNumber);
  res.json(tables);
});

router.post("/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const qrCode = buildQrCode(parsed.data.tableNumber);
  const [table] = await db
    .insert(restaurantTablesTable)
    .values({ ...parsed.data, qrCode })
    .returning();
  res.status(201).json(table);
});

router.get("/tables/:id", async (req, res): Promise<void> => {
  const params = GetTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.id, params.data.id));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(table);
});

router.patch("/tables/:id", async (req, res): Promise<void> => {
  const params = UpdateTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.tableNumber != null) {
    updateData.qrCode = buildQrCode(parsed.data.tableNumber);
  }
  const [table] = await db
    .update(restaurantTablesTable)
    .set(updateData)
    .where(eq(restaurantTablesTable.id, params.data.id))
    .returning();
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(table);
});

router.delete("/tables/:id", async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(restaurantTablesTable).where(eq(restaurantTablesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
