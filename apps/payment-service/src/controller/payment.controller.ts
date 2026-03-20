import {
  prisma,
  //  OrderStatus,
  PaymentStatus,
  // DiscountType,
  UserRole,
} from "@e-com/db";
import Stripe from "stripe";
import { NextFunction, Response } from "express";
import redis, {
  //  NotFoundError,
  ValidationError,
} from "@e-com/libs";
import stripe from "../utils/stripe.js";
import { sendEmail } from "../utils/send-email/index.js";
import { getKlarnaCurrency } from "../utils/klarna.js";

// ─────────────────────────────────────────────
// KLARNA: Create Payment Intent (mirrors createPaymentIntent)
// Klarna is supported natively by Stripe as a payment_method_type.
// NOTE: Klarna requires a PaymentIntent with confirm=false,
// then confirmed on the frontend via Stripe.js.
// ─────────────────────────────────────────────
export async function createKlarnaPaymentIntent(req: any, res: Response, next: NextFunction) {
  const { amount, sellerStripeAccountId, sessionId } = req.body;

  // Klarna requires integer cents
  const customerAmount = Math.round(amount * 100);
  const platformFee = Math.round(customerAmount * 0.1); // 10% platform fee

  try {
    if (!sellerStripeAccountId) {
      return next(new ValidationError("Seller Stripe account ID is required."));
    }

    // Klarna requires shipping + billing details to be collected
    // before confirmation — we pass them from the session
    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return next(new ValidationError("Payment session expired or not found."));
    }

    const { shippingAddressId } = JSON.parse(sessionData);

    // Fetch shipping address for Klarna (required)
    const shippingAddress = shippingAddressId
      ? await prisma.address.findUnique({
          where: { id: shippingAddressId },
        })
      : null;

    // ✅ Dynamically resolve the correct currency for this seller's country
    const currency = await getKlarnaCurrency(stripe, sellerStripeAccountId);
    console.log("CURRENCY", currency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount,
      currency, // ← now "eur" for DE accounts, "usd" for US, etc.
      payment_method_types: ["klarna"],
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      // Klarna requires shipping details on the PaymentIntent
      shipping: shippingAddress
        ? {
            name: shippingAddress.name,
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.city,
              postal_code: shippingAddress.zip,
              country: shippingAddress.country, // e.g. "DE"
            },
          }
        : undefined,
      metadata: {
        sessionId,
        userId: req.user?.id,
        paymentMethod: "klarna", // tag for webhook routing
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      currency, // ← send to frontend so it can display the right currency symbol
    });
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
// KLARNA: Create Payment Session (same as Stripe session but
// tagged for Klarna — reuses your existing Redis session logic)
// ─────────────────────────────────────────────
export async function createKlarnaPaymentSession(req: any, res: Response, next: NextFunction) {
  const { cart, selectedAddressId, coupon } = req.body;
  const userId = req.user?.id;

  try {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty or invalid."));
    }

    const normalizedCart = JSON.stringify(
      cart.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        salePrice: item.salePrice,
        shopId: item.shopId,
        selectedOptions: item.selectedOptions || {},
      }))
    );

    // Reuse existing session if cart matches (same logic as Stripe)
    const keys = await redis.keys("payment-session:*");
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId && session.paymentMethod === "klarna") {
          const existingCart = JSON.stringify(
            session.cart.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              salePrice: item.salePrice,
              shopId: item.shopId,
              selectedOptions: item.selectedOptions || {},
            }))
          );
          if (existingCart === normalizedCart) {
            return res.status(200).json({ sessionId: key.split(":")[1] });
          } else {
            await redis.del(key);
          }
        }
      }
    }

    // Fetch sellers and their Stripe accounts (Klarna still routes via Stripe Connect)
    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId as string))];
    const shops = await prisma.shop.findMany({
      where: { id: { in: uniqueShopIds } },
      select: {
        id: true,
        sellerId: true,
        sellers: { select: { stripeId: true } },
      },
    });

    const sellerData = shops.map((shop) => ({
      shopId: shop.id,
      sellerId: shop.sellerId,
      stripeAccountId: shop.sellers.stripeId,
    }));

    const totalAmount = cart.reduce((total: number, item: any) => {
      return total + item.quantity * item.salePrice;
    }, 0);

    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
      paymentMethod: "klarna", // ← distinguish from Stripe sessions
    };

    await redis.setex(`payment-session:${sessionId}`, 600, JSON.stringify(sessionData));

    return res.status(201).json({ sessionId });
  } catch (error) {
    return next(error);
  }
}

