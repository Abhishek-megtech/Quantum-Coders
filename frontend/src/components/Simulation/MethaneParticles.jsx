import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 5000

// Windows and doors as leak sources - EXPANDED WITH NEW 3-FLOOR BUILDING
const PIPE_POSITIONS = [
  // Ground floor (Level 1)
  { x: -3.5, y: 1.8, z: 3.51, name: 'Ground Door Left' },
  { x: -0.5, y: 1.8, z: 3.51, name: 'Ground Door Center' },
  { x:  2.5, y: 1.8, z: 3.51, name: 'Ground Door Right' },
  { x: -5.5, y: 1.5, z: 3.51, name: 'Ground Window 1' },
  { x: -3.2, y: 1.5, z: 3.51, name: 'Ground Window 2' },
  { x:  3.7, y: 1.5, z: 3.51, name: 'Ground Window 3' },
  
  // Second floor (Level 2)
  { x: -4.5, y: 6.6, z: 2.75, name: 'Floor 2 Window 1' },
  { x: -2.2, y: 6.6, z: 2.75, name: 'Floor 2 Window 2' },
  { x:  0.1, y: 6.6, z: 2.75, name: 'Floor 2 Window 3' },
  { x:  2.4, y: 6.6, z: 2.75, name: 'Floor 2 Window 4' },
  
  // Third floor (Level 3)
  { x: -3.2, y: 10.2, z: 2.1, name: 'Floor 3 Window 1' },
  { x: -0.8, y: 10.2, z: 2.1, name: 'Floor 3 Window 2' },
  { x:  1.6, y: 10.2, z: 2.1, name: 'Floor 3 Window 3' },
  
  // Control room side extension
  { x:  5.51, y: 2.5, z: -1.6, name: 'Control Room Level 1' },
  { x:  5.51, y: 6.0, z: 0, name: 'Control Room Level 2' }
]
const PARTICLES_PER_PIPE = Math.floor(PARTICLE_COUNT / PIPE_POSITIONS.length)

