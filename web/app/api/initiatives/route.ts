import { createInitiatives, deleteInitiatives, getInitiatives } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const userId = searchParams.get("userId")
	if (!userId) return NextResponse.json([], { status: 400 })
	const initiatives = await getInitiatives(userId)
	return NextResponse.json(initiatives)
}

export async function POST(req: NextRequest) {
	const data = await req.json()
	const { userId, ...initiative } = data
	if (!userId)
		return NextResponse.json({ error: "userId required" }, { status: 400 })
	await createInitiatives(userId, [initiative])
	return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const userId = searchParams.get("userId")
	const id = searchParams.get("id")
	if (!userId || !id)
		return NextResponse.json(
			{ error: "userId and id required" },
			{ status: 400 },
		)
	await deleteInitiatives(userId, id)
	return NextResponse.json({ ok: true })
}
