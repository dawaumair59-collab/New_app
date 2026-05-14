import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import menuItemsRouter from "./menu-items";
import tablesRouter from "./tables";
import ordersRouter from "./orders";
import dashboardRouter from "./dashboard";
import uploadRouter from "./upload";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(menuItemsRouter);
router.use(tablesRouter);
router.use(ordersRouter);
router.use(dashboardRouter);
router.use(uploadRouter);
router.use(paymentsRouter);

export default router;
