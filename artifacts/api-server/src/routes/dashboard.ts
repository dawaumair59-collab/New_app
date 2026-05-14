import { Router, type IRouter } from "express";
import { eq, desc, sql, sum, count } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, restaurantTablesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totals] = await db
    .select({
      totalOrders: count(ordersTable.id),
      totalRevenue: sum(ordersTable.totalAmount),
    })
    .from(ordersTable);

  const [todayTotals] = await db
    .select({
      todayOrders: count(ordersTable.id),
      todayRevenue: sum(ordersTable.totalAmount),
    })
    .from(ordersTable)
    .where(sql`${ordersTable.createdAt} >= ${today}`);

  const [pendingCount] = await db
    .select({ count: count(ordersTable.id) })
    .from(ordersTable)
    .where(eq(ordersTable.status, "pending"));

  const [activeCount] = await db
    .select({ count: count(ordersTable.id) })
    .from(ordersTable)
    .where(
      sql`${ordersTable.status} IN ('accepted', 'preparing', 'ready')`
    );

  const [tableCount] = await db
    .select({ count: count(restaurantTablesTable.id) })
    .from(restaurantTablesTable);

  const [menuCount] = await db
    .select({ count: count(menuItemsTable.id) })
    .from(menuItemsTable)
    .where(eq(menuItemsTable.isAvailable, true));

  res.json({
    totalOrders: Number(totals?.totalOrders ?? 0),
    totalRevenue: Number(totals?.totalRevenue ?? 0),
    pendingOrders: Number(pendingCount?.count ?? 0),
    activeOrders: Number(activeCount?.count ?? 0),
    todayOrders: Number(todayTotals?.todayOrders ?? 0),
    todayRevenue: Number(todayTotals?.todayRevenue ?? 0),
    totalTables: Number(tableCount?.count ?? 0),
    totalMenuItems: Number(menuCount?.count ?? 0),
  });
});

router.get("/dashboard/best-sellers", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit ?? 10);

  const results = await db
    .select({
      menuItemId: orderItemsTable.menuItemId,
      menuItemName: orderItemsTable.menuItemName,
      imageUrl: menuItemsTable.imageUrl,
      isVeg: menuItemsTable.isVeg,
      totalQuantity: sum(orderItemsTable.quantity),
      totalRevenue: sum(orderItemsTable.totalPrice),
      orderCount: count(orderItemsTable.orderId),
    })
    .from(orderItemsTable)
    .leftJoin(menuItemsTable, eq(orderItemsTable.menuItemId, menuItemsTable.id))
    .groupBy(orderItemsTable.menuItemId, orderItemsTable.menuItemName, menuItemsTable.imageUrl, menuItemsTable.isVeg)
    .orderBy(desc(sum(orderItemsTable.quantity)))
    .limit(limit);

  res.json(results.map(r => ({
    menuItemId: r.menuItemId,
    menuItemName: r.menuItemName,
    imageUrl: r.imageUrl ?? null,
    isVeg: r.isVeg ?? true,
    totalQuantity: Number(r.totalQuantity ?? 0),
    totalRevenue: Number(r.totalRevenue ?? 0),
    orderCount: Number(r.orderCount ?? 0),
  })));
});

router.get("/dashboard/table-performance", async (_req, res): Promise<void> => {
  const results = await db
    .select({
      tableId: ordersTable.tableId,
      tableNumber: restaurantTablesTable.tableNumber,
      tableName: restaurantTablesTable.name,
      totalOrders: count(ordersTable.id),
      totalRevenue: sum(ordersTable.totalAmount),
    })
    .from(ordersTable)
    .leftJoin(restaurantTablesTable, eq(ordersTable.tableId, restaurantTablesTable.id))
    .groupBy(ordersTable.tableId, restaurantTablesTable.tableNumber, restaurantTablesTable.name)
    .orderBy(desc(sum(ordersTable.totalAmount)));

  res.json(results.map(r => {
    const total = Number(r.totalRevenue ?? 0);
    const orders = Number(r.totalOrders ?? 0);
    return {
      tableId: r.tableId,
      tableNumber: r.tableNumber ?? 0,
      tableName: r.tableName ?? null,
      totalOrders: orders,
      totalRevenue: total,
      averageOrderValue: orders > 0 ? total / orders : 0,
    };
  }));
});

router.get("/dashboard/recent-orders", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit ?? 10);

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
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);

  const result = await Promise.all(
    orders.map(async o => {
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

export default router;
