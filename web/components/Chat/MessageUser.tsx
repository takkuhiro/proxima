import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function MessageUser({ content }: { content: string }) {
	return (
		<div className="flex justify-end">
			<div className="flex items-start gap-3 max-w-[80%] flex-row-reverse">
				<Avatar className="h-8 w-8">
					<AvatarFallback>U</AvatarFallback>
				</Avatar>
				<div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground">
					<div className="text-sm whitespace-pre-wrap">{content}</div>
				</div>
			</div>
		</div>
	)
}
