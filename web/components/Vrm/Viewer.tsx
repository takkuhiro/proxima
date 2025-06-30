import { Canvas, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"

import { OrbitControls } from "@react-three/drei"
import Model, { type ModelHandle } from "./Model"

function CameraController() {
	const { camera } = useThree()
	useEffect(() => {
		camera.position.set(0, 1.3, -0.9)
		camera.lookAt(0, 1.3, -180)
	}, [camera])
	return null
}

export default function Viewer({
	modelRef,
}: { modelRef?: React.RefObject<ModelHandle | null> }) {
	const gltfCanvasParentRef = useRef<HTMLButtonElement>(null)
	// const modelRef = useRef<ModelHandle>(null) // 外部から受け取るので不要

	const handleClick = () => {
		modelRef?.current?.playAnimation()
	}

	return (
		<div className="h-full">
			<button
				ref={gltfCanvasParentRef}
				style={{
					height: "100%",
					background: "none",
					border: "none",
					padding: 0,
					width: "100%",
					cursor: "pointer",
				}}
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						handleClick()
					}
				}}
				type="button"
			>
				<Canvas frameloop="always" flat>
					<CameraController />
					<directionalLight position={[1, 1, 1]} intensity={1.8} />
					<ambientLight intensity={1.2} />
					<Model ref={modelRef} />
					<OrbitControls
						enableZoom={true}
						enablePan={false}
						enableDamping={false}
						target={[0, 1.3, 0]}
					/>
				</Canvas>
			</button>
		</div>
	)
}
