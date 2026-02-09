import { prisma } from "@e-com/db";
import redis, { AuthError, clearUnseenCount, getUnseenCount, NotFoundError, ValidationError } from "@e-com/libs";
import { NextFunction, Response } from "express";

// Create a new conversation
export async function createNewConversation(req: any, res: Response, next: NextFunction) {
  const { sellerId } = req.body;
  const userId = req.user.id;

  try {
    if (!sellerId) {
      return next(new ValidationError("Seller ID is required."));
    }

    // Check if a conversation group already exists for this user and selle
    const existingGroup = await prisma.conversationGroup.findFirst({
      where: {
        isGroup: false,
        participantsIds: {
          hasEvery: [userId, sellerId],
        },
      },
    });

    if (existingGroup) {
      return res.status(200).json({ conversation: existingGroup, isNew: false });
    }

    // Create convesation + participants
    const newGroup = await prisma.conversationGroup.create({
      data: {
        isGroup: false,
        creatorId: userId,
        participantsIds: [userId, sellerId],
      },
    });

    await prisma.participant.createMany({
      data: [
        {
          conversationId: newGroup.id,
          userId,
        },
        {
          conversationId: newGroup.id,
          sellerId,
        },
      ],
    });

    return res.status(201).json({ conversation: newGroup, isNew: true });
  } catch (error) {
    return next(error);
  }
}

// Get user conversatins
export async function getUserConversations(req: any, res: Response, next: NextFunction) {
  const userId = req.user.id;
  try {
    // Find all conversationsGroups where the user is a participant
    const conversations = await prisma.conversationGroup.findMany({
      where: {
        participantsIds: {
          has: userId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const responseData = await Promise.all(
      conversations.map(async (group) => {
        // Get the Seller participant inside this conversation
        const sellerParticipant = await prisma.participant.findFirst({
          where: {
            conversationId: group.id,
            sellerId: { not: null },
          },
        });

        // Get Seller's full info
        let seller = null;
        if (sellerParticipant?.sellerId) {
          seller = await prisma.seller.findUnique({
            where: {
              id: sellerParticipant.sellerId,
            },
            include: {
              shop: true,
            },
          });
        }

        // Get last message in the conversation. TODO: message table was never created. Check out!!!
        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Check online status from Redis
        let isOnline = false;
        if (sellerParticipant?.sellerId) {
          const redisKey = `online:seller:${sellerParticipant.sellerId}`;
          const redisResult = await redis.get(redisKey);
          isOnline = !!redisResult;
        }

        const unreadCount = await getUnseenCount("user", group.id);

        return {
          conversationId: group.id,
          seller: {
            id: seller?.id || null,
            name: seller?.shop?.name || "Unknown",
            isOnline,
            avatar: seller?.shop?.avatar,
          },
          lastMessage: lastMessage?.content || "Say something to start a conversation.",
          lastMessageAt: lastMessage?.createdAt || group.updatedAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ conversations: responseData });
  } catch (error) {
    return next(error);
  }
}

// Get seller conversations
export async function getSellerConversations(req: any, res: Response, next: NextFunction) {
  const sellerId = req.seller.id;

  try {
    const conversations = await prisma.conversationGroup.findMany({
      where: {
        participantsIds: {
          has: sellerId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const responseData = await Promise.all(
      conversations.map(async (group) => {
        // Get thee user participant (NOT seller) for this conversation
        const userParticipant = await prisma.participant.findFirst({
          where: {
            conversationId: group.id,
            userId: { not: null },
          },
        });

        // Get user details
        let user = null;
        if (userParticipant?.userId) {
          user = await prisma.user.findUnique({
            where: {
              id: userParticipant.userId,
            },
            include: {
              avatar: true,
            },
          });
        }

        // Get last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Online status from Redis
        let isOnline = false;
        if (userParticipant?.userId) {
          const redisKey = `online:user:user_${userParticipant.userId}`;
          const redisResult = await redis.get(redisKey);
          isOnline = !!redisResult;
        }

        const unreadCount = await getUnseenCount("seller", group.id);

        return {
          conversationId: group.id,
          user: {
            id: user?.id || null,
            name: user?.name || "Unknown",
            avatar: user?.avatar || null,
            isOnline,
          },
          lastMessage: lastMessage?.content || "Say something to start a conversation!!!",
          lastMessageAt: lastMessage?.createdAt || group.updatedAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ conversations: responseData });
  } catch (error) {
    return next(error);
  }
}

// Fetch user messages
export async function getUserMessages(req: any, res: Response, next: NextFunction) {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 10;

  try {
    if (!conversationId) {
      return next(new ValidationError("Conversation Id is required!"));
    }

    // Chet if user has access to this conversation
    const conversation = await prisma.conversationGroup.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return next(new NotFoundError("Conversation not fount!"));
    }

    const hasAccess = conversation.participantsIds.includes(userId);

    if (!hasAccess) {
      return next(new AuthError("Access denied to this conversation."));
    }

    // Clear unseen messages for this user
    await clearUnseenCount("user", conversationId);

    // Get the sellerr participant
    const sellerParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        sellerId: { not: null },
      },
    });

    // Fetch seller info
    let seller = null;
    let isOnline = false;

    if (sellerParticipant?.sellerId) {
      seller = await prisma.seller.findUnique({
        where: { id: sellerParticipant.sellerId },
        include: { shop: true },
      });
    }

    const redisKey = `online:seller:${sellerParticipant?.sellerId}`;
    const redisResult = await redis.get(redisKey);
    isOnline = !!redisResult;

    // Fetch paginated messages (latest first)
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      messages,
      seller: {
        id: seller?.id || null,
        name: seller?.shop?.name || "Unknown",
        avatar: seller?.shop?.avatar || null,
        isOnline,
      },
      currentPage: page,
      hastMore: messages.length === pageSize,
    });
  } catch (error) {
    return next(error);
  }
}

// Fetch seller messages
export async function getSellerMessages(req: any, res: Response, next: NextFunction) {
  const sellerId = req.seller.id;
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 10;

  try {
    if (!conversationId) {
      return next(new ValidationError("Conversation Id is required."));
    }

    // Validate access
    const conversation = await prisma.conversationGroup.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return next(new NotFoundError("Conversation not found."));
    }

    if (!conversation.participantsIds.includes(sellerId)) {
      return next(new AuthError("Access denied to this conversation."));
    }

    // Clear unseen message for this seler
    await clearUnseenCount("seller", conversationId);

    // Get user participant
    const userParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId: { not: null },
      },
    });

    // Get user info
    let user = null;
    let isOnline = false;

    if (userParticipant?.userId) {
      user = await prisma.user.findUnique({
        where: {
          id: userParticipant.userId,
        },
        include: { avatar: true },
      });

      const redisKey = `online:user:user_${userParticipant.userId}`;
      const redisResult = await redis.get(redisKey);
      isOnline = !!redisResult;
    }

    // Get paginated messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      messages,
      user: {
        id: user?.id || null,
        name: user?.name || "Unknown",
        avatar: user?.avatar || null,
        isOnline,
      },
      currentPage: page,
      hasMore: messages.length === pageSize,
    });
  } catch (error) {
    return next(error);
  }
}
