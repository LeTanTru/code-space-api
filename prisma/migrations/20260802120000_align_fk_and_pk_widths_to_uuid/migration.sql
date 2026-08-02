/*
  Warnings:

  - The primary key for the `cli_tools` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `cli_tools` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - The primary key for the `custom_sounds` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `custom_sounds` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - You are about to alter the column `cli_id` on the `cli_builtin_overrides` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - You are about to alter the column `preset_id` on the `preset_terminals` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - You are about to alter the column `cli` on the `preset_terminals` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - You are about to alter the column `selected_sound_id` on the `user_settings` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - The primary key for the `workspace_presets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `workspace_presets` table. The data in that column will be cast from VarChar(128) to VarChar(36).
  - You are about to alter the column `selected_cli` on the `workspace_presets` table. The data in that column will be cast from VarChar(128) to VarChar(36).

*/
-- DropForeignKey
ALTER TABLE `cli_builtin_overrides` DROP FOREIGN KEY `cli_builtin_overrides_cli_id_fkey`;

-- DropForeignKey
ALTER TABLE `preset_terminals` DROP FOREIGN KEY `preset_terminals_cli_fkey`;

-- DropForeignKey
ALTER TABLE `preset_terminals` DROP FOREIGN KEY `preset_terminals_preset_id_fkey`;

-- DropForeignKey
ALTER TABLE `workspace_presets` DROP FOREIGN KEY `workspace_presets_selected_cli_fkey`;

-- DropIndex
DROP INDEX `cli_builtin_overrides_cli_id_fkey` ON `cli_builtin_overrides`;

-- DropIndex
DROP INDEX `preset_terminals_cli_fkey` ON `preset_terminals`;

-- DropIndex
DROP INDEX `workspace_presets_selected_cli_fkey` ON `workspace_presets`;

-- AlterTable
ALTER TABLE `cli_builtin_overrides` MODIFY `cli_id` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `cli_tools` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `custom_sounds` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `preset_terminals` MODIFY `preset_id` VARCHAR(36) NOT NULL,
    MODIFY `cli` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `user_settings` MODIFY `selected_sound_id` VARCHAR(36) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `workspace_presets` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `selected_cli` VARCHAR(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `cli_builtin_overrides` ADD CONSTRAINT `cli_builtin_overrides_cli_id_fkey` FOREIGN KEY (`cli_id`) REFERENCES `cli_tools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_presets` ADD CONSTRAINT `workspace_presets_selected_cli_fkey` FOREIGN KEY (`selected_cli`) REFERENCES `cli_tools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preset_terminals` ADD CONSTRAINT `preset_terminals_preset_id_fkey` FOREIGN KEY (`preset_id`) REFERENCES `workspace_presets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preset_terminals` ADD CONSTRAINT `preset_terminals_cli_fkey` FOREIGN KEY (`cli`) REFERENCES `cli_tools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;