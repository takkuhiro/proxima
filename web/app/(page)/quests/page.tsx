import { DailyQuestsContent } from "@/components/DailyQuests/DailyQuestsContent"
import { MainLayout } from "@/components/MainLayout"
import { Review } from "@/components/Review"
import { RoutinesContent } from "@/components/RoutinesContent"

export default function DailyQuestsPage() {
	return (
		<MainLayout>
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<header className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">クエスト</h1>
						<p className="text-muted-foreground mb-6 mt-6">
							マスター、サボってないですよね！？
							完了したタスクはちゃんとクリックですよ！
						</p>
					</header>
					<div className="flex flex-col md:flex-row gap-8 mt-8">
						<div className="flex-1 p-4 md:p-6 bg-background rounded-lg shadow">
							<p className="text-muted-foreground mb-6 font-bold text-lg">
								デイリークエスト
							</p>
							<p className="text-muted-foreground mb-6">
								新たな気づきはありましたか？
							</p>
							<DailyQuestsContent />
						</div>
						<div className="flex-1 p-4 md:p-6 bg-background rounded-lg shadow">
							<p className="text-muted-foreground mb-6 font-bold text-lg">
								ルーティーン
							</p>
							<p className="text-muted-foreground mb-6">
								毎日の習慣が成長の近道です！
							</p>
							<RoutinesContent />
						</div>
					</div>
					<div className="mt-8 p-4 md:p-6 bg-background rounded-lg shadow">
						<h2 className="text-2xl font-bold mb-4">振り返り</h2>
						<p className="text-muted-foreground mb-6">
							マスターのこれまでのタスクの進捗です
						</p>
						<Review />
					</div>
				</div>
			</div>
		</MainLayout>
	)
}
