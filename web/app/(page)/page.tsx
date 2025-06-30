"use client"

import ChatHeader from "@/components/Chat/ChatHeader"
import { ChatInterface } from "@/components/Chat/ChatInterface"
import { MainLayout } from "@/components/MainLayout"
import type { ModelHandle } from "@/components/Vrm/Model"
import Viewer from "@/components/Vrm/Viewer"
import { useRef } from "react"

export default function Home() {
	const modelRef = useRef<ModelHandle>(null)
	return (
		<MainLayout>
			<div className="flex flex-col h-screen">
				<ChatHeader />
				{/* 下は残り全部 */}
				<div className="relative flex-1 flex flex-col min-h-0">
					{/* 背景画像 */}
					<div
						className="absolute inset-0 -z-10 bg-cover bg-center bg-fixed"
						style={{
							backgroundImage: "url(/models/background/real_cozy_caffe.jpeg)",
						}}
					/>
					<div className="flex flex-row h-full">
						{/* チャットUI本体（左半分） */}
						<div className="w-1/2 h-full">
							<ChatInterface modelRef={modelRef} />
						</div>
						{/* Viewer（右半分） */}
						<div className="w-1/2 h-full">
							<Viewer modelRef={modelRef} />
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	)
}
