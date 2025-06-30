CREATE TABLE `chats` (
	`id` char(26) NOT NULL,
	`role` varchar(255) NOT NULL,
	`message` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
