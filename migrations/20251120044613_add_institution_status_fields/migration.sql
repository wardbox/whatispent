-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