export async function createOrder(req: any, res: Response, next: NextFunction) {
  console.log("PAYMENT CONTROLLER CREATE ORDER**");
  try {
    const stripeSignature = req.headers["stripe-signature"];
    if (!stripeSignature) {
      return res.status(400).send("Missing Stripe Signature");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, stripeSignature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
      console.error("Webhook signature verification failed.", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { sessionId, userId, paymentMethod } = paymentIntent.metadata;

      // ── Route to the correct order processor ──
      if (paymentMethod === "klarna") {
        await processOrder(paymentIntent, sessionId, userId, "klarna");
      } else {
        await processOrder(paymentIntent, sessionId, userId, "card");
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return next(error);
  }
}

// ─────────────────────────────────────────────
// SHARED: processOrder — handles both Stripe card & Klarna
// Extracted from your original createOrder to avoid duplication
// ─────────────────────────────────────────────
async function processOrder(paymentIntent: Stripe.PaymentIntent, sessionId: string, userId: string, paymentMethod: "card" | "klarna") {
  const sessionKey = `payment-session:${sessionId}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    console.warn("Session data expired or missing for", sessionId);
    return;
  }

  const { cart, totalAmount, shippingAddressId, coupon } = JSON.parse(sessionData);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const { name, email } = user as any;

  // Group cart items by shop
  const shopGrouped = cart.reduce((acc: any, item: any) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {});

  // Fetch seller shops once (outside the loop — fixes your original bug
  // where sellerShops was queried inside the per-shop loop)
  const createdShopIds = Object.keys(shopGrouped);
  const sellerShops = await prisma.shop.findMany({
    where: { id: { in: createdShopIds } },
    select: { id: true, sellerId: true, name: true },
  });

  for (const shopId in shopGrouped) {
    const orderItems = shopGrouped[shopId];

    let orderTotal = orderItems.reduce((sum: number, p: any) => sum + p.quantity * p.salePrice, 0);

    // ── Apply coupon discount (fixes your original bug: .some() returns boolean,
    //    not the item — should be .find()) ──
    if (coupon?.discountedProductId && orderItems.some((item: any) => item.id === coupon.discountedProductId)) {
      const discountedItem = orderItems.find((item: any) => item.id === coupon.discountedProductId);

      if (discountedItem) {
        const discount =
          coupon.discountPercent > 0
            ? (discountedItem.salePrice * discountedItem.quantity * coupon.discountPercent) / 100
            : coupon.discountAmount ?? 0; // fallback to flat discount

        orderTotal -= discount;
      }
    }

    // ── Create Order ──
    const order = await prisma.order.create({
      data: {
        userId,
        shopId,
        total: orderTotal,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod, // ← store whether paid via card, klarna or paypal
        shippingAddressId: shippingAddressId || null,
        couponCode: coupon?.code || null,
        discountAmount: coupon?.discountAmount || 0,
        items: {
          create: orderItems.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.salePrice,
            selectedOptions: item.selectedOptions,
          })),
        },
      },
    });

    // ── Update product stock + analytics ──
    for (const item of orderItems) {
      const { id: productId, quantity } = item;

      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          totalSales: { increment: quantity },
        },
      });

      await prisma.productAnalytics.upsert({
        where: { productId },
        create: {
          productId,
          shopId,
          purchases: quantity,
          lastViewedAt: new Date(),
        },
        update: { purchases: { increment: quantity } },
      });

      // Upsert userAnalytics
      const existingUserAnalytics = await prisma.userAnalytics.findUnique({
        where: { userId },
      });

      const newAction = {
        productId,
        shopId,
        action: "purchase",
        paymentMethod,
        timestamp: Date.now(),
      };

      const currentActions = Array.isArray(existingUserAnalytics?.actions) ? existingUserAnalytics.actions : [];

      if (existingUserAnalytics) {
        await prisma.userAnalytics.update({
          where: { userId },
          data: {
            lastVisited: new Date(),
            actions: [...currentActions, newAction],
          },
        });
      } else {
        await prisma.userAnalytics.create({
          data: { userId, lastVisited: new Date(), actions: [newAction] },
        });
      }
    }

    // ── Send order confirmation email ──
    // Fix: coupon?.discountAmoun → coupon?.discountAmount (typo in your original)
    const subject = "Your Ccius Order Confirmation";
    await sendEmail(email, subject, "order-confirmation-email", {
      name,
      cart,
      paymentMethod,
      totalAmount: coupon?.discountAmount ? totalAmount - coupon.discountAmount : totalAmount,
      trackingUrl: `/order/${order.id}`,
    });

    // ── Notify sellers ──
    const shop = sellerShops.find((s) => s.id === shopId);
    if (shop) {
      const firstProduct = shopGrouped[shop.id][0];
      const productTitle = firstProduct?.title || "new item";

      await prisma.notification.create({
        data: {
          title: "🛒 New Order Received",
          message: `A customer just ordered ${productTitle} from your shop via ${paymentMethod}.`,
          buyerId: userId,
          receiverId: shop.sellerId,
          redirectLink: `/order/${order.id}`,
        },
      });
    }

    // ── Notify admin ──
    await prisma.notification.create({
      data: {
        title: "📦 Platform Order Alert",
        message: `A new order was placed by ${name} via ${paymentMethod}.`,
        buyerId: userId,
        receiverId: UserRole.ADMIN,
        redirectLink: `/order/${order.id}`,
      },
    });

    await redis.del(sessionKey);
  }
}
