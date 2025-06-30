import { sql } from "drizzle-orm"
import { char, datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core"

export const chats = mysqlTable("chats", {
	id: char("id", { length: 26 }).notNull().primaryKey(),
	role: varchar("role", { length: 255 }).notNull(),
	message: varchar("message", { length: 255 }).notNull(),
	created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})
