import AudioPlayer from "@/components/AudioPlayer"
import InformationsClient from "@/components/Informations/InformationsClient"
import { MainLayout } from "@/components/MainLayout"

export default function Informations() {
	return (
		<MainLayout>
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<header className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">ニュース</h1>
						<p className="text-muted-foreground mb-6 mt-6">
							マスター専用の情報を収集しました！さあ、行動に移しましょう！
						</p>
					</header>
					<AudioPlayer />
					<div className="mt-8">
						<InformationsClient />
					</div>
				</div>
			</div>
		</MainLayout>
	)
}
