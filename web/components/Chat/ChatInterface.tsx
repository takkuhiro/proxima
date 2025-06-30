"use client"
import { MessageModel } from "@/components/Chat/MessageModel"
import { MessageUser } from "@/components/Chat/MessageUser"
import type { ModelHandle } from "@/components/Vrm/Model"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUserId } from "@/hooks/auth"
import { createSession } from "@/lib/actions/auth"
import {
	getUserSnapshot,
	sendChatMessage,
	sendSession,
} from "@/lib/firebase/firestore"
import { getChatHistorySnapshot } from "@/lib/firebase/firestore"
import { AgentAtom, sessionIdAtom, userAtom } from "@/lib/state"
import { chatMessagesAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { Bot, Send } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { PulseLoader } from "react-spinners"

export function ChatInterface({
	modelRef,
}: { modelRef?: React.RefObject<ModelHandle | null> }) {
	const [user, setUser] = useAtom(userAtom)
	const [sessionId, setSessionId] = useAtom(sessionIdAtom)
	const [chatMessages, setChatMessages] = useAtom(chatMessagesAtom)
	const [input, setInput] = useState("")
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const userId = useUserId()
	const [agent, setAgent] = useAtom(AgentAtom)

	// ユーザー情報をFirestoreから取得する
	useEffect(() => {
		if (!userId) return
		const unsubsribeUser = getUserSnapshot(userId, (data) => {
			setUser(data)
		})
		return () => unsubsribeUser()
	}, [userId, setUser])

	// チャット履歴をFirestoreから取得する
	useEffect(() => {
		if (!userId) return

		let unsubscribe: (() => void) | undefined

		const ensureSessionAndHistory = async () => {
			let sid = sessionId
			// sessionIdがなければfetchしてセット
			if (!sid) {
				const sessionId = await createSession(userId)
				sendSession(userId, sessionId)
				setSessionId(sessionId)
				sid = sessionId
			}
			// sessionIdがあれば履歴取得
			if (sid) {
				unsubscribe = getChatHistorySnapshot(userId, sid, (data) => {
					setChatMessages(data)
				})
			}
		}

		ensureSessionAndHistory()

		return () => {
			if (unsubscribe) unsubscribe()
		}
	}, [userId, sessionId, setSessionId, setChatMessages])

	// AI応答がloading中かどうか判定
	const isModelLoading = chatMessages.some(
		(m) => m.role === "model" && m.loading,
	)

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			if (!sessionId) {
				throw new Error("sessionId is not set")
			}
			await sendChatMessage(userId as string, sessionId, input, agent)
			setInput("")
			// モデルのアニメーションも実行
			if (modelRef?.current) {
				modelRef.current.playAnimation()
			}
		},
		[sessionId, userId, input, modelRef, agent],
	)

	// biome-ignore lint/correctness/useExhaustiveDependencies: chatMessagesが更新された時に自動スクロール
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [chatMessages])

	return (
		<div className="flex flex-col h-full backdrop-blur-sm rounded-none">
			{user?.status !== "created" ? (
				<div className="flex flex-col items-center justify-center flex-1 bg-white/80">
					<p className="pt-20 text-2xl">
						ユーザー情報を取得中です。しばらくお待ち下さい。
					</p>
					<div className="flex justify-center mt-8">
						<PulseLoader color="#000" />
					</div>
				</div>
			) : (
				<>
					<div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white/80">
						{chatMessages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center">
								<Bot className="h-12 w-12 mb-4 text-muted-foreground" />
								<h3 className="text-lg font-medium">
									Proximaと会話を始めましょう
								</h3>
								<p className="text-sm text-muted-foreground mt-2 max-w-md">
									エンジニアの皆さんのお手伝いをします！
									<br />
									気軽にいろんなことを話しかけてください！
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{chatMessages.map((message) =>
									message.role === "user" ? (
										<MessageUser
											key={message.id}
											content={message.content ?? ""}
										/>
									) : (
										<MessageModel
											key={message.id}
											content={message.content ?? ""}
											loading={message.loading}
											functionCall={message.functionCall}
											functionResponse={message.functionResponse}
											thisMessageAgent={message.agent}
										/>
									),
								)}
								<div ref={messagesEndRef} />
							</div>
						)}
					</div>
					<div className="border-t p-4 flex-shrink-0 backdrop-blur-sm bg-white">
						<form
							onSubmit={handleSubmit}
							className="flex items-center space-x-2"
						>
							<Input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="メッセージを入力..."
								className="flex-1"
								disabled={isModelLoading}
							/>
							<Button
								type="submit"
								size="icon"
								disabled={!input.trim() || isModelLoading}
							>
								<Send className="h-4 w-4" />
								<span className="sr-only">送信</span>
							</Button>
						</form>
					</div>
				</>
			)}
		</div>
	)
}
