import { Card, CardContent } from "@/components/ui/card"
import type React from "react"

interface EmptyQuestCardProps {
	onAddQuest: () => void
}

export const EmptyQuestCard: React.FC<EmptyQuestCardProps> = () => (
	<Card className="bg-muted/50">
		<CardContent className="flex flex-col items-center justify-center p-6">
			<p className="text-muted-foreground mb-4">クエストがありません</p>
		</CardContent>
	</Card>
)
