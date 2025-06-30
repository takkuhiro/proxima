import type { ChatMessage } from "@/app/types"
import { db } from "@/db/index"
import * as schema from "@/db/schema"

export const ChatRepository = {
	async createChatMessage(data: ChatMessage): Promise<void> {
		try {
			const c = schema.chats
			await db.insert(c).values({
				id: data.id,
				role: data.role,
				message: data.message,
				created_at: new Date(),
			})
		} catch (error) {
			console.error("チャットメッセージの保存中にエラーが発生しました:", error)
			throw new Error("チャットメッセージの保存に失敗しました")
		}
	},
}
