import { prisma, OrderStatus, PaymentStatus, DiscountType, UserRole } from "@e-com/db";
import Stripe from "stripe";
import { NextFunction, Response } from "express";
import redis, { NotFoundError, ValidationError } from "@e-com/libs";
import stripe from "../utils/stripe.js";
import { sendEmail } from "../utils/send-email/index.js";

// Create Payment intent
export async function createPaymentIntent(req: any, res: Response, next: NextFunction) {
  const { amount, sellerStripeAccountId, sessionId } = req.body;

  const customerAmount = Math.round(amount * 100);
  const platformFee = Math.round(customerAmount * 0.1);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount,
      currency: "usd",
      payment_method_types: ["card"],
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      metadata: {
        sessionId,
        userId: req.user?.id,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return next(error);
  }
}

// Create payment session. (This for security, this is custom logic, not stripe logic)
export async function createPaymentSession(req: any, res: Response, next: NextFunction) {
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
      // .sort((a, b) => {
      //   if (a && b) return a.id.localCompare(b.id);
      // })
    );

    const keys = await redis.keys("payment-session:*");

    for (const key in keys) {
      const data = await redis.get(key);

      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          const existingCart = JSON.stringify(
            session.cart.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              salePrice: item.salePrice,
              shopId: item.shopId,
              selectedOptions: item.selectedOptions || {},
            }))
            // .sort((a: any, b: any) => {
            //   if (a && b) return a.id.localCompare(b.id);
            // }) // This is I think for keeping the valid session from Redis
          );

          if (existingCart === normalizedCart) {
            return res.status(200).json({ sessionId: key.split(":")[1] });
          } else {
            await redis.del(key);
          }
        }
      }
    }

    // Fetch sellers and their Stripe Accounts
    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))]; // Creates "uniques" Ids

    const shops = await prisma.shop.findMany({
      where: {
        id: { in: uniqueShopIds },
      },
      select: {
        id: true,
        sellerId: true,
        sellers: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    const sellerData = shops.map((shop) => ({
      shopId: shop?.id,
      sellerId: shop?.sellerId,
      stripeAccountId: shop?.sellers.stripeId,
    }));

    // Total amount
    const totalAmount = cart.reduce((total: number, item: any) => {
      return total + item.quantity * item.salePrice;
    }, 0);

    // Create Session payload
    const sessionId = crypto.randomUUID();

    const sessionData = {
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
    };

    await redis.setex(`payment-session:${sessionId}`, 600, JSON.stringify(sessionData)); // 600: 10 minutes

    return res.status(201).json({ sessionId });
  } catch (error) {
    return next(error);
  }
}

// Verify Payment Session
export async function verifyPaymentSession(req: any, res: Response, next: NextFunction) {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    // Get Session from Redis
    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return res.status(404).json({ error: "Session not found or expired." });
    }

    // Parse and return session
    const session = JSON.parse(sessionData);
    return res.status(200).json({ success: true, session });
  } catch (error) {
    return next(error);
  }
}

