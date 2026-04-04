import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'

import FactoryModel from './FactoryModel.jsx'
import MethaneParticles from './MethaneParticles.jsx'
import DetectionOverlay from './DetectionOverlay.jsx'
import SimHUD from './SimHUD.jsx'

const WIND_DIRS = [0, 90, 180, 270]

// ─── Camera controller with GSAP shake ───────────────────────────────────────
function CameraController({ isSimulating }) {
  const { camera } = useThree()
  const shaken = useRef(false)

  useEffect(() => {
    camera.position.set(8, 6, 10)
    camera.lookAt(0, 2, 0)
  }, [])

  useEffect(() => {
    if (isSimulating && !shaken.current) {
      shaken.current = true
      gsap.timeline()
        .to(camera.position, {
          x: camera.position.x + 0.3,
          y: camera.position.y + 0.18,
          duration: 0.07,
          yoyo: true,
          repeat: 9,
          ease: 'power1.inOut',
        })
    }
    if (!isSimulating) shaken.current = false
  }, [isSimulating])

  return (
    <OrbitControls
      enablePan={false}
      minDistance={3}
      maxDistance={80}
      maxPolarAngle={Math.PI / 2 - 0.05}
      dampingFactor={0.08}
      enableDamping
      target={[0, 2, 0]}
    />
  )
}

// ─── Ground glow ring ────────────────────────────────────────────────────────
function GroundGlow({ active }) {
  const ref = useRef()
  useFrame((s) => {
    if (!ref.current || !active) return
    ref.current.material.opacity = 0.07 + Math.sin(s.clock.elapsedTime * 2) * 0.04
  })
  if (!active) return null
  return (
    <mesh ref={ref} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.5, 5.5, 64]} />
      <meshBasicMaterial color="#00ff66" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ─── Trees and vegetation ─────────────────────────────────────────────────────
function Trees() {
  const trees = [
    { x: -15, z: -5 }, { x: -16, z: 8 },
    { x: 15, z: -5 }, { x: 16, z: 8 },
    { x: -8, z: -14 }, { x: 8, z: -14 },
  ]

  return (
    <group>
      {trees.map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]}>
          {/* Trunk - wooden base */}
          <mesh castShadow position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.4, 0.5, 1.6, 6]} />
            <meshStandardMaterial color="#4a2511" roughness={0.9} metalness={0.1} />
          </mesh>
          
          {/* Christmas tree - Tier 1 (bottom, largest) */}
          <mesh position={[0, 2.0, 0]} castShadow>
            <coneGeometry args={[3.0, 3.0, 32]} />
            <meshStandardMaterial color="#0d5a0d" roughness={0.7} />
          </mesh>
          
          {/* Christmas tree - Tier 2 (middle) */}
          <mesh position={[0, 4.5, 0]} castShadow>
            <coneGeometry args={[2.2, 2.5, 32]} />
            <meshStandardMaterial color="#0f7a0f" roughness={0.7} />
          </mesh>
          
          {/* Christmas tree - Tier 3 (top) */}
          <mesh position={[0, 6.5, 0]} castShadow>
            <coneGeometry args={[1.4, 2.0, 32]} />
            <meshStandardMaterial color="#0d5a0d" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Environment: lights, grid, stars ────────────────────────────────────────
function Environment() {
  return (
    <>
      <fog attach="fog" args={['#87ceeb', 30, 120]} />
      <color attach="background" args={['#87ceeb']} />
      <Grid
        position={[0, -0.02, 0]}
        args={[120, 120]}
        cellSize={1.0}
        cellThickness={0.3}
        cellColor="#e0e0e0"
        sectionSize={8}
        sectionThickness={0.6}
        sectionColor="#808080"
        fadeDistance={80}
        fadeStrength={1.5}
        infiniteGrid
      />
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#7cb342" roughness={1} />
      </mesh>
      <Trees />
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[8, 14, 6]} intensity={2} color="#ffffcc"
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50} shadow-camera-right={50}
        shadow-camera-top={50} shadow-camera-bottom={-50}
      />
      <directionalLight position={[-6, 5, -8]} intensity={0.6} color="#b0d0ff" />
      <pointLight position={[0, 8, -12]} intensity={0.8} color="#ffee99" distance={25} />
    </>
  )
}

