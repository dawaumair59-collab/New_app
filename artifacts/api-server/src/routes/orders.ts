import { Router, type IRouter } from "express";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, restaurantTablesTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  GetActiveOrdersForTableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db
    .select({
      id: ordersTable.id,
      tableId: ordersTable.tableId,
      tableNumber: restaurantTablesTable.tableNumber,
      status: ordersTable.status,
      totalAmount: ordersTable.totalAmount,
      paymentMethod: ordersTable.paymentMethod,
      paymentStatus: ordersTable.paymentStatus,
      razorpayOrderId: ordersTable.razorpayOrderId,
      razorpayPaymentId: ordersTable.razorpayPaymentId,
      notes: ordersTable.notes,
      customerName: ordersTable.customerName,
      customerPhone: ordersTable.customerPhone,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(restaurantTablesTable, eq(ordersTable.tableId, restaurantTablesTable.id))
    .where(eq(ordersTable.id, orderId));

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    tableNumber: order.tableNumber ?? 0,
    totalAmount: Number(order.totalAmount),
    items: items.map(i => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, tableId, date } = query.data;
  const conditions: SQL[] = [];

  if (status) conditions.push(eq(ordersTable.status, status));
  if (tableId != null) conditions.push(eq(ordersTable.tableId, tableId));
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
  }

  const orders = await db
    .select({
      id: ordersTable.id,
      tableId: ordersTable.tableId,
      tableNumber: restaurantTablesTable.tableNumber,
      status: ordersTable.status,
      totalAmount: ordersTable.totalAmount,
      paymentMethod: ordersTable.paymentMethod,
      paymentStatus: ordersTable.paymentStatus,
      razorpayOrderId: ordersTable.razorpayOrderId,
      razorpayPaymentId: ordersTable.razorpayPaymentId,
      notes: ordersTable.notes,
      customerName: ordersTable.customerName,
      customerPhone: ordersTable.customerPhone,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(restaurantTablesTable, eq(ordersTable.tableId, restaurantTablesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  // Fetch items for each order
  const orderIds = orders.map(o => o.id);
  const allItems = orderIds.length > 0
    ? await db.select().from(orderItemsTable).where(
        orderIds.length === 1
          ? eq(orderItemsTable.orderId, orderIds[0])
          : undefined
      )
    : [];

  const itemsByOrder = allItems.reduce<Record<number, typeof allItems>>((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push(item);
    return acc;
  }, {});

  res.json(orders.map(o => ({
    ...o,
    tableNumber: o.tableNumber ?? 0,
    totalAmount: Number(o.totalAmount),
    items: (itemsByOrder[o.id] ?? []).map(i => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  })));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tableId, items, paymentMethod, notes, customerName, customerPhone } = parsed.data;

  // Validate table exists
  const [table] = await db
    .select()
    .from(restaurantTablesTable)
    .where(eq(restaurantTablesTable.id, tableId));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  // Fetch menu items to get prices
  const menuItemIds = items.map(i => i.menuItemId);
  const menuItems = await db
    .select()
    .from(menuItemsTable)
    .where(
      menuItemIds.length === 1
        ? eq(menuItemsTable.id, menuItemIds[0])
        : undefined
    );

  const menuItemMap = menuItems.reduce<Record<number, typeof menuItems[0]>>((acc, mi) => {
    acc[mi.id] = mi;
    return acc;
  }, {});

  // Fetch all needed menu items by id
  const fetchedItems = await Promise.all(
    menuItemIds.map(id =>
      db.select().from(menuItemsTable).where(eq(menuItemsTable.id, id)).then(r => r[0])
    )
  );

  const fetchedMap = fetchedItems.reduce<Record<number, typeof fetchedItems[0]>>((acc, mi) => {
    if (mi) acc[mi.id] = mi;
    return acc;
  }, {});

  let totalAmount = 0;
  const orderItemsData = items.map(item => {
    const menuItem = fetchedMap[item.menuItemId];
    if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
    const unitPrice = Number(menuItem.price);
    const totalPrice = unitPrice * item.quantity;
    totalAmount += totalPrice;
    return {
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      menuItemImageUrl: menuItem.imageUrl ?? null,
      quantity: item.quantity,
      unitPrice: String(unitPrice),
      totalPrice: String(totalPrice),
      notes: item.notes ?? null,
    };
  });

  const [order] = await db
    .insert(ordersTable)
    .values({
      tableId,
      totalAmount: String(totalAmount),
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      notes: notes ?? null,
      customerName: customerName ?? null,
      customerPhone: customerPhone ?? null,
    })
    .returning();

  await db.insert(orderItemsTable).values(
    orderItemsData.map(oi => ({ ...oi, orderId: order.id }))
  );

  const result = await getOrderWithItems(order.id);
  res.status(201).json(result);
});

router.get("/orders/table/:tableId/active", async (req, res): Promise<void> => {
  const params = GetActiveOrdersForTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const activeStatuses = ["pending", "accepted", "preparing", "ready"];
  const orders = await db
    .select({
      id: ordersTable.id,
      tableId: ordersTable.tableId,
      tableNumber: restaurantTablesTable.tableNumber,
      status: ordersTable.status,
      totalAmount: ordersTable.totalAmount,
      paymentMethod: ordersTable.paymentMethod,
      paymentStatus: ordersTable.paymentStatus,
      razorpayOrderId: ordersTable.razorpayOrderId,
      razorpayPaymentId: ordersTable.razorpayPaymentId,
      notes: ordersTable.notes,
      customerName: ordersTable.customerName,
      customerPhone: ordersTable.customerPhone,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(restaurantTablesTable, eq(ordersTable.tableId, restaurantTablesTable.id))
    .where(eq(ordersTable.tableId, params.data.tableId))
    .orderBy(desc(ordersTable.createdAt));

  const filtered = orders.filter(o => activeStatuses.includes(o.status));

  const result = await Promise.all(
    filtered.map(async o => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
      return {
        ...o,
        tableNumber: o.tableNumber ?? 0,
        totalAmount: Number(o.totalAmount),
        items: items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice) })),
      };
    })
  );

  res.json(result);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.id));

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

export default router;