// CREATE ORDER
export async function createOrder(req: any, res: Response, next: NextFunction) {
  try {
    const stripeSignature = req.headers["stripe-signature"];
    if (!stripeSignature) {
      return res.status(400).send("Missing Stripe Signature");
    }

    const rawBody = req.rawBody;

    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, stripeSignature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
      console.error("Webhook signature verification failed.", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const sessionId = paymentIntent.metadata.sessionId;
      const userId = paymentIntent.metadata.userId;

      const sessionKey = `payment-session:${sessionId}`;
      const sessionData = await redis.get(sessionKey);

      if (!sessionData) {
        console.warn("Session data expired or missing for", sessionId);
        return res.status(200).send("No session found.");
      }

      const { cart, totalAmount, shippingAddressId, coupon } = JSON.parse(sessionData);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const { name, email } = user as any;

      const shopGrouped = cart.reduce((acc: any, item: any) => {
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);

        return acc;
      }, {});

      for (const shopId in shopGrouped) {
        const orderItems = shopGrouped[shopId];

        let orderTotal = orderItems.reduce((sum: number, p: any) => sum + p.quantity * p.salePrice, 0);

        // Apply disccount id applicable
        if (coupon && coupon.discountedProductId && orderItems.some((item: any) => item.id === coupon.discountedProductId)) {
          const discountedItem = orderItems.some((item: any) => item.id === coupon.discountedProductId);

          if (discountedItem) {
            const discount =
              coupon.discountPercent > 0
                ? (discountedItem.salePrice * discountedItem.quantity * coupon.discountPercent) / 100
                : coupon.discountPercent;

            orderTotal -= discount;
          }
        }

        // Create Order
        const order = await prisma.order.create({
          data: {
            userId,
            shopId,
            total: orderTotal,
            paymentStatus: PaymentStatus.PAID,
            shippingAddressId: shippingAddressId || null,
            couponCode: coupon.code || null,
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

        // Update products and analytics
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
            update: {
              purchases: { increment: quantity },
            },
          });

          const existingUserAnalytics = await prisma.userAnalytics.findUnique({
            where: { userId },
          });

          const newAction = {
            productId,
            shopId,
            action: "purchase",
            timestamp: Date.now(),
          };

          const currentActions = Array.isArray(existingUserAnalytics?.actions) ? existingUserAnalytics.actions : [];

          if (existingUserAnalytics) {
            await prisma.userAnalytics.update({
              where: { userId },
              data: {
                lastVisited: new Date(),
                actions: [...currentActions, newAction], // TODO: actions and kafka
              },
            });
          } else {
            await prisma.userAnalytics.create({
              data: {
                userId,
                lastVisited: new Date(),
                actions: [newAction],
              },
            });
          }
        }

        // Send Email confirmation to user. TODO: CONSIDER THIS MOVE TO email-service
        const subject = "Your Ccius Order Confirmation";
        await sendEmail(email, subject, "order-confirmation-email", {
          name,
          cart,
          totalAmount: coupon?.discountAmount ? totalAmount - coupon?.discountAmount : totalAmount,
          trackingUrl: `/order/${order.id}`,
        });

        // Create notifications for sellers
        const createdShopIds = Object.keys(shopGrouped);
        const sellerShops = await prisma.shop.findMany({
          where: {
            id: { in: createdShopIds },
          },
          select: {
            id: true,
            sellerId: true,
            name: true,
          },
        });

        for (const shop of sellerShops) {
          const firstProduct = shopGrouped[shop.id][0];
          const productTitle = firstProduct?.title || "new item";

          await prisma.notification.create({
            data: {
              title: "🛒 New Order Received",
              message: `A customer just ordered ${productTitle} from your shop.`,
              buyerId: userId,
              receiverId: shop.sellerId, // TODO: Define who is the receiver
              redirectLink: `/order/${order.id}`, // TODO: After deploying change this to the correct domain
            },
          });
        }

        // Create notifications for admin
        await prisma.notification.create({
          data: {
            title: "📦 Platform Order Alert",
            message: `A new order was placed by ${name}.`,
            buyerId: userId,
            receiverId: UserRole.ADMIN,
            redirectLink: `/order/${order.id}`, // TODO: After deploying change this to the correct domain
          },
        });

        await redis.del(sessionKey);
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.log("Error", error);
    return next(error);
  }
}

// Get User Orders
export async function getUserOrders(req: any, res: Response, next: NextFunction) {
  const user = req.user;
  try {
    // await sendLog({
    //   type: "success",
    //   message: `User orders retrieved ${req.user?.email}`,
    //   source: "order-service",
    // });

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
}

// Get Seller Orders
export async function getSellerOrders(req: any, res: Response, next: NextFunction) {
  const seller = req.seller;
  try {
    const shop = await prisma.shop.findUnique({
      where: {
        sellerId: seller?.id,
      },
    });

    // Get all orders for this shop
    const orders = await prisma.order.findMany({
      where: {
        shopId: shop?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
}

// Get order details
export async function getOrderDetails(req: any, res: Response, next: NextFunction) {
  try {
    const orderId = req.params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return next(new NotFoundError("Order not found with this ID."));
    }

    let shippingAddress;
    if (order.shippingAddressId) {
      shippingAddress = await prisma.address.findUnique({
        where: {
          id: order?.shippingAddressId,
        },
      });
    } else {
      shippingAddress = null;
    }

    let coupon;
    if (order.couponCode) {
      coupon = await prisma.discountCode.findUnique({
        where: { discountCode: order.couponCode },
      });
    } else {
      coupon = null;
    }

    // Fetch all products details in one go
    const productIds = order.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    const items = order.items.map((item) => ({
      ...item,
      selectedOptions: item.selectedOptions,
      product: productMap.get(item.productId) || null,
    }));

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
        shippingAddress,
        couponCode: coupon,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Update delivery status
export async function updateDeliveryStatus(req: any, res: Response, next: NextFunction) {
  const { orderId } = req.params;
  const { deliveryStatus } = req.body;

  try {
    if (!orderId && !deliveryStatus) {
      return res.status(400).json({ error: "Missing OrderID and Delivery Status." });
    }

    const allowedStatuses = [OrderStatus.ORDERED, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];

    if (!allowedStatuses.includes(deliveryStatus)) {
      return next(new ValidationError("Invalid delivery status."));
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return next(new NotFoundError(`Order ${orderId} not found`));
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus,
        updatedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Delivery Status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    return next(error);
  }
}

// Verify Coupon Code
export async function verifyCouponCode(req: any, res: Response, next: NextFunction) {
  const { couponCode, cart } = req.body;
  try {
    if (!couponCode || !cart || cart.length === 0) {
      return next(new ValidationError("Cart and CouponCode are required."));
    }

    // Get discount code
    const discount = await prisma.discountCode.findUnique({
      where: {
        discountCode: couponCode,
      },
    });

    if (!discount) {
      return next(new ValidationError("Coupon Code is not valid."));
    }

    // Find matching product that includes this discount code
    const matchingProduct = cart.find((item: any) => item.discountCodes.some((discountCode: any) => discountCode === discount.id));

    if (!matchingProduct) {
      return res.status(200).json({
        valid: false,
        discount: 0,
        discountAmount: 0,
        message: "No matching product found in Cart for this coupon code.",
      });
    }

    let discountAmount = 0;
    const price = matchingProduct.salePrice * matchingProduct.quantity;

    if (discount.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (price * discount.discountValue) / 100;
    } else if (discount.discountType === DiscountType.FLAT) {
      discountAmount = discount.discountValue;
    }

    // Prevent discount from being greater than total price
    discountAmount = Math.min(discountAmount, price);

    return res.status(200).json({
      valid: true,
      discount: discount.discountValue,
      discountAmount: discountAmount.toFixed(2),
      discountedPrductId: matchingProduct.id,
      discountType: discount.discountType,
      message: `Discount applied to product ${matchingProduct.id}`,
    });
  } catch (error) {
    return next(error);
  }
}

// Get Admin orders
export async function getAdminOrders(req: any, res: Response, next: NextFunction) {
  try {
    // Get all orders
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        shop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
}
