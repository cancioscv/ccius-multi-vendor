import { prisma } from "@e-com/db";
import { NextFunction, Response } from "express";

// Get orders
export async function getUserOrders(req: any, res: Response, next: NextFunction) {
  const user = req.user;
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: true,
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
