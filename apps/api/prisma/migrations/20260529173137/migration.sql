/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cnpj` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "cnpj" TEXT NOT NULL,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "tradeName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_cnpj_key" ON "Store"("cnpj");

-- CreateIndex
CREATE INDEX "Store_cnpj_idx" ON "Store"("cnpj");
