import type { Quest } from "@/app/types"

export async function fetchTasks(userId: string) {
	const res = await fetch(`/api/tasks?userId=${userId}`)
	return res.json()
}

export async function createTask(
	task: Omit<Quest, "id" | "recommend" | "completed" | "createdAt">,
) {
	const res = await fetch("/api/tasks", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(task),
	})
	return res.json()
}

export async function updateTaskCompletion(id: string, completed: boolean) {
	const res = await fetch(`/api/tasks?id=${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ completed }),
	})
	return res.json()
}

export async function deleteTask(id: string) {
	const res = await fetch(`/api/tasks?id=${id}`, {
		method: "DELETE",
	})
	return res.json()
}
