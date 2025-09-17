/*
  Warnings:

  - A unique constraint covering the columns `[menuId,label]` on the table `sizes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cups` MODIFY `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `users` ADD COLUMN `hireDate` DATE NULL,
    ADD COLUMN `phone` VARCHAR(32) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `username` VARCHAR(64) NOT NULL;

-- CreateIndex
CREATE INDEX `idx_ingredients_category` ON `ingredients`(`category`);

-- CreateIndex
CREATE INDEX `idx_menu_category` ON `menu`(`category`);

-- CreateIndex
CREATE INDEX `idx_orders_paymentMethod` ON `orders`(`paymentMethod`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_sizes_menu_label` ON `sizes`(`menuId`, `label`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_users_username` ON `users`(`username`);

-- RenameIndex
ALTER TABLE `sizes` RENAME INDEX `sizes_cupId_fkey` TO `idx_sizes_cupId`;