// ─── Inner scene (everything inside Canvas) ───────────────────────────────────
function InnerScene({ isSimulating, windDirDeg, plumeProgress, detectionActive }) {
  return (
    <>
      <Environment />
      <CameraController isSimulating={isSimulating} />
      <FactoryModel isSimulating={isSimulating} />
      <MethaneParticles
        isSimulating={isSimulating}
        windDir={windDirDeg}
        plumeProgress={plumeProgress}
      />
      <DetectionOverlay active={detectionActive} plumeProgress={plumeProgress} />
      <GroundGlow active={isSimulating} />
      <EffectComposer>
        <Bloom
          intensity={isSimulating ? 1.2 : 0.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.85}
          kernelSize={3}
        />
        <Vignette eskil={false} offset={0.28} darkness={0.8} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function SimulationScene() {
  const [isSimulating, setIsSimulating]     = useState(false)
  const [windDirIndex, setWindDirIndex]     = useState(0)
  const [plumeProgress, setPlumeProgress]   = useState(0)
  const [detectionActive, setDetectionActive] = useState(false)
  const [emissionRate, setEmissionRate]     = useState(0)
  const [confidence, setConfidence]         = useState(0)
  const [isSuperEmitter, setIsSuperEmitter] = useState(false)
  const [elapsedTime, setElapsedTime]       = useState(0)
  const [showPredictions, setShowPredictions] = useState(false)
  const [methaneLoss, setMethaneLoss]       = useState(0)
  const [moneyLost, setMoneyLost]           = useState(0)

  const plumeTimer   = useRef(null)
  const emitTimer    = useRef(null)
  const detectTimer  = useRef(null)
  const superTimer   = useRef(null)
  const confTimer    = useRef(null)
  const timeTimer    = useRef(null)
  const startTimeRef = useRef(null)

  const clearAll = () => {
    clearInterval(plumeTimer.current)
    clearInterval(emitTimer.current)
    clearInterval(confTimer.current)
    clearInterval(timeTimer.current)
    clearTimeout(detectTimer.current)
    clearTimeout(superTimer.current)
  }

  const handleSimulate = useCallback(() => {
    if (isSimulating) return
    clearAll()

    setIsSimulating(true)
    setPlumeProgress(0)
    setDetectionActive(false)
    setEmissionRate(0)
    setConfidence(0)
    setIsSuperEmitter(false)
    setElapsedTime(0)
    setMethaneLoss(0)
    setMoneyLost(0)

    const t0 = Date.now()
    startTimeRef.current = t0

    // Timer updates every 100ms
    timeTimer.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - t0) / 1000
      setElapsedTime(elapsedSeconds)
      
      // Calculate methane loss: average of current and peak emission rate * time / 3600 (to convert from kg/hr to kg)
      // Using average of 0 to current emission rate ramping up
      const avgEmissionRate = elapsedSeconds < 12 ? (elapsedSeconds / 12) * (elapsedSeconds / 12) * 647 / 2 : 647 / 2
      const currentMethane = (elapsedSeconds * avgEmissionRate) / 3600
      setMethaneLoss(currentMethane)
      
      // Money lost: ~$50 per kg of methane (estimated market value)
      const moneyPerKg = 50
      setMoneyLost(currentMethane * moneyPerKg)
    }, 100)

    // Plume grows for 8 seconds
    plumeTimer.current = setInterval(() => {
      const e = (Date.now() - t0) / 1000
      setPlumeProgress(Math.min(e / 8, 1))
    }, 40)

    // Emission rate ramps to 647 kg/hr over 12s
    emitTimer.current = setInterval(() => {
      const e = (Date.now() - t0) / 1000
      const ease = Math.min(e / 12, 1)
      setEmissionRate(Math.round(ease * ease * 647))
    }, 80)

    // AI detection starts at 3s
    detectTimer.current = setTimeout(() => {
      setDetectionActive(true)
      const t1 = Date.now()
      confTimer.current = setInterval(() => {
        const e = (Date.now() - t1) / 1000
        const c = Math.min(e / 5, 1) * 87.2
        setConfidence(c)
        if (c >= 87.2) clearInterval(confTimer.current)
      }, 55)
    }, 3000)

    // Super emitter declared at 10s
    superTimer.current = setTimeout(() => setIsSuperEmitter(true), 10000)
  }, [isSimulating])

  const handleReset = useCallback(() => {
    clearAll()
    setIsSimulating(false)
    setPlumeProgress(0)
    setDetectionActive(false)
    setEmissionRate(0)
    setConfidence(0)
    setIsSuperEmitter(false)
    setElapsedTime(0)
    setMethaneLoss(0)
    setMoneyLost(0)
  }, [])

  const handleWindChange = useCallback(() => {
    setWindDirIndex(i => (i + 1) % 4)
  }, [])

  useEffect(() => () => clearAll(), [])

  const windDirDeg = WIND_DIRS[windDirIndex]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#020510' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        camera={{ fov: 55, near: 0.1, far: 200 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <InnerScene
            isSimulating={isSimulating}
            windDirDeg={windDirDeg}
            plumeProgress={plumeProgress}
            detectionActive={detectionActive}
          />
        </Suspense>
      </Canvas>

      {/* Overlay HUD */}
      <SimHUD
        isSimulating={isSimulating}
        isDetecting={detectionActive}
        isSuperEmitter={isSuperEmitter}
        emissionRate={emissionRate}
        confidence={confidence}
        windDir={windDirDeg}
        windDirIndex={windDirIndex}
        onSimulate={handleSimulate}
        onReset={handleReset}
        onWindChange={handleWindChange}
        elapsedTime={elapsedTime}
        showPredictions={showPredictions}
        onTogglePredictions={() => setShowPredictions(!showPredictions)}
        methaneLoss={methaneLoss}
        moneyLost={moneyLost}
      />
    </div>
  )
}
