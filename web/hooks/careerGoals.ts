import type { CareerGoal } from "@/app/types"

export async function fetchCareerGoals(userId: string) {
	const res = await fetch(`/api/career-goals?userId=${userId}`)
	return res.json()
}

export async function createCareerGoal(
	goal: Omit<CareerGoal, "id" | "createdAt" | "deleted">,
) {
	const res = await fetch("/api/career-goals", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(goal),
	})
	return res.json()
}

export async function deleteCareerGoal(userId: string, id: string) {
	const res = await fetch(`/api/career-goals?userId=${userId}&id=${id}`, {
		method: "DELETE",
	})
	return res.json()
}
