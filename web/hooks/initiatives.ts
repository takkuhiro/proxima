import type { Initiative } from "@/app/types"

export async function fetchInitiatives(userId: string): Promise<Initiative[]> {
	const res = await fetch(`/api/initiatives?userId=${userId}`)
	return res.json()
}

export async function createInitiative(
	initiative: Omit<Initiative, "id" | "createdAt" | "deleted">,
): Promise<Initiative> {
	const res = await fetch("/api/initiatives", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(initiative),
	})
	return res.json()
}

export async function deleteInitiative(userId: string, id: string) {
	const res = await fetch(`/api/initiatives?userId=${userId}&id=${id}`, {
		method: "DELETE",
	})
	return res.json()
}
