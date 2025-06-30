"use client"

import type { CareerGoal } from "@/app/types"
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
	createCareerGoal,
	deleteCareerGoal,
	fetchCareerGoals,
} from "@/hooks/careerGoals"
import { careerGoalsAtom, hasCareerGoalsFetchedAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { PlusCircle, Save, Target, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners"

export function CareerGoalsContent() {
	const [careerGoals, setCareerGoals] = useAtom(careerGoalsAtom)
	const [hasCareerGoalsFetched, setHasCareerGoalsFetched] = useAtom(
		hasCareerGoalsFetchedAtom,
	)
	const [newGoal, setNewGoal] = useState<
		Omit<CareerGoal, "id" | "userId" | "createdAt" | "deleted">
	>({
		careerTitle: "",
		careerBody: "",
		targetPeriod: "",
	})
	const [isAdding, setIsAdding] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const userId = useUserId()

	useEffect(() => {
		if (userId && !hasCareerGoalsFetched) {
			setIsLoading(true)
			fetchCareerGoals(userId)
				.then((data) => {
					setCareerGoals(data)
				})
				.finally(() => {
					setIsLoading(false)
					setHasCareerGoalsFetched(true)
				})
		}
	}, [userId, hasCareerGoalsFetched, setCareerGoals, setHasCareerGoalsFetched])

	const handleAddGoal = async () => {
		if (
			newGoal.careerTitle &&
			newGoal.careerBody &&
			newGoal.targetPeriod &&
			userId
		) {
			const created = await createCareerGoal({
				userId: userId,
				careerTitle: newGoal.careerTitle,
				careerBody: newGoal.careerBody,
				targetPeriod: newGoal.targetPeriod,
			})
			setCareerGoals([...careerGoals, created])
			setNewGoal({ careerTitle: "", careerBody: "", targetPeriod: "" })
			setIsAdding(false)
		}
	}

	const handleDeleteGoal = async (id: string) => {
		if (!userId) return
		await deleteCareerGoal(userId, id)
		setCareerGoals(careerGoals.filter((goal) => goal.id !== id))
	}

	const periods = [
		"1ヶ月後",
		"3ヶ月後",
		"半年後",
		"1年後",
		"2年後",
		"3年後",
		"5年後",
		"長期的",
	]

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
						{careerGoals.map((goal) => (
							<Card key={goal.id}>
								<CardHeader className="pb-2">
									<div className="flex justify-between items-start">
										<CardTitle className="flex items-center">
											<Target className="mr-2 h-5 w-5 text-primary" />
											{goal.careerTitle}
										</CardTitle>
										<Badge variant="outline">{goal.targetPeriod}</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<p>{goal.careerBody}</p>
								</CardContent>
								<CardFooter className="flex justify-end pt-0">
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 text-destructive"
										onClick={() => handleDeleteGoal(goal.id)}
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">削除</span>
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>

					{careerGoals.length === 0 && (
						<Card className="bg-muted/50">
							<CardContent className="flex flex-col items-center justify-center p-6">
								<p className="text-muted-foreground mb-4">
									キャリア目標がありません
								</p>
								<Button variant="outline" onClick={() => setIsAdding(true)}>
									<PlusCircle className="mr-2 h-4 w-4" />
									目標を追加
								</Button>
							</CardContent>
						</Card>
					)}

					{careerGoals.length > 0 && !isAdding && (
						<div className="flex justify-center">
							<Button variant="outline" onClick={() => setIsAdding(true)}>
								<PlusCircle className="mr-2 h-4 w-4" />
								目標を追加
							</Button>
						</div>
					)}

					{isAdding && (
						<Card>
							<CardHeader>
								<CardTitle>新しい目標</CardTitle>
								<CardDescription>
									達成したいキャリア目標を設定しましょう
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label htmlFor="careerTitle" className="text-sm font-medium">
										タイトル
									</label>
									<Input
										id="careerTitle"
										value={newGoal.careerTitle}
										onChange={(e) =>
											setNewGoal({ ...newGoal, careerTitle: e.target.value })
										}
										placeholder="目標のタイトル"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="careerBody" className="text-sm font-medium">
										詳細
									</label>
									<Textarea
										id="careerBody"
										value={newGoal.careerBody}
										onChange={(e) =>
											setNewGoal({ ...newGoal, careerBody: e.target.value })
										}
										placeholder="目標の詳細な説明"
										rows={4}
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="targetPeriod" className="text-sm font-medium">
										期間
									</label>
									<Select
										value={newGoal.targetPeriod}
										onValueChange={(value) =>
											setNewGoal({ ...newGoal, targetPeriod: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="期間を選択" />
										</SelectTrigger>
										<SelectContent>
											{periods.map((period) => (
												<SelectItem key={period} value={period}>
													{period}
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
									onClick={handleAddGoal}
									disabled={
										!newGoal.careerTitle ||
										!newGoal.careerBody ||
										!newGoal.targetPeriod
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
