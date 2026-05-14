import { Router, type IRouter } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { CreatePaymentOrderBody, VerifyPaymentBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const router: IRouter = Router();

router.post("/payments/create-order", async (req, res): Promise<void> => {
  const parsed = CreatePaymentOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, currency, orderId } = parsed.data;

  try {
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: currency ?? "INR",
      receipt: `order_${orderId}`,
    });

    // Store razorpay order id in our order
    await db
      .update(ordersTable)
      .set({ razorpayOrderId: razorpayOrder.id })
      .where(eq(ordersTable.id, orderId));

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID!,
    });
  } catch (err) {
    logger.error({ err }, "Razorpay order creation failed");
    res.status(500).json({ error: "Payment order creation failed" });
  }
});

router.post("/payments/verify", async (req, res): Promise<void> => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = parsed.data;

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    res.status(400).json({ success: false, message: "Payment verification failed" });
    return;
  }

  // Mark payment as paid
  await db
    .update(ordersTable)
    .set({ paymentStatus: "paid", razorpayPaymentId })
    .where(eq(ordersTable.id, orderId));

  res.json({ success: true, message: "Payment verified successfully" });
});

export default router;
