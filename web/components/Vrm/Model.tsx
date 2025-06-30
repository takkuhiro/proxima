import { AgentAtom } from "@/lib/state"
import { VRMLoaderPlugin } from "@pixiv/three-vrm"
import type { VRM } from "@pixiv/three-vrm"
import {
	type VRMAnimation,
	VRMAnimationLoaderPlugin,
	VRMLookAtQuaternionProxy,
	createVRMAnimationClip,
} from "@pixiv/three-vrm-animation"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useAtom } from "jotai"
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react"
import * as THREE from "three"
import { type GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

// 型定義を追加
export type ModelHandle = {
	playAnimation: () => void
}

const Model = forwardRef<ModelHandle>((props, ref) => {
	const [agent, setAgent] = useAtom(AgentAtom)
	const [gltf, setGltf] = useState<GLTF>()
	const mixerRef = useRef<THREE.AnimationMixer | null>(null)
	const vrmRef = useRef<VRM | null>(null)
	const mainAnimationClipRef = useRef<THREE.AnimationClip | null>(null)
	const idleAnimationClipRef = useRef<THREE.AnimationClip | null>(null)

	// GLTFLoader生成・registerをまとめる
	const createLoader = useCallback(() => {
		const loader = new GLTFLoader()
		loader.register((parser) => new VRMLoaderPlugin(parser))
		loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
		return loader
	}, [])

	// mainアニメーション終了時にidle再生
	const handleMainAnimationFinished = useCallback(() => {
		playIdleAnimation()
	}, [])

	// アニメーション再生の共通関数
	const playAnimationClip = useCallback(
		(
			clip: THREE.AnimationClip,
			loopType: THREE.AnimationActionLoopStyles,
			onFinish?: () => void,
		) => {
			if (vrmRef.current) {
				if (mixerRef.current) {
					mixerRef.current.stopAllAction()
					mixerRef.current.uncacheRoot(vrmRef.current.scene)
					mixerRef.current.removeEventListener(
						"finished",
						handleMainAnimationFinished,
					)
				}
				const mixer = new THREE.AnimationMixer(vrmRef.current.scene)
				const action = mixer.clipAction(clip)
				action.reset()
				action.setLoop(
					loopType,
					loopType === THREE.LoopOnce ? 1 : Number.POSITIVE_INFINITY,
				)
				action.clampWhenFinished = true
				action.play()
				if (onFinish) {
					mixer.addEventListener("finished", onFinish)
				}
				mixerRef.current = mixer
			}
		},
		[handleMainAnimationFinished],
	)

	// VRMA_01~07.vrmaをロードする関数
	const loadMainAnimation = useCallback(
		(
			index: number,
			vrm: VRM,
			loader: GLTFLoader,
			onLoaded?: (vrmAnimation: VRMAnimation) => void,
		) => {
			const fileName = `/models/vrma/VRMA_0${index}.vrma`
			loader.load(fileName, (animGltf) => {
				const vrmAnimations = animGltf.userData.vrmAnimations
				const vrmAnimation = vrmAnimations?.[0]
				if (vrm && vrmAnimation) {
					if (onLoaded) onLoaded(vrmAnimation)
				}
			})
		},
		[],
	)

	useEffect(() => {
		const loader = createLoader()

		// VRMロード
		loader.load(`/models/${agent}.vrm`, (gltf) => {
			const vrm = gltf.userData.vrm
			vrmRef.current = vrm
			setGltf(gltf)

			// LookAtProxyを手動でセット
			if (vrm && !vrm.lookAt?.proxy) {
				vrm.lookAt.proxy = new VRMLookAtQuaternionProxy(vrm)
			}

			// mainアニメーションロード（初回は01固定）
			loadMainAnimation(1, vrm, loader, (vrmAnimation) => {
				mainAnimationClipRef.current = createVRMAnimationClip(vrmAnimation, vrm)
				playAnimationClip(
					mainAnimationClipRef.current,
					THREE.LoopOnce,
					handleMainAnimationFinished,
				)
			})

			// idleアニメーションロード
			loader.load("/models/vrma/idle_loop.vrma", (idleGltf) => {
				const idleVrmAnimations = idleGltf.userData.vrmAnimations
				const idleVrmAnimation = idleVrmAnimations?.[0]
				if (vrm && idleVrmAnimation) {
					idleAnimationClipRef.current = createVRMAnimationClip(
						idleVrmAnimation,
						vrm,
					)
				}
			})
		})
	}, [
		createLoader,
		loadMainAnimation,
		playAnimationClip,
		handleMainAnimationFinished,
		agent,
	])

	// mainアニメーション再生
	const playMainAnimation = (random?: boolean) => {
		if (!vrmRef.current) return
		const loader = createLoader()
		let index = 1 // デフォルトは01
		if (random) {
			index = Math.floor(Math.random() * 7) + 1 // 1~7
		}
		loadMainAnimation(index, vrmRef.current, loader, (vrmAnimation) => {
			if (!vrmRef.current) return
			const clip = createVRMAnimationClip(vrmAnimation, vrmRef.current)
			playAnimationClip(clip, THREE.LoopOnce, handleMainAnimationFinished)
		})
	}

	// idleアニメーション再生
	const playIdleAnimation = () => {
		if (vrmRef.current && idleAnimationClipRef.current) {
			playAnimationClip(idleAnimationClipRef.current, THREE.LoopRepeat)
		}
	}

	useImperativeHandle(ref, () => ({
		playAnimation: () => playMainAnimation(true),
	}))

	useFrame((_, delta) => {
		if (mixerRef.current) mixerRef.current.update(delta)
		if (vrmRef.current) vrmRef.current.update(delta)
	})

	return gltf ? (
		<primitive object={gltf.scene} />
	) : (
		<Html center>Loading...</Html>
	)
})

export default Model
