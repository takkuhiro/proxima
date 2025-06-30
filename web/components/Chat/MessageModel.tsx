import type { FunctionCall, FunctionResponse } from "@/app/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentAtom } from "@/lib/state"
import { useSetAtom } from "jotai"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { ClipLoader, PulseLoader } from "react-spinners"

export function MessageModel({
	content,
	loading,
	functionCall,
	functionResponse,
	thisMessageAgent,
}: {
	content: string
	loading?: boolean
	functionCall?: FunctionCall
	functionResponse?: FunctionResponse
	thisMessageAgent: string
}) {
	const setAgent = useSetAtom(AgentAtom)

	// Handle agent transfer using useEffect
	useEffect(() => {
		if (
			functionCall?.name === "transfer_to_agent" &&
			functionCall.args.agent_name &&
			typeof functionCall.args.agent_name === "string"
		) {
			if (functionCall.args.agent_name === "career_agent") {
				setAgent("Reika")
			} else if (functionCall.args.agent_name === "quest_agent") {
				setAgent("Kaede")
			} else if (functionCall.args.agent_name === "proxima_agent") {
				setAgent("Misaki")
			}
		}
	}, [functionCall, setAgent])

	return (
		<div className="flex justify-start">
			<div className="flex items-start gap-3 w-[80%]">
				<Avatar className="h-8 w-8">
					<AvatarFallback>AI</AvatarFallback>
					<AvatarImage src={`/icons/${thisMessageAgent}.png`} />
				</Avatar>
				{loading && (
					<div className="text-sm whitespace-pre-wrap rounded-lg px-4 py-2 bg-muted">
						<PulseLoader size={8} color="#888" />
					</div>
				)}
				{content && (
					<div className="text-sm rounded-lg px-4 py-2 bg-muted max-w-full whitespace-pre-wrap">
						{content}
					</div>
				)}
				{/* Function Call */}
				{functionCall && !functionResponse && (
					<div className="flex flex-col gap-2 mt-2 w-full">
						<Card className="w-full shadow-md rounded-lg bg-green-50 border-green-200">
							<CardHeader className="p-3 flex items-center gap-2 w-full">
								<CardTitle className="text-sm w-full">
									<ClipLoader size={8} className="w-4 h-4 text-green-600" />
									<span className="font-bold">{functionCall.name}</span>
								</CardTitle>
							</CardHeader>
						</Card>
					</div>
				)}
				{/* Function Response */}
				{functionResponse && (
					<div className="flex flex-col gap-2 mt-2 w-full">
						<FunctionResponseCard functionResponse={functionResponse} />
					</div>
				)}
			</div>
		</div>
	)
}

function FunctionResponseCard({
	functionResponse,
}: { functionResponse: FunctionResponse }) {
	const [open, setOpen] = useState(false)
	return (
		<Card className="shadow-md rounded-lg bg-green-50 border-green-200 w-full">
			<CardHeader
				className="p-3 cursor-pointer hover:bg-green-100"
				onClick={() => setOpen((o) => !o)}
			>
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<Search className="w-4 h-4 text-green-600" />
						<span className="font-bold">{functionResponse.name}</span>
					</div>
					{open ? (
						<ChevronUp className="w-4 h-4" />
					) : (
						<ChevronDown className="w-4 h-4" />
					)}
				</CardTitle>
			</CardHeader>
			{open && (
				<CardContent className="p-3 border-t w-full">
					<div className="text-xs overflow-x-auto max-w-full whitespace-pre-wrap">
						{Object.entries(functionResponse.response).map(([key, value]) => (
							<div key={key}>
								<span className="font-bold">{key}:</span> {value}
							</div>
						))}
					</div>
				</CardContent>
			)}
		</Card>
	)
}
