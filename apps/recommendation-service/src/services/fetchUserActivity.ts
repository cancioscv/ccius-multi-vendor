import { prisma } from "@e-com/db";
export async function getUserActivity(userId: string) {
  try {
    const userActivity = await prisma.userAnalytics.findUnique({
      where: { userId },
      select: { actions: true },
    });

    return userActivity?.actions || [];
  } catch (error) {
    console.error("Error fetching user activity", error);
    return [];
  }
}
