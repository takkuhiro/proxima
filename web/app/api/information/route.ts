import { getArticles, updateArticleFavorite } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest): Promise<NextResponse> {
	const userId = req.nextUrl.searchParams.get("userId")
	if (!userId) {
		return NextResponse.json({ error: "userId is required" }, { status: 400 })
	}
	const articles = await getArticles(userId)
	return NextResponse.json(articles)
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
	const userId = req.nextUrl.searchParams.get("userId")
	if (!userId) {
		return NextResponse.json({ error: "userId is required" }, { status: 400 })
	}
	const { id, favorite } = await req.json()

	const result = await updateArticleFavorite(userId, id, favorite)
	return NextResponse.json(result)
}
