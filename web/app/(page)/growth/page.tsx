import { AdviceContent } from "@/components/AdviceContent"
import { CareerGoalsContent } from "@/components/CareerGoalsContent"
import { InitiativesContent } from "@/components/InitiativesContent"
import { MainLayout } from "@/components/MainLayout"

export default function CareerGoalsPage() {
	return (
		<MainLayout>
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<header className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">プロファイル</h1>
						<p className="text-muted-foreground mb-6 mt-6">
							マスターをプロファイリングしました
						</p>
					</header>
					<div className="p-4 md:p-6">
						<h1 className="text-2xl font-bold mb-4">長期:キャリア</h1>
						<p className="text-muted-foreground mb-6">
							マスター、キャリアもしっかりと考えられていますか？？
						</p>
						<CareerGoalsContent />
					</div>

					<div className="p-4 md:p-6">
						<h1 className="text-2xl font-bold mb-4">中期:プラン</h1>
						<p className="text-muted-foreground mb-6">
							中期的な目標を設定し、具体的な計画を立てましょう。
						</p>
						<InitiativesContent />
					</div>

					<div className="p-4 md:p-6">
						<h1 className="text-2xl font-bold mb-4">Proximaからのアドバイス</h1>
						<p className="text-muted-foreground mb-6">
							毎週金曜日の19時に実行されます
						</p>
						<AdviceContent />
					</div>
				</div>
			</div>
		</MainLayout>
	)
}
