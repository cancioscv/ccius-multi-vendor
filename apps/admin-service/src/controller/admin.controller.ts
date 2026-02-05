import { prisma, UserRole } from "@e-com/db";
import { ValidationError } from "@e-com/libs";
import { NextFunction, Request, Response } from "express";

// Get all products
export async function getAllProducts(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: {
          startingDate: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          salePrice: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          images: {
            select: { url: true },
            take: 1,
          },
          shop: {
            select: { name: true },
          },
        },
      }),
      prisma.product.count({
        where: {
          startingDate: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get all events
export async function getAllEvents(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [events, totalEvents] = await Promise.all([
      prisma.product.findMany({
        where: {
          startingDate: {
            not: null,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          salePrice: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          startingDate: true,
          endingDate: true,
          images: {
            select: { url: true },
            take: 1,
          },
          shop: {
            select: { name: true },
          },
        },
      }),
      prisma.product.count({
        where: {
          startingDate: {
            not: null,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalEvents / limit);

    return res.status(200).json({
      success: true,
      data: events,
      meta: {
        totalEvents,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get all admins
export async function getAllAdmins(req: Request, res: Response, next: NextFunction) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
    });

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    return next(error);
  }
}

// Add new admin
export async function addNewAdmin(req: Request, res: Response, next: NextFunction) {
  const { email, role } = req.body;
  try {
    const isUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!isUser) {
      return next(new ValidationError("User not found."));
    }

    const updateRole = await prisma.user.update({
      where: { email },
      data: { role: role.toUpperCase() },
    });

    return res.status(201).json({
      success: true,
      updateRole,
    });
  } catch (error) {
    return next(error);
  }
}

// Fetch all customizations
export async function getAllCustomizations(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.siteConfig.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || {},
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (error) {
    return next(error);
  }
}

// Get all users
export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  try {
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalUsers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get all sellers
export async function getAllSellers(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [sellers, totalSellers] = await Promise.all([
      prisma.seller.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          shop: {
            select: {
              id: true,
              name: true,
              avatar: true,
              address: true,
            },
          },
        },
      }),
      prisma.seller.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);

    res.status(200).json({
      success: true,
      data: sellers,
      meta: {
        totalSellers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get all notifications
export async function getAllNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: UserRole.ADMIN,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
}

// Get all users notifications
export async function getUserNotifications(req: any, res: Response, next: NextFunction) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
}
