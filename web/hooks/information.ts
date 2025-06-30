import type { Article } from "@/app/types"

export async function fetchArticles(userId: string): Promise<Article[]> {
	const res = await fetch(`/api/information?userId=${userId}`)
	return res.json()
}
