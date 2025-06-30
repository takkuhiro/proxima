import { createRoutine, deleteTask, getDailyTasks } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// POST: /api/habit
// body: { id: string, userId: string, frequency?: string, time?: string }
export async function POST(req: NextRequest) {
	const { id, userId, frequency, time } = await req.json()
	if (!id || !userId) {
		return NextResponse.json(
			{ error: "id and userId are required" },
			{ status: 400 },
		)
	}

	// 1. 元のデイリークエストを取得
	const tasks = await getDailyTasks(userId)
	const quest = tasks.find((t) => t.id === id)
	if (!quest) {
		return NextResponse.json({ error: "Quest not found" }, { status: 404 })
	}

	// 2. ルーティーンとして追加
	const routine = await createRoutine({
		userId: userId,
		title: quest.title,
		description: quest.description,
		frequency: frequency || "毎日",
		time: time || "",
		category: quest.category,
	})

	// 3. デイリークエストを削除
	await deleteTask(id)

	return NextResponse.json(routine)
}
