-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(1024) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `device_name` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `idx_refresh_tokens_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `theme` VARCHAR(64) NOT NULL DEFAULT 'cyberpunk',
    `font` VARCHAR(64) NOT NULL DEFAULT 'inter',
    `tab_orientation` ENUM('horizontal', 'vertical') NOT NULL DEFAULT 'horizontal',
    `terminal_font_size` SMALLINT UNSIGNED NOT NULL DEFAULT 14,
    `terminal_cursor_style` ENUM('block', 'underline', 'bar') NOT NULL DEFAULT 'block',
    `terminal_cursor_blink` BOOLEAN NOT NULL DEFAULT true,
    `default_directory` VARCHAR(1024) NOT NULL DEFAULT '',
    `sound_notifications` BOOLEAN NOT NULL DEFAULT true,
    `desktop_notifications` BOOLEAN NOT NULL DEFAULT true,
    `selected_sound_id` VARCHAR(128) NOT NULL DEFAULT 'default',
    `auto_restore_session` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_settings_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_sounds` (
    `id` VARCHAR(128) NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `data_url` LONGTEXT NOT NULL,
    `mime_type` VARCHAR(64) NOT NULL DEFAULT 'audio/mpeg',
    `size_bytes` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_custom_sounds_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cli_tools` (
    `id` VARCHAR(128) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `command` VARCHAR(512) NOT NULL,
    `check_command` VARCHAR(512) NULL,
    `link` VARCHAR(2048) NULL,
    `is_custom` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_cli_tools_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cli_builtin_overrides` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `cli_id` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NULL,
    `command` VARCHAR(512) NULL,
    `check_command` VARCHAR(512) NULL,
    `link` VARCHAR(2048) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_user_cli_override`(`user_id`, `cli_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_presets` (
    `id` VARCHAR(128) NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    `root_path` VARCHAR(1024) NOT NULL,
    `terminal_count` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `selected_cli` VARCHAR(128) NULL,
    `ide_vscode` BOOLEAN NOT NULL DEFAULT false,
    `ide_antigravity` BOOLEAN NOT NULL DEFAULT false,
    `layout` JSON NULL,
    `created_at` BIGINT UNSIGNED NOT NULL,
    `updated_at` BIGINT UNSIGNED NOT NULL,

    INDEX `idx_workspace_presets_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preset_terminals` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `preset_id` VARCHAR(128) NOT NULL,
    `cli` VARCHAR(128) NULL,
    `cwd` VARCHAR(1024) NOT NULL,
    `custom_title` VARCHAR(255) NULL,
    `position` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `idx_preset_terminals_preset_id`(`preset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `directory_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `position` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_directory_history_position`(`user_id`, `position`),
    UNIQUE INDEX `uq_user_directory_path`(`user_id`, `path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `client_device_id` VARCHAR(255) NOT NULL,
    `client_version` VARCHAR(64) NOT NULL,
    `status` ENUM('SUCCESS', 'CONFLICT', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    `payload_summary` VARCHAR(512) NULL,
    `synced_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_sync_logs_user_date`(`user_id`, `synced_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `cli_builtin_overrides` ADD CONSTRAINT `cli_builtin_overrides_cli_id_fkey` FOREIGN KEY (`cli_id`) REFERENCES `cli_tools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_presets` ADD CONSTRAINT `workspace_presets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_presets` ADD CONSTRAINT `workspace_presets_selected_cli_fkey` FOREIGN KEY (`selected_cli`) REFERENCES `cli_tools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preset_terminals` ADD CONSTRAINT `preset_terminals_preset_id_fkey` FOREIGN KEY (`preset_id`) REFERENCES `workspace_presets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preset_terminals` ADD CONSTRAINT `preset_terminals_cli_fkey` FOREIGN KEY (`cli`) REFERENCES `cli_tools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `directory_history` ADD CONSTRAINT `directory_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_logs` ADD CONSTRAINT `sync_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