// Vertex shader for particles
const vertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  attribute float aAge;
  uniform float uTime;
  varying float vOpacity;
  varying float vAge;

  void main() {
    vOpacity = aOpacity;
    vAge = aAge;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fragment shader - green methane glow
const fragmentShader = `
  varying float vOpacity;
  varying float vAge;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = (1.0 - dist * 2.0) * vOpacity;
    // Green-teal methane color with age fade
    vec3 innerColor = vec3(0.2, 1.0, 0.5);
    vec3 outerColor = vec3(0.0, 0.6, 0.3);
    vec3 color = mix(innerColor, outerColor, vAge);

    gl_FragColor = vec4(color, alpha);
  }
`

export default function MethaneParticles({ isSimulating, windDir, plumeProgress }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  const particleDataRef = useRef([])
  const smoothWindDirRef = useRef(0)

  // Initialize particle data
  const { positions, sizes, opacities, ages } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const opacities = new Float32Array(PARTICLE_COUNT)
    const ages = new Float32Array(PARTICLE_COUNT)

    // Distribute particles among the three pipes
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Determine which pipe this particle belongs to
      const pipeIndex = Math.floor(i / PARTICLES_PER_PIPE)
      const pipe = PIPE_POSITIONS[Math.min(pipeIndex, PIPE_POSITIONS.length - 1)]
      
      // Start all particles dormant at their respective pipe locations
      positions[i * 3]     = pipe.x + (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = pipe.y + Math.random() * 0.3
      positions[i * 3 + 2] = pipe.z + (Math.random() - 0.5) * 0.5
      sizes[i]    = 0
      opacities[i] = 0
      ages[i] = 0
    }

    particleDataRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const pipeIndex = Math.floor(i / PARTICLES_PER_PIPE)
      const pipe = PIPE_POSITIONS[Math.min(pipeIndex, PIPE_POSITIONS.length - 1)]
      
      return {
        pipeX: pipe.x,
        pipeY: pipe.y,
        pipeZ: pipe.z,
        life: 10, // Fixed lifetime - 10 seconds for consistent cycling
        maxLife: 10, // Fixed lifetime
        vx: (Math.random() - 0.5) * 0.006,
        vy: Math.random() * 0.08 + 0.12,
        vz: (Math.random() - 0.5) * 0.006,
        spawnDelay: 0,
        spawnX: (Math.random() - 0.5) * 0.4,
        spawnZ: (Math.random() - 0.5) * 0.4,
        turbulenceX: Math.sin(Math.random() * Math.PI * 2) * 0.8,
        turbulenceZ: Math.cos(Math.random() * Math.PI * 2) * 0.8,
        phaseOffset: Math.random() * 10, // Stagger particles so they don't all cycle together
      }
    })

    return { positions, sizes, opacities, ages }
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const posArr = geo.attributes.position.array
    const sizeArr = geo.attributes.aSize.array
    const opacArr = geo.attributes.aOpacity.array
    const ageArr = geo.attributes.aAge.array

    if (isSimulating) {
      timeRef.current += delta
    }

    // Smoothly interpolate wind direction towards target
    const windDifference = windDir - smoothWindDirRef.current
    // Normalize angle difference to shortest path
    const normalizedDifference = windDifference > 180 ? windDifference - 360 : windDifference < -180 ? windDifference + 360 : windDifference
    // Interpolate smoothly (adjust 0.02 for slower transitions - reduced from 0.08)
    smoothWindDirRef.current += normalizedDifference * 0.02
    // Normalize to 0-360 range
    smoothWindDirRef.current = (smoothWindDirRef.current + 360) % 360

    const t = timeRef.current
    // Wind direction vector with increased strength for more visible angle
    const windAngle = (smoothWindDirRef.current * Math.PI) / 180
    const windStrength = 0.04 * Math.min(1, t / 4) // Doubled wind strength

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const pd = particleDataRef.current[i]

      if (!isSimulating) {
        posArr[i * 3]     = pd.pipeX + pd.spawnX * 0.02
        posArr[i * 3 + 1] = pd.pipeY
        posArr[i * 3 + 2] = pd.pipeZ + pd.spawnZ * 0.02
        sizeArr[i]  = 0
        opacArr[i]  = 0
        continue
      }

      // Effective time for this particle - staggered with phase offset for continuous flow
      const et = (t + pd.phaseOffset) % pd.maxLife
      const normalizedAge = et / pd.maxLife
      ageArr[i] = normalizedAge

      // Strong upward motion like smoke
      const riseHeight = et * pd.vy * 30
      
      // Horizontal turbulent spread
      const turbulence = Math.sin(et * 2 + i) * 0.3
      const horizSpread = (et / 3) * plumeProgress
      const xi = pd.spawnX * 0.5 + pd.turbulenceX * turbulence * horizSpread
      const zi = pd.spawnZ * 0.5 + pd.turbulenceZ * turbulence * horizSpread
      
      // Wind drift - increased for more pronounced angle changes
      const windDrift = Math.sin(windAngle) * windStrength * et * 50
      const windDriftZ = Math.cos(windAngle) * windStrength * et * 50

      posArr[i * 3]     = pd.pipeX + xi + windDrift
      posArr[i * 3 + 1] = pd.pipeY + riseHeight
      posArr[i * 3 + 2] = pd.pipeZ + zi + windDriftZ

      // Size: starts small, grows mid-life, then fades
      const sizeT = normalizedAge < 0.15 ? normalizedAge / 0.15 : 
                    normalizedAge < 0.6 ? 1.0 : 
                    1 - (normalizedAge - 0.6) / 0.4
      sizeArr[i] = sizeT * 1.4

      // Opacity: fade in then out smoothly like smoke
      opacArr[i] = Math.sin(normalizedAge * Math.PI) * 0.8
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.aSize.needsUpdate = true
    geo.attributes.aOpacity.needsUpdate = true
    geo.attributes.aAge.needsUpdate = true
  })

  // Reset on stop or start
  useEffect(() => {
    if (!isSimulating) {
      timeRef.current = 0
    } else {
      // Reset time when starting simulation
      timeRef.current = 0
    }
  }, [isSimulating])

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize"    args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aOpacity" args={[opacities, 1]} />
        <bufferAttribute attach="attributes-aAge"     args={[ages, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
