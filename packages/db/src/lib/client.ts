import 'dotenv/config.js';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

const globalFormPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== 'production') globalFormPrisma.prisma = prisma;

export { prisma };
