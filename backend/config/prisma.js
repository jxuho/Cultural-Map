const { PrismaClient } = require('@prisma/client');

// 전역에서 하나의 Prisma 인스턴스만 사용하도록 설정 (싱글톤 패턴)
const prisma = new PrismaClient();

module.exports = prisma;
