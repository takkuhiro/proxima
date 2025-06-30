import type { Quest } from "@/app/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { CircleArrowRight, CircleCheckBig, Clock, Trash2 } from "lucide-react"
import type React from "react"

interface QuestCardProps {
	quest: Quest
	onToggleComplete: (id: string) => void
	onDelete: (id: string) => void
	onMoveToRoutine: (quest: Quest) => void
}

export const QuestCard: React.FC<QuestCardProps> = ({
	quest,
	onToggleComplete,
	onDelete,
	onMoveToRoutine,
}) => {
	return (
		<Card
			className={`relative cursor-pointer hover:shadow-md transition-shadow ${quest.completed ? "bg-green-100" : ""}`}
			onClick={() => onToggleComplete(quest.id)}
		>
			{quest.completed && (
				<div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
					<CircleCheckBig className="w-20 h-20 text-green-400 opacity-90" />
				</div>
			)}
			<CardHeader className="pb-2 p-0 relative z-10">
				<div className="flex flex-col md:flex-row md:items-center">
					<div className="flex-grow p-4 md:p-6">
						<h3 className="font-medium text-lg">{quest.title}</h3>
						{quest.description && (
							<p className="text-sm mt-1 mb-2">{quest.description}</p>
						)}
						<div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
							<Clock className="h-3 w-3" />
							<span>{quest.estimatedTime}</span>
						</div>
					</div>
					<div className="p-4 md:pr-6 flex flex-col items-end gap-2">
						<Badge>{quest.category}</Badge>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-16 p-0"
							onClick={(e) => {
								e.stopPropagation()
								onMoveToRoutine(quest)
							}}
						>
							<CircleArrowRight className="h-4 w-4 text-primary" />
							<span className="">習慣化</span>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
							onClick={(e) => {
								e.stopPropagation()
								onDelete(quest.id)
							}}
						>
							<Trash2 className="h-4 w-4 text-destructive" />
							<span className="sr-only">削除</span>
						</Button>
					</div>
				</div>
			</CardHeader>
		</Card>
	)
}
