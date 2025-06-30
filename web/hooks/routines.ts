import type { Routine } from "@/app/types"

export async function fetchRoutines(userId: string) {
	const res = await fetch(`/api/routines?userId=${userId}`)
	return res.json()
}

export async function createRoutine(
	routine: Omit<
		Routine,
		"id" | "streak" | "completed" | "createdAt" | "deleted"
	>,
) {
	const res = await fetch("/api/routines", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(routine),
	})
	return res.json()
}

export async function updateRoutineCompletion(
	userId: string,
	id: string,
	completed: boolean,
) {
	const res = await fetch(`/api/routines?id=${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId, completed }),
	})
	return res.json()
}

export async function deleteRoutine(id: string) {
	const res = await fetch(`/api/routines?id=${id}`, {
		method: "DELETE",
	})
	return res.json()
}
