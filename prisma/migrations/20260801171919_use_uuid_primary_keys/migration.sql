/*
  Warnings:

  - The primary key for the `cli_builtin_overrides` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `cli_builtin_overrides` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `cli_builtin_overrides` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `cli_tools` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `custom_sounds` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `directory_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `directory_history` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `directory_history` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `email_verifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `email_verifications` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `password_reset_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `password_reset_tokens` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `preset_terminals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `preset_terminals` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `refresh_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `sync_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `sync_logs` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `sync_logs` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `user_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_settings` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `user_settings` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.
  - You are about to alter the column `user_id` on the `workspace_presets` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `VarChar(36)`.

*/
-- DropForeignKey
ALTER TABLE `cli_builtin_overrides` DROP FOREIGN KEY `cli_builtin_overrides_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `cli_tools` DROP FOREIGN KEY `cli_tools_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `custom_sounds` DROP FOREIGN KEY `custom_sounds_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `directory_history` DROP FOREIGN KEY `directory_history_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `refresh_tokens_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `sync_logs` DROP FOREIGN KEY `sync_logs_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_settings` DROP FOREIGN KEY `user_settings_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `workspace_presets` DROP FOREIGN KEY `workspace_presets_user_id_fkey`;

-- AlterTable
ALTER TABLE `cli_builtin_overrides` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `user_id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `cli_tools` MODIFY `user_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `custom_sounds` MODIFY `user_id` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `directory_history` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `user_id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `email_verifications` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `password_reset_tokens` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `preset_terminals` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `refresh_tokens` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `user_id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `sync_logs` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `user_id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user_settings` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `user_id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `workspace_presets` MODIFY `user_id` VARCHAR(36) NOT NULL;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_sounds` ADD CONSTRAINT `custom_sounds_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cli_tools` ADD CONSTRAINT `cli_tools_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cli_builtin_overrides` ADD CONSTRAINT `cli_builtin_overrides_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_presets` ADD CONSTRAINT `workspace_presets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `directory_history` ADD CONSTRAINT `directory_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_logs` ADD CONSTRAINT `sync_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
