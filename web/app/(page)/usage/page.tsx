import { MainLayout } from "@/components/MainLayout"
import SimplePlayer from "@/components/SimplePlayer"
import { CheckSquare, Home, Newspaper, Target } from "lucide-react"

export default function UsagePage() {
	return (
		<MainLayout>
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<header className="mb-12">
						<h1 className="text-4xl font-bold tracking-tight">
							Proximaの使い方
						</h1>
						<p className="text-lg text-muted-foreground mb-8 mt-8">
							Proximaを最大限に活用するためのガイドです。
						</p>
					</header>

					<section className="mb-16">
						<h2 className="flex items-center text-3xl font-bold mb-4">
							<Home className="h-7 w-7 text-primary mr-3" />
							ホーム
						</h2>
						<p className="text-lg mb-4 leading-relaxed">
							Proximaとのチャットによりあらゆる情報を更新できます。チャットは以下の3人のキャラクターによって行われます。
						</p>
						<ul className="space-y-4 text-lg mb-6">
							<li>
								<strong>美咲（みさき）</strong>
								：Proximaのメインエージェント。15歳の素直でさわやかな女の子。雑談や相談を担当し、マスター（ユーザー）を明るくサポートします。
							</li>
							<li>
								<strong>楓（かえで）</strong>
								：クエストエージェント。日々のクエストやタスク管理を担当。元気で行動的、マスターの成長を応援します。
							</li>
							<li>
								<strong>麗華（れいか）</strong>
								：キャリアエージェント。キャリア相談や長期的な目標設定をサポート。落ち着いた雰囲気で的確なアドバイスをくれます。
							</li>
						</ul>
						<p className="text-muted-foreground text-sm leading-relaxed">
							チャット画面にアクセスすると、Proximaとの会話が始まります。
							<br />
							会話はいつもProximaから話しかけてくれます。
							<br />
							Proximaとたくさん話すことであなたのことを学習するため、
							ニュースの収集、デイリークエストの生成、キャリアの相談、プロファイル結果などが高精度で行われるようになります。
						</p>
						<img
							src="/screenshots/chat0.png"
							alt="エージェントとのチャット画面"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<p className="text-lg mb-4">以下のようなこともできます。</p>
						<ul className="list-disc list-inside text-muted-foreground text-base space-y-2 mb-4">
							<li>チャットを使って目標やタスクを追加・編集</li>
							<li>疑問や相談はそのまま質問</li>
							<li>学習ログや成果物の共有も可能</li>
						</ul>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Proximaと積極的に会話を重ねることで、あなたのプロフィールや進捗が自動的にアップデートされます。
						</p>
					</section>

					<section className="mb-16">
						<h2 className="flex items-center text-3xl font-bold mb-4">
							<Target className="h-7 w-7 text-primary mr-3" />
							プロファイル
						</h2>
						<p className="text-lg mb-4 leading-relaxed">
							あなたのキャリアを振り返り、Proximaがプロファイリングを行います。
							<br />
							定期的に振り返り、キャリアを体系的にデザインしましょう。
						</p>
						<ul className="list-disc list-inside text-base space-y-3 mb-4">
							<li>
								<strong>キャリア</strong>:
								3〜5年程の長期的な理想像を表します。最初はチュートリアルにて記述していただいたものを表します。
							</li>
							<li>
								<strong>プラン</strong>:
								数ヶ月〜1年単位の中期的な計画を表します。最初はキャリアをもとにProximaが自動で作成します。
							</li>
							<li>
								<strong>Proximaからのアドバイス</strong>:
								あなたのキャリアやプランに合わせたアドバイスをProximaが自動で作成します。
							</li>
						</ul>
						<img
							src="/screenshots/profile0.png"
							alt="プロファイル画面のキャリア例"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<img
							src="/screenshots/profile1.png"
							alt="プロファイル画面のプラン例"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<img
							src="/screenshots/profile2.png"
							alt="プロファイル画面のアドバイス例"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<p className="text-muted-foreground text-sm leading-relaxed">
							<strong className="block mb-2">Tips:</strong>
							長期的なキャリアゴールを設定し、そこから逆算して中期的なプランを設定することが重要です。
							<br />
							キャリアやプランは自由に変更可能で、Proximaのチャットを通して変更することもできます。
						</p>
					</section>

					<section className="mb-16">
						<h2 className="flex items-center text-3xl font-bold mb-4">
							<CheckSquare className="h-7 w-7 text-primary mr-3" />
							クエスト
						</h2>
						<p className="text-lg mb-4 leading-relaxed">
							毎日達成すべき課題で、デイリークエストとルーティーンの2種類あります。
							<br />
							Proximaから出題されるデイリークエストをこなしつつ、習慣化できそうなことがあればルーティーンにしてしまいましょう。
							<br />
							「習慣化」のボタンをクリックすることで、デイリークエストをルーティーンに移動することができます。
							<br />
							スマートスピーカーの設定が済んでいる方は、Proximaが毎朝アナウンスしてくれます。
							<br />※
							<a
								href="https://nijivoice.com/"
								className="text-blue-600 hover:text-blue-800"
							>
								にじボイスAPI
							</a>
							を利用しています。
						</p>
						<ul className="list-disc list-inside text-base space-y-3 mb-4">
							<li>デイリークエスト: 5分〜1時間ほどで終わる軽めのタスク</li>
							<li>ルーティーン: 習慣化したい行動を登録</li>
							<li>振り返り: デイリークエストの達成履歴を確認</li>
						</ul>
						<img
							src="/screenshots/quest0.png"
							alt="クエスト画面のデイリークエスト例"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<img
							src="/screenshots/quest1.png"
							alt="クエスト画面の振り返り例"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<p className="text-muted-foreground text-sm leading-relaxed">
							デイリークエストを達成したらクリックしておきます
						</p>
						<img
							src="/screenshots/quest_complete.gif"
							alt="クエスト画面のクエスト達成の変化例(gif)"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<p className="text-muted-foreground text-sm leading-relaxed">
							習慣化したいクエストは「習慣化」ボタンをクリックして、ルーティーンに移動します
						</p>
						<img
							src="/screenshots/quest_habit.gif"
							alt="クエスト画面の習慣化の変化例(gif)"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<p className="text-muted-foreground text-sm leading-relaxed">
							<strong className="block mb-2">Tips:</strong>
							振り返りのカレンダーでは、デイリークエストの達成率に応じて色が変わります。全ての日が緑色になるように取り組みましょう。
						</p>
					</section>

					<section className="mb-16">
						<h2 className="flex items-center text-3xl font-bold mb-4">
							<Newspaper className="h-7 w-7 text-primary mr-3" />
							ニュース
						</h2>
						<p className="text-lg mb-4 leading-relaxed">
							あなたの趣味や専門分野に最適化された技術ニュースや記事を自動で収集します。
							<br />
							Proximaは会話や日々のタスクを通してあなたに最適化されていくため、使えば使うほどあなたにあった情報を取得してくれるようになります。
							<br />
							また、Proxima
							Newsでは、Proximaがその日に取得したおすすめのニュースとタスクを教えてくれます。
							<br />
							スマートスピーカーの設定が済んでいる方は、Proximaが毎朝アナウンスしてくれます。
							<br />※
							<a
								href="https://nijivoice.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800"
							>
								にじボイスAPI
							</a>
							を利用しています。
						</p>
						<ul className="list-disc list-inside text-base space-y-3 mb-4">
							<li>
								<strong>Proxima News</strong>:
								ニュースやリマインドを音声でお届け
							</li>
							<li>
								<strong>ニュース</strong>:
								あなたの趣味や専門分野に最適化されたニュース
							</li>
						</ul>
						<img
							src="/screenshots/news0.png"
							alt="ニュース画面の例"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<img
							src="/screenshots/news_habit.gif"
							alt="ニュース画面の習慣化の変化例(gif)"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Proxima
							Newsはニュース原稿は生成されていますので、ボタンを押すことでにじボイスAPIを利用して音声ファイルを生成します。
							<br />
						</p>
						<img
							src="/screenshots/news_voice.gif"
							alt="ニュース画面の音声生成の変化例(gif)"
							className="rounded-lg border w-full max-w-6xl mx-auto my-10 shadow-lg"
						/>
						<div className="my-8">
							<p className="text-lg mb-4">Proxima Newsのサンプル音声:</p>
							<SimplePlayer src="/screenshots/voice.mp3" />
						</div>

						<p className="text-muted-foreground text-sm leading-relaxed">
							Proximaはニュースごとにおすすめ度合いと一言コメントを生成します。
							<br />
							「詳細」ボタンを押すことでページを開きます。
							<br />
							「タスク追加」ボタンを押すことでニュースをデイリークエストに追加できます。
							<br />
							「お気に入り」ボタンを押すことで後ほどフィルタリングして確認できます。
							<br />
							※ニュース情報の取得には
							<a
								href="https://connpass.com/about/api/v2/"
								className="text-blue-600 hover:text-blue-800"
							>
								Connpass API
							</a>
							を利用しています。
						</p>
					</section>
				</div>
			</div>
		</MainLayout>
	)
}
