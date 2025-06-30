import * as dotenv from "dotenv"
import { drizzle } from "drizzle-orm/mysql2"
import { migrate } from "drizzle-orm/mysql2/migrator"
import mysql from "mysql2/promise"

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set")
}

const connection = mysql.createPool(DATABASE_URL)
const db = drizzle(connection)

async function main() {
	try {
		console.log("マイグレーションを開始します...")
		await migrate(db, { migrationsFolder: "./db/migrations" })
		console.log("マイグレーションが完了しました！")
	} catch (error) {
		console.error("マイグレーション中にエラーが発生しました:", error)
	} finally {
		await connection.end()
	}
}

main()
