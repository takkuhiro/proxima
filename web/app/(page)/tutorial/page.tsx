"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserId } from "@/hooks/auth"
import { createSession } from "@/lib/actions/auth"
import { sendSession, updateUserProfile } from "@/lib/firebase/firestore"
import {
	BookOpen,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Code,
	InfoIcon,
	Target,
	User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import type { ProfileData } from "@/app/types"
import { HOME_ROUTE } from "@/lib/constants"
import { sessionIdAtom } from "@/lib/state"
import { useSetAtom } from "jotai"
import { ulid } from "ulid"

const initialData: ProfileData = {
	nickname: "",
	gender: "",
	age: "",
	location: "",
	iotDeviceUrl: "",
	careerGoals: [],
	initiatives: [],
	skills: [],
	currentRole: "",
	experience: "",
	projects: "",
	learningMethods: [],
	dailyStudyTime: "",
}

const steps = [
	{ id: 1, title: "基本プロフィール", icon: User },
	{ id: 2, title: "キャリア", icon: Target },
	{ id: 3, title: "プラン", icon: BookOpen },
	{ id: 4, title: "スキル・経験", icon: Code },
	{ id: 5, title: "学習スタイル", icon: BookOpen },
	{ id: 6, title: "完了", icon: CheckCircle },
]

const skillOptions = [
	"JavaScript",
	"TypeScript",
	"Python",
	"Java",
	"C++",
	"Go",
	"Rust",
	"React",
	"Vue.js",
	"Angular",
	"Next.js",
	"Node.js",
	"AWS",
	"Azure",
	"Google Cloud",
	"Docker",
	"Kubernetes",
	"MySQL",
	"PostgreSQL",
	"MongoDB",
	"Redis",
	"Git",
	"CI/CD",
	"テスト自動化",
	"アジャイル開発",
]

const learningMethodOptions = [
	"動画学習",
	"書籍・技術書",
	"実践・ハンズオン",
	"ペアプログラミング",
	"オンライン講座",
	"ブログ・記事",
	"コミュニティ参加",
	"メンター指導",
]

export default function EngineerTutorial() {
	const [currentStep, setCurrentStep] = useState(1)
	const [profileData, setProfileData] = useState<ProfileData>(initialData)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const userId = useUserId()
	const router = useRouter()
	const setSessionId = useSetAtom(sessionIdAtom)
	const progress = ((currentStep - 1) / (steps.length - 1)) * 100

	const handleNext = () => {
		if (currentStep < steps.length) {
			setCurrentStep(currentStep + 1)
		}
	}

	const handlePrev = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleSkillToggle = (skill: string) => {
		setProfileData((prev) => ({
			...prev,
			skills: prev.skills.includes(skill)
				? prev.skills.filter((s) => s !== skill)
				: [...prev.skills, skill],
		}))
	}

	const handleLearningMethodToggle = (method: string) => {
		setProfileData((prev) => ({
			...prev,
			learningMethods: prev.learningMethods.includes(method)
				? prev.learningMethods.filter((m) => m !== method)
				: [...prev.learningMethods, method],
		}))
	}

	const handleRegisterClick = async () => {
		if (!userId) return
		setLoading(true)
		setError(null)
		try {
			const response = await fetch("/api/tutorial", {
				method: "POST",
				body: JSON.stringify({
					userId: userId,
					profile: profileData,
				}),
			})
			if (!response.ok) {
				throw new Error("Failed to create profile")
			}
			await updateUserProfile(userId, profileData)
			const sessionId = await createSession(userId)
			setSessionId(sessionId)
			sendSession(userId, sessionId)
			router.replace(HOME_ROUTE)
		} catch (e) {
			setError(
				"プロフィール登録に失敗しました。時間をおいて再度お試しください。",
			)
		} finally {
			setLoading(false)
		}
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="nickname">ニックネーム *</Label>
							<Input
								id="nickname"
								value={profileData.nickname}
								onChange={(e) =>
									setProfileData((prev) => ({
										...prev,
										nickname: e.target.value,
									}))
								}
								placeholder="例: たろう"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>性別（任意）</Label>
								<Select
									value={profileData.gender}
									onValueChange={(value) =>
										setProfileData((prev) => ({ ...prev, gender: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選択してください" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="male">男性</SelectItem>
										<SelectItem value="female">女性</SelectItem>
										<SelectItem value="other">その他</SelectItem>
										<SelectItem value="prefer-not-to-say">
											回答しない
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>年齢（任意）</Label>
								<Select
									value={profileData.age}
									onValueChange={(value) =>
										setProfileData((prev) => ({ ...prev, age: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選択してください" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="under-20">20歳未満</SelectItem>
										<SelectItem value="20-25">20-25歳</SelectItem>
										<SelectItem value="26-30">26-30歳</SelectItem>
										<SelectItem value="31-35">31-35歳</SelectItem>
										<SelectItem value="36-40">36-40歳</SelectItem>
										<SelectItem value="over-40">40歳以上</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label>居住地（タイムゾーン）</Label>
							<Select
								value={profileData.location}
								onValueChange={(value) =>
									setProfileData((prev) => ({ ...prev, location: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="選択してください" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="japan">日本</SelectItem>
									<SelectItem value="usa">アメリカ</SelectItem>
									<SelectItem value="europe">ヨーロッパ</SelectItem>
									<SelectItem value="asia">アジア（日本以外）</SelectItem>
									<SelectItem value="other">その他</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* IoTデバイスURL入力欄（オプション） */}
						<div className="space-y-2">
							<Label
								htmlFor="iot-device-url"
								className="flex items-center gap-1"
							>
								IoTデバイスのURL（任意）
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<InfoIcon className="w-4 h-4 text-blue-500 cursor-pointer" />
										</TooltipTrigger>
										<TooltipContent>
											この設定を行うことでGoogle
											Homeなどのスマートスピーカーを用いたProxima専用サポートを受けることができます。詳しくはProximaリポジトリをご確認ください。
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</Label>
							<Input
								id="iot-device-url"
								type="url"
								value={profileData.iotDeviceUrl || ""}
								onChange={(e) =>
									setProfileData((prev) => ({
										...prev,
										iotDeviceUrl: e.target.value,
									}))
								}
								placeholder="例: https://xxx-xxx-xxx.ngrok-free.app"
							/>
						</div>
					</div>
				)

			case 2:
				return (
					<div className="space-y-6">
						<p className="text-gray-700 text-sm">
							数年単位で長期的に考えているキャリアプランがあれば教えてください。
							<br />
							必ず<strong>1つ以上</strong>設定してください。
						</p>
						{profileData.careerGoals.map((goal, idx) => (
							<div
								key={`career-goal-input-${goal.id}`}
								className="border rounded-lg p-4 mb-4 bg-white shadow-sm relative"
							>
								<div className="mb-4 flex justify-between items-center">
									<Label>キャリア目標 {idx + 1}</Label>
									{profileData.careerGoals.length > 1 && (
										<Button
											size="sm"
											variant="ghost"
											className="text-red-500"
											onClick={() => {
												setProfileData((prev) => ({
													...prev,
													careerGoals: prev.careerGoals.filter(
														(_, i) => i !== idx,
													),
												}))
											}}
										>
											削除
										</Button>
									)}
								</div>
								<div className="space-y-4">
									<Label htmlFor={`career-title-${goal.id}`}>タイトル</Label>
									<Input
										id={`career-title-${idx}`}
										value={goal.careerTitle}
										onChange={(e) => {
											const newGoals = [...profileData.careerGoals]
											newGoals[idx].careerTitle = e.target.value
											setProfileData((prev) => ({
												...prev,
												careerGoals: newGoals,
											}))
										}}
										placeholder="例: BigTechでのテックリード"
									/>
									<Label htmlFor={`career-body-${idx}`}>
										具体的なキャリア目標
									</Label>
									<Textarea
										id={`career-body-${idx}`}
										value={goal.careerBody}
										onChange={(e) => {
											const newGoals = [...profileData.careerGoals]
											newGoals[idx].careerBody = e.target.value
											setProfileData((prev) => ({
												...prev,
												careerGoals: newGoals,
											}))
										}}
										placeholder="例: AI関連のプロダクトの開発マネージャーを担当したい"
										rows={3}
									/>
									<Label>目標時期</Label>
									<Select
										value={goal.targetPeriod}
										onValueChange={(value) => {
											const newGoals = [...profileData.careerGoals]
											newGoals[idx].targetPeriod = value
											setProfileData((prev) => ({
												...prev,
												careerGoals: newGoals,
											}))
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="選択してください" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="one-month">1ヶ月後</SelectItem>
											<SelectItem value="three-month">3ヶ月後</SelectItem>
											<SelectItem value="half-year">半年後</SelectItem>
											<SelectItem value="1year">1年後</SelectItem>
											<SelectItem value="2years">2年後</SelectItem>
											<SelectItem value="3years">3年後</SelectItem>
											<SelectItem value="5years">5年後</SelectItem>
											<SelectItem value="long-term">長期的</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						))}
						<Button
							variant="outline"
							onClick={() => {
								setProfileData((prev) => ({
									...prev,
									careerGoals: [
										...prev.careerGoals,
										{
											id: ulid(),
											userId: userId || "",
											createdAt: new Date().toISOString(),
											deleted: false,
											careerTitle: "",
											careerBody: "",
											targetPeriod: "",
										},
									],
								}))
							}}
						>
							＋目標を追加
						</Button>
					</div>
				)

			case 3:
				return (
					<div className="space-y-6">
						<p className="text-gray-700 text-sm">
							数週間から数ヶ月ほどの中期的に取り組んでいる目標があれば記入してください。
							<br />
							もしなければそのまま次に進んでください。
							<br />
							Proximaとこれから一緒に考えていきましょう！
						</p>
						{profileData.initiatives.length > 0 && (
							<div className="space-y-4">
								{profileData.initiatives.map((initiative, idx) => (
									<div
										key={`initiative-input-${initiative.id}`}
										className="border rounded-lg p-4 mb-4 bg-white shadow-sm relative"
									>
										<div className="mb-4 flex justify-between items-center">
											<Label>プラン {idx + 1}</Label>
											{profileData.initiatives.length > 1 && (
												<Button
													size="sm"
													variant="ghost"
													className="text-red-500"
													onClick={() => {
														setProfileData((prev) => ({
															...prev,
															initiatives: prev.initiatives.filter(
																(_, i) => i !== idx,
															),
														}))
													}}
												>
													削除
												</Button>
											)}
										</div>
										<div className="space-y-4">
											<Label htmlFor={`initiative-title-${initiative.id}`}>
												タイトル
											</Label>
											<Input
												id={`initiative-title-${idx}`}
												value={initiative.title}
												onChange={(e) => {
													const newInitiatives = [...profileData.initiatives]
													newInitiatives[idx].title = e.target.value
													setProfileData((prev) => ({
														...prev,
														initiatives: newInitiatives,
													}))
												}}
												placeholder="例: ハッカソンへの出場"
											/>
											<Label htmlFor={`initiative-description-${idx}`}>
												詳細
											</Label>
											<Textarea
												id={`initiative-description-${idx}`}
												value={initiative.body}
												onChange={(e) => {
													const newInitiatives = [...profileData.initiatives]
													newInitiatives[idx].body = e.target.value
													setProfileData((prev) => ({
														...prev,
														initiatives: newInitiatives,
													}))
												}}
												placeholder="例: 3ヶ月でGraphQLを使ったアプリを作る"
												rows={3}
											/>
											<Label>期限</Label>
											<Input
												type="date"
												value={initiative.targetPeriod}
												onChange={(e) => {
													const newInitiatives = [...profileData.initiatives]
													newInitiatives[idx].targetPeriod = e.target.value
													setProfileData((prev) => ({
														...prev,
														initiatives: newInitiatives,
													}))
												}}
											/>
										</div>
									</div>
								))}
							</div>
						)}
						<Button
							variant="outline"
							onClick={() => {
								setProfileData((prev) => ({
									...prev,
									initiatives: [
										...prev.initiatives,
										{
											id: ulid(),
											userId: userId || "",
											title: "",
											body: "",
											targetPeriod: "",
											createdAt: new Date().toISOString(),
											deleted: false,
											category: "",
										},
									],
								}))
							}}
						>
							＋プランを追加
						</Button>
					</div>
				)

			case 4:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label>得意な技術・言語（複数選択可）</Label>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
								{skillOptions.map((skill) => (
									<div key={skill} className="flex items-center space-x-2">
										<Checkbox
											id={skill}
											checked={profileData.skills.includes(skill)}
											onCheckedChange={() => handleSkillToggle(skill)}
										/>
										<Label htmlFor={skill} className="text-sm">
											{skill}
										</Label>
									</div>
								))}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>現在の職種</Label>
								<Select
									value={profileData.currentRole}
									onValueChange={(value) =>
										setProfileData((prev) => ({ ...prev, currentRole: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選択してください" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="student">学生</SelectItem>
										<SelectItem value="junior">ジュニアエンジニア</SelectItem>
										<SelectItem value="mid">ミドルエンジニア</SelectItem>
										<SelectItem value="senior">シニアエンジニア</SelectItem>
										<SelectItem value="lead">リードエンジニア</SelectItem>
										<SelectItem value="manager">
											エンジニアリングマネージャー
										</SelectItem>
										<SelectItem value="other-tech">その他IT職</SelectItem>
										<SelectItem value="non-tech">非IT職</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>経験年数</Label>
								<Select
									value={profileData.experience}
									onValueChange={(value) =>
										setProfileData((prev) => ({ ...prev, experience: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選択してください" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">未経験</SelectItem>
										<SelectItem value="under-1">1年未満</SelectItem>
										<SelectItem value="1-2">1-2年</SelectItem>
										<SelectItem value="3-5">3-5年</SelectItem>
										<SelectItem value="6-10">6-10年</SelectItem>
										<SelectItem value="over-10">10年以上</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="projects">これまでの主なプロジェクトや実績</Label>
							<Textarea
								id="projects"
								value={profileData.projects}
								onChange={(e) =>
									setProfileData((prev) => ({
										...prev,
										projects: e.target.value,
									}))
								}
								placeholder="例: ECサイトの開発、機械学習モデルの構築、OSS貢献など"
								rows={4}
							/>
						</div>
					</div>
				)

			case 5:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label>学習スタイル</Label>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
								{learningMethodOptions.map((method) => (
									<div key={method} className="flex items-center space-x-2">
										<Checkbox
											id={method}
											checked={profileData.learningMethods.includes(method)}
											onCheckedChange={() => handleLearningMethodToggle(method)}
										/>
										<Label htmlFor={method} className="text-sm">
											{method}
										</Label>
									</div>
								))}
							</div>
						</div>

						{/* 1日に学習に割ける時間の選択欄を追加 */}
						<div className="space-y-2">
							<Label>1日に学習に割ける時間</Label>
							<Select
								value={profileData.dailyStudyTime}
								onValueChange={(value) =>
									setProfileData((prev) => ({ ...prev, dailyStudyTime: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="選択してください" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="under-30min">30分未満</SelectItem>
									<SelectItem value="30min-1h">30分〜1時間</SelectItem>
									<SelectItem value="1-2h">1〜2時間</SelectItem>
									<SelectItem value="2-3h">2〜3時間</SelectItem>
									<SelectItem value="over-3h">3時間以上</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)

			case 6:
				return (
					<div className="space-y-6 text-center">
						<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
							<CheckCircle className="w-8 h-8 text-green-600" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-green-600 mb-2">
								プロフィール設定完了！
							</h3>
							<p className="text-gray-600">
								{profileData.nickname}さん、お疲れ様でした！
								<br />
								あなたの学習プランをカスタマイズしています。
							</p>
						</div>

						<div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
							<h4 className="font-semibold">設定内容の確認</h4>
							<div className="text-sm space-y-1">
								{profileData.careerGoals.map((goal, idx) => (
									<div key={`career-goals-${goal.id}`} className="mb-4">
										<p>
											<span className="font-medium">目標{idx + 1}:</span>{" "}
											{goal.careerTitle}
										</p>
										<p>
											<span className="font-medium">期間:</span>{" "}
											{goal.targetPeriod}
										</p>
										<p>
											<span className="font-medium">具体的な内容:</span>{" "}
											{goal.careerBody}
										</p>
									</div>
								))}
								{profileData.initiatives.map((initiative, idx) => (
									<div key={`initiatives-${initiative.id}`} className="mb-4">
										<p>
											<span className="font-medium">プラン{idx + 1}:</span>{" "}
											{initiative.title}
										</p>
										<p>
											<span className="font-medium">期限:</span>{" "}
											{initiative.targetPeriod}
										</p>
										<p>
											<span className="font-medium">詳細:</span>{" "}
											{initiative.body}
										</p>
									</div>
								))}
								<p>
									<span className="font-medium">スキル:</span>{" "}
									{profileData.skills.slice(0, 3).join(", ")}
									{profileData.skills.length > 3 ? "..." : ""}
								</p>
								<p>
									<span className="font-medium">学習時間:</span>{" "}
									{profileData.dailyStudyTime}
								</p>
							</div>
						</div>

						<Button
							size="lg"
							className="w-full"
							disabled={loading}
							onClick={handleRegisterClick}
						>
							{loading ? "登録中..." : "始める"}
						</Button>
						{error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
						<p className="text-gray-500 text-sm mt-2">
							与えられた情報に基づき、あなたに沿ったプランとプロファイリングを実行しています
							<br />
							この登録処理の完了には最大3分ほどかかる場合があります
						</p>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Proximaへようこそ
					</h1>
					<p className="text-gray-600">
						あなたに最適な学習プランを作成するために、いくつかの質問にお答えください
					</p>
				</div>

				{/* Progress Bar */}
				<div className="mb-8">
					<div className="flex justify-between items-center mb-2">
						{steps.map((step) => {
							const Icon = step.icon
							return (
								<div
									key={step.id}
									className={`flex flex-col items-center ${step.id <= currentStep ? "text-blue-600" : "text-gray-400"}`}
								>
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
											step.id <= currentStep
												? "bg-blue-600 text-white"
												: "bg-gray-200 text-gray-400"
										}`}
									>
										<Icon className="w-5 h-5" />
									</div>
									<span className="text-xs font-medium hidden sm:block">
										{step.title}
									</span>
								</div>
							)
						})}
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				{/* Main Content */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{React.createElement(steps[currentStep - 1].icon, {
								className: "w-5 h-5",
							})}
							{steps[currentStep - 1].title}
						</CardTitle>
						{currentStep < steps.length && (
							<CardDescription>
								ステップ {currentStep} / {steps.length - 1}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent>{renderStepContent()}</CardContent>
				</Card>

				{/* Navigation */}
				{(currentStep < steps.length || currentStep === steps.length) && (
					<div className="flex justify-between">
						<Button
							variant="outline"
							onClick={handlePrev}
							disabled={currentStep === 1}
							className="flex items-center gap-2"
						>
							<ChevronLeft className="w-4 h-4" />
							前へ
						</Button>
						{currentStep < steps.length && (
							<Button
								onClick={handleNext}
								disabled={currentStep === 1 && !profileData.nickname}
								className="flex items-center gap-2"
							>
								{currentStep === steps.length - 1 ? "完了" : "次へ"}
								<ChevronRight className="w-4 h-4" />
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
