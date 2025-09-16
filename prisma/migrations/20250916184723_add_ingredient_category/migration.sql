/*
  Warnings:

  - Added the required column `category` to the `ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ingredients` ADD COLUMN `category` VARCHAR(64) NOT NULL;
