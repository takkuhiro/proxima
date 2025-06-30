"use client"

import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"
import { useState } from "react"

type SimplePlayerProps = {
	src: string
}

export default function SimplePlayer({ src }: SimplePlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false)
	const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

	const togglePlay = () => {
		if (!audio) {
			const newAudio = new Audio(src)
			newAudio.addEventListener("ended", () => setIsPlaying(false))
			setAudio(newAudio)
			newAudio.play()
			setIsPlaying(true)
		} else {
			if (isPlaying) {
				audio.pause()
			} else {
				audio.play()
			}
			setIsPlaying(!isPlaying)
		}
	}

	return (
		<Button onClick={togglePlay} size="lg" className="h-16 px-6 rounded-full">
			{isPlaying ? (
				<>
					<Pause className="h-6 w-6 mr-2" />
					一時停止
				</>
			) : (
				<>
					<Play className="h-6 w-6 mr-2" />
					再生する
				</>
			)}
		</Button>
	)
}
