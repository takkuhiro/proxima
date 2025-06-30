"use client"

import type { Routine } from "@/app/types"
import { categories } from "@/app/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUserId } from "@/hooks/auth"
import {
	createRoutine,
	deleteRoutine,
	fetchRoutines,
	updateRoutineCompletion,
} from "@/hooks/routines"
import { toast } from "@/hooks/use-toast"
import { hasRoutineFetchedAtom, routinesAtom } from "@/lib/state"
import { useAtom } from "jotai"
import {
	Calendar,
	CircleCheckBig,
	Clock,
	PlusCircle,
	Save,
	Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners"

export function RoutinesContent() {
	const [routines, setRoutines] = useAtom(routinesAtom)
	const [isAdding, setIsAdding] = useState(false)
	const [newRoutine, setNewRoutine] = useState<
		Omit<
			Routine,
			"id" | "streak" | "userId" | "completed" | "createdAt" | "deleted"
		>
	>({
		title: "",
		description: "",
		frequency: "",
		time: "",
		category: "",
	})
	const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null)
	const userId = useUserId()
	const [isLoading, setIsLoading] = useState(false)
	const [hasRoutineFetched, setHasRoutineFetched] = useAtom(
		hasRoutineFetchedAtom,
	)

	useEffect(() => {
		if (userId && !hasRoutineFetched) {
			setIsLoading(true)
			fetchRoutines(userId)
				.then((data) => {
					setRoutines(data)
				})
				.finally(() => {
					setIsLoading(false)
					setHasRoutineFetched(true)
				})
		}
	}, [userId, hasRoutineFetched, setRoutines, setHasRoutineFetched])

	const handleAddRoutine = async () => {
		if (
			newRoutine.title &&
			newRoutine.frequency &&
			newRoutine.category &&
			userId
		) {
			const routine: Omit<
				Routine,
				"id" | "streak" | "completed" | "createdAt" | "deleted"
			> = {
				userId: userId,
				title: newRoutine.title,
				description: newRoutine.description,
				frequency: newRoutine.frequency,
				time: newRoutine.time,
				category: newRoutine.category,
			}
			const createdRoutine = await createRoutine(routine)
			setRoutines([...routines, createdRoutine])
			setNewRoutine({
				title: "",
				description: "",
				frequency: "",
				time: "",
				category: "",
			})
			setIsAdding(false)
			toast({
				title: "ルーティーン追加",
				description: "新しいルーティーンが追加されました。",
			})
		}
	}

	const handleDeleteRoutine = async (id: string) => {
		await deleteRoutine(id)
		setRoutines(routines.filter((routine) => routine.id !== id))
		toast({
			title: "ルーティーン削除",
			description: "ルーティーンが削除されました。",
			variant: "destructive",
		})
	}

	const handleToggleComplete = async (id: string) => {
		const routine = routines.find((r) => r.id === id)
		if (!routine || !userId) return
		const updated = await updateRoutineCompletion(
			userId,
			id,
			!routine.completed,
		)
		setRoutines(
			routines.map((r) =>
				r.id === id ? { ...r, completed: updated.completed } : r,
			),
		)
	}

	const frequencies = [
		"毎日",
		"平日",
		"週末",
		"週1回",
		"週2回",
		"週3回",
		"週4回",
		"週5回",
		"週6回",
		"月曜日",
		"火曜日",
		"水曜日",
		"木曜日",
		"金曜日",
		"土曜日",
		"日曜日",
	]

	const getRoutineById = (id: string) =>
		routines.find((routine) => routine.id === id)

	return (
		<div className="space-y-6">
			{isLoading && (
				<div className="flex flex-col justify-center items-center py-8">
					<PulseLoader color="#888" size={12} />
					<p className="text-muted-foreground mt-4">読み込み中...</p>
				</div>
			)}
			{!isLoading && (
				<>
					<div className="space-y-4">
						{routines.map((routine) => (
							<Card
								key={routine.id}
								className={`relative cursor-pointer hover:shadow-md transition-shadow ${routine.completed ? "bg-green-100" : ""}`}
								onClick={() => handleToggleComplete(routine.id)}
							>
								{routine.completed && (
									<div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
										<CircleCheckBig className="w-20 h-20 text-green-400 opacity-90" />
									</div>
								)}
								<div className="flex flex-col md:flex-row md:items-center">
									<div className="flex-grow p-4 md:p-6">
										<div className="mb-2">
											<h3 className="font-medium text-lg">{routine.title}</h3>
											{routine.description && (
												<p className="text-sm mt-1 mb-2">
													{routine.description}
												</p>
											)}
										</div>
										<div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
											<Calendar className="h-3 w-3" />
											<span>{routine.frequency}</span>
											{routine.time && (
												<>
													<span className="mx-1">•</span>
													<Clock className="h-3 w-3" />
													<span>{routine.time}</span>
												</>
											)}
										</div>
									</div>
									<div className="p-4 md:pr-6 flex flex-col items-end gap-2">
										<Badge>{routine.category}</Badge>
										<div className="text-sm font-medium">
											<span>{routine.streak}</span> 日連続
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 p-0"
											onClick={(e) => {
												e.stopPropagation()
												handleDeleteRoutine(routine.id)
											}}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
											<span className="sr-only">削除</span>
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>

					{routines.length === 0 && (
						<Card className="bg-muted/50">
							<CardContent className="flex flex-col items-center justify-center p-6">
								<p className="text-muted-foreground mb-4">
									ルーティーンがありません
								</p>
							</CardContent>
						</Card>
					)}

					{!isAdding && !selectedRoutine && (
						<div className="flex justify-center mt-4">
							<Button variant="outline" onClick={() => setIsAdding(true)}>
								<PlusCircle className="mr-2 h-4 w-4" />
								ルーティーンを追加
							</Button>
						</div>
					)}

					{selectedRoutine && (
						<Card className="mt-8">
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle>
										{getRoutineById(selectedRoutine)?.title}
									</CardTitle>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedRoutine(null)}
									>
										閉じる
									</Button>
								</div>
								<CardDescription>
									{getRoutineById(selectedRoutine)?.description}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-muted-foreground">
									頻度: {getRoutineById(selectedRoutine)?.frequency}
									{getRoutineById(selectedRoutine)?.time && (
										<>
											<span className="mx-2">•</span>
											時間: {getRoutineById(selectedRoutine)?.time}
										</>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{isAdding && (
						<Card>
							<CardHeader>
								<CardTitle>新しいルーティーン</CardTitle>
								<CardDescription>
									継続的に取り組みたい習慣を設定しましょう
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label htmlFor="title" className="text-sm font-medium">
										タイトル
									</label>
									<Input
										id="title"
										value={newRoutine.title}
										onChange={(e) =>
											setNewRoutine({ ...newRoutine, title: e.target.value })
										}
										placeholder="ルーティーンのタイトル"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="description" className="text-sm font-medium">
										詳細 (任意)
									</label>
									<Textarea
										id="description"
										value={newRoutine.description}
										onChange={(e) =>
											setNewRoutine({
												...newRoutine,
												description: e.target.value,
											})
										}
										placeholder="ルーティーンの詳細な説明"
										rows={2}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label htmlFor="frequency" className="text-sm font-medium">
											頻度
										</label>
										<Select
											value={newRoutine.frequency}
											onValueChange={(value) =>
												setNewRoutine({ ...newRoutine, frequency: value })
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="頻度を選択" />
											</SelectTrigger>
											<SelectContent>
												{frequencies.map((frequency) => (
													<SelectItem key={frequency} value={frequency}>
														{frequency}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<label htmlFor="time" className="text-sm font-medium">
											時間 (任意)
										</label>
										<Input
											id="time"
											type="time"
											value={newRoutine.time}
											onChange={(e) =>
												setNewRoutine({ ...newRoutine, time: e.target.value })
											}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<label htmlFor="category" className="text-sm font-medium">
										カテゴリ
									</label>
									<Select
										value={newRoutine.category}
										onValueChange={(value) =>
											setNewRoutine({ ...newRoutine, category: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="カテゴリを選択" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button variant="outline" onClick={() => setIsAdding(false)}>
									キャンセル
								</Button>
								<Button
									onClick={handleAddRoutine}
									disabled={
										!newRoutine.title ||
										!newRoutine.frequency ||
										!newRoutine.category
									}
								>
									<Save className="mr-2 h-4 w-4" />
									保存
								</Button>
							</CardFooter>
						</Card>
					)}
				</>
			)}
		</div>
	)
}
