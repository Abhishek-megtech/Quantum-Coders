import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pulsing neon ring that sweeps upward like a LiDAR scan
function ScanRing({ active }) {
  const ringRef = useRef()
  const materialRef = useRef()

  useFrame((state) => {
    if (!ringRef.current) return
    if (!active) {
      ringRef.current.visible = false
      return
    }
    ringRef.current.visible = true
    const t = state.clock.elapsedTime
    ringRef.current.position.y = 2.8 + ((t * 1.2) % 6)
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(t * 4) * 0.3
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 2.8, 0]} visible={false}>
      <ringGeometry args={[1.8, 2.2, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#00ffaa"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Bounding box wireframe around the plume
function BoundingBox({ active, plumeProgress }) {
  const boxRef = useRef()

  useFrame((state) => {
    if (!boxRef.current) return
    if (!active || plumeProgress < 0.1) {
      boxRef.current.visible = false
      return
    }
    boxRef.current.visible = true
    const t = state.clock.elapsedTime
    boxRef.current.material.opacity = 0.2 + Math.sin(t * 2) * 0.12
  })

  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(3.5, 5, 3.5)),
    []
  )

  return (
    <lineSegments
      ref={boxRef}
      geometry={geometry}
      position={[1.2, 4.5, 0.8]}
      visible={false}
    >
      <lineBasicMaterial
        color="#00d4ff"
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </lineSegments>
  )
}

// Glowing neon orb at chimney tip — the AI "lock-on" marker
function DetectionPing({ active }) {
  const pingRef = useRef()
  const outerRef = useRef()

  useFrame((state) => {
    if (!pingRef.current) return
    if (!active) {
      pingRef.current.visible = false
      if (outerRef.current) outerRef.current.visible = false
      return
    }
    pingRef.current.visible = true
    if (outerRef.current) outerRef.current.visible = true
    const t = state.clock.elapsedTime
    pingRef.current.scale.setScalar(1 + Math.abs(Math.sin(t * 3)) * 0.3)
    if (outerRef.current) {
      outerRef.current.scale.setScalar(1 + Math.abs(Math.sin(t * 3 + 1)) * 0.6)
      outerRef.current.material.opacity = 0.15 + Math.abs(Math.sin(t * 3)) * 0.2
    }
  })

  return (
    <group position={[0, 3.1, 0]}>
      <mesh ref={pingRef} visible={false}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#00ffaa" transparent opacity={0.95} />
      </mesh>
      <mesh ref={outerRef} visible={false}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#00ffaa" transparent opacity={0.2} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// Corner bracket markers
function CornerBrackets({ active, plumeProgress }) {
  const linesRef = useRef()

  // Always compute geometry (never conditional)
  const geometry = useMemo(() => {
    const w = 1.75
    const h = 2.5
    const d = 1.75
    const bl = 0.4

    const corners = [
      [-w, 0, -d], [w, 0, -d], [-w, 0, d], [w, 0, d],
      [-w, h * 2, -d], [w, h * 2, -d], [-w, h * 2, d], [w, h * 2, d],
    ]
    const dirsX = [bl, -bl, bl, -bl, bl, -bl, bl, -bl]
    const dirsY = [bl, bl, bl, bl, -bl, -bl, -bl, -bl]
    const dirsZ = [bl, bl, -bl, -bl, bl, bl, -bl, -bl]

    const pts = []
    corners.forEach((c, i) => {
      pts.push(new THREE.Vector3(c[0], c[1], c[2]))
      pts.push(new THREE.Vector3(c[0] + dirsX[i], c[1], c[2]))
      pts.push(new THREE.Vector3(c[0], c[1], c[2]))
      pts.push(new THREE.Vector3(c[0], c[1] + dirsY[i], c[2]))
      pts.push(new THREE.Vector3(c[0], c[1], c[2]))
      pts.push(new THREE.Vector3(c[0], c[1], c[2] + dirsZ[i]))
    })

    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  useFrame((state) => {
    if (!linesRef.current) return
    if (!active || plumeProgress < 0.2) {
      linesRef.current.visible = false
      return
    }
    linesRef.current.visible = true
    linesRef.current.material.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 5) * 0.3
    // Scale with plume
    const s = plumeProgress
    linesRef.current.scale.set(s, s, s)
  })

  return (
    <lineSegments
      ref={linesRef}
      geometry={geometry}
      position={[1.2, 2.0, 0.8]}
      visible={false}
    >
      <lineBasicMaterial color="#00ffcc" transparent opacity={0.85} depthWrite={false} />
    </lineSegments>
  )
}

export default function DetectionOverlay({ active, plumeProgress }) {
  return (
    <group>
      <ScanRing active={active} />
      <BoundingBox active={active} plumeProgress={plumeProgress} />
      <DetectionPing active={active} />
      <CornerBrackets active={active} plumeProgress={plumeProgress} />
    </group>
  )
}
