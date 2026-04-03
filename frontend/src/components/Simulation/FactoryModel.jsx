import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Distillation Column - Tall industrial fractionation tower
function DistillationColumn({ x, z, height = 8.0, radius = 0.45 }) {
  return (
    <group position={[x, 0, z]}>
      {/* Main column body */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial color="#ff7700" roughness={0.65} metalness={0.85} />
      </mesh>
      
      {/* Top cap */}
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[radius * 1.1, 16, 8]} />
        <meshStandardMaterial color="#bb5500" roughness={0.7} metalness={0.8} />
      </mesh>
      
      {/* Condenser coils wrapping around */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const px = Math.cos(rad) * radius * 1.4
        const pz = Math.sin(rad) * radius * 1.4
        return (
          <mesh key={`coil-${i}`} position={[px, height * 0.7, pz]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
            <meshStandardMaterial color="#ff8800" roughness={0.6} metalness={0.88} />
          </mesh>
        )
      })}
      
      {/* Trays/plates inside */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((factor, i) => (
        <mesh key={`tray-${i}`} position={[0, height * factor, 0]}>
          <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.06, 32]} />
          <meshStandardMaterial color="#663300" roughness={0.75} metalness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// Spherical pressure vessel
function SphericalTank({ x, z, radius = 1.2 }) {
  return (
    <group position={[x, radius + 0.2, z]}>
      {/* Main sphere */}
      <mesh castShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color="#ff8800" roughness={0.7} metalness={0.85} />
      </mesh>
      
      {/* Safety stripe band */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[radius * 0.95, radius * 0.08, 8, 100]} />
        <meshStandardMaterial color="#ffaa00" roughness={0.3} metalness={0.92} emissive="#ff8800" emissiveIntensity={0.6} />
      </mesh>
      
      {/* Connection nozzles */}
      {[45, 135, 225, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const px = Math.cos(rad) * radius * 0.8
        const pz = Math.sin(rad) * radius * 0.8
        return (
          <mesh key={`nozzle-${i}`} position={[px, 0, pz]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
            <meshStandardMaterial color="#bb5500" roughness={0.65} metalness={0.9} />
          </mesh>
        )
      })}
      
      {/* Support frame */}
      <mesh position={[0, -radius - 0.3, 0]}>
        <boxGeometry args={[radius * 2.4, 0.2, radius * 2.4]} />
        <meshStandardMaterial color="#884400" roughness={0.8} metalness={0.75} />
      </mesh>
    </group>
  )
}

// Heat Exchanger - Shell and tube unit
function HeatExchanger({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      {/* Main shell cylinder */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 2.2, 24]} />
        <meshStandardMaterial color="#ff7700" roughness={0.7} metalness={0.8} />
      </mesh>
      
      {/* End caps */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.55, 16, 8]} />
        <meshStandardMaterial color="#bb5500" roughness={0.75} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 16, 8]} />
        <meshStandardMaterial color="#bb5500" roughness={0.75} metalness={0.75} />
      </mesh>
      
      {/* Internal tubes simulation */}
      {[0, 120, 240].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const px = Math.cos(rad) * 0.2
        const pz = Math.sin(rad) * 0.2
        return (
          <mesh key={`tube-${i}`} position={[px, 1.1, pz]}>
            <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
            <meshStandardMaterial color="#ffaa00" roughness={0.65} metalness={0.85} />
          </mesh>
        )
      })}
      
      {/* Support feet */}
      {[-0.4, 0.4].map((x_offset, i) => (
        <mesh key={`foot-${i}`} position={[x_offset, 0.15, 0]} castShadow>
          <boxGeometry args={[0.25, 0.3, 0.25]} />
          <meshStandardMaterial color="#663300" roughness={0.85} metalness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// Chemical separator tank - Rectangular
function SeparatorTank({ x, z, w = 1.8, h = 2.4, d = 1.0 }) {
  return (
    <group position={[x, h / 2, z]}>
      {/* Main tank */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#ff8800" roughness={0.75} metalness={0.7} />
      </mesh>
      
      {/* Baffles inside */}
      {[0.3, 0.6].map((factor, i) => (
        <mesh key={`baffle-${i}`} position={[0, h * factor - h / 2, 0]}>
          <boxGeometry args={[w * 0.9, 0.08, d * 0.95]} />
          <meshStandardMaterial color="#663300" roughness={0.8} metalness={0.65} />
        </mesh>
      ))}
      
      {/* Inlet/outlet ports */}
      {[-w / 2.5, w / 2.5].map((x_pos, i) => (
        <mesh key={`port-${i}`} position={[x_pos, h * 0.3, d / 2 + 0.08]} castShadow>
          <boxGeometry args={[0.2, 0.25, 0.16]} />
          <meshStandardMaterial color="#884400" roughness={0.7} metalness={0.85} />
        </mesh>
      ))}
      
      {/* Support legs */}
      {[-w / 2.8, w / 2.8].map((x_pos, i) => (
        <mesh key={`leg-${i}`} position={[x_pos, -h / 2 - 0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.65} />
        </mesh>
      ))}
    </group>
  )
}

// Single chimney stack - bigger
function Chimney({ x, z, height, radius }) {
  const heatRef = useRef()

  useFrame((state) => {
    if (!heatRef.current) return
    const t = state.clock.elapsedTime
    heatRef.current.scale.y = 1 + Math.sin(t * 2 + x) * 0.03
  })

  return (
    <group position={[x, 0, z]}>
      {/* Base stack */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 1.2, height, 20]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.6} metalness={0.85} />
      </mesh>
      {/* Top ring */}
      <mesh position={[0, height, 0]}>
        <cylinderGeometry args={[radius * 1.35, radius * 1.15, 0.18, 20]} />
        <meshStandardMaterial color="#0f3460" roughness={0.4} metalness={0.95} />
      </mesh>
      {/* Red warning stripe */}
      <mesh position={[0, height * 0.7, 0]}>
        <cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.12, 20]} />
        <meshStandardMaterial color="#cc2200" roughness={0.3} metalness={0.8} emissive="#aa1100" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, height * 0.4, 0]}>
        <cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.12, 20]} />
        <meshStandardMaterial color="#cc2200" roughness={0.3} metalness={0.8} emissive="#aa1100" emissiveIntensity={0.5} />
      </mesh>
      {/* Internal shimmer ref */}
      <mesh ref={heatRef} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, height * 0.9, 8]} />
        <meshBasicMaterial color="#001a00" transparent opacity={0.0} />
      </mesh>
    </group>
  )
}

// Industrial storage tank - REDESIGNED
function Tank({ x, z, r = 0.7, h = 1.4 }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h, 28]} />
        <meshStandardMaterial color="#ff7700" roughness={0.7} metalness={0.75} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <sphereGeometry args={[r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffaa00" roughness={0.65} metalness={0.8} />
      </mesh>
      {/* Safety stripe */}
      <mesh position={[0, h * 0.55, 0]}>
        <cylinderGeometry args={[r + 0.015, r + 0.015, 0.08, 28]} />
        <meshStandardMaterial color="#ffaa00" roughness={0.3} metalness={0.9} emissive="#ff8800" emissiveIntensity={0.8} />
      </mesh>
      {/* Ladder */}
      <mesh position={[r + 0.04, h / 2, 0]} castShadow>
        <boxGeometry args={[0.06, h, 0.06]} />
        <meshStandardMaterial color="#884400" roughness={0.8} metalness={0.7} />
      </mesh>
    </group>
  )
}

// Pipe connector - DARK INDUSTRIAL
function Pipe({ from, to, r = 0.07 }) {
  const from3 = new THREE.Vector3(...from)
  const to3 = new THREE.Vector3(...to)
  const dir = to3.clone().sub(from3)
  const len = dir.length()
  const mid = from3.clone().add(to3).multiplyScalar(0.5)
  const quat = new THREE.Quaternion()
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())

  return (
    <mesh position={mid.toArray()} quaternion={quat.toArray()}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.35} metalness={0.95} />
    </mesh>
  )
}

// Cooling tower - huge industrial structure
function CoolingTower({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      {/* Base cylinder - tapered */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[1.8, 2.0, 4.5, 32]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} metalness={0.4} />
      </mesh>
      
      {/* Top rim - flared */}
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[1.9, 1.8, 0.2, 32]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.85} metalness={0.35} />
      </mesh>
      
      {/* Internal fill grid pattern */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const px = Math.cos(rad) * 0.8
        const pz = Math.sin(rad) * 0.8
        return (
          <mesh key={`cool-grid-${i}`} position={[px, 2.0, pz]}>
            <boxGeometry args={[0.3, 3.5, 0.15]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.75} metalness={0.55} />
          </mesh>
        )
      })}
      
      {/* Support legs */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const px = Math.cos(rad) * 2.2
        const pz = Math.sin(rad) * 2.2
        return (
          <mesh key={`cool-leg-${i}`} position={[px, 1.2, pz]} castShadow>
            <boxGeometry args={[0.35, 2.5, 0.35]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

// Flare stack with glow
function FlareStack({ x, z }) {
  const glowRef = useRef()
  useFrame((s) => {
    if (!glowRef.current) return
    const t = s.clock.elapsedTime
    glowRef.current.intensity = 0.6 + Math.abs(Math.sin(t * 7 + x)) * 1.2
  })
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 5.0, 12]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.6} metalness={0.9} />
      </mesh>
      {/* Flare tip */}
      <mesh position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3.5} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 5.3, 0]} color="#ff6600" intensity={1.5} distance={8} decay={2} />
    </group>
  )
}

// Main factory building - Industrial Design
function MainBuilding({ scale = 1 }) {
  return (
    <group>
      {/* Ground level - main hall - INDUSTRIAL GRAY */}
      <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[12 * scale, 6.0, 7 * scale]} />
        <meshStandardMaterial color="#ff7700" roughness={0.8} metalness={0.4} />
      </mesh>
      
      {/* Corrugated metal siding detail */}
      <mesh position={[0, 3.0, 3.52]}>
        <boxGeometry args={[12 * scale, 6.0, 0.08]} />
        <meshStandardMaterial color="#ff8800" roughness={0.9} metalness={0.3} />
      </mesh>
      
      {/* Ground floor doors - EXPANDED */}
      {[-3.5, -0.5, 2.5].map((x, i) => (
        <mesh key={`door-${i}`} position={[x, 1.8, 3.51]}>
          <boxGeometry args={[0.9, 2.8, 0.1]} />
          <meshStandardMaterial color="#884400" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      
      {/* Ground floor windows - row 1 - EXPANDED */}
      {[-5.5, -3.2, -0.9, 1.4, 3.7, 5.5].map((x, i) => (
        <mesh key={`gfloor-win-${i}`} position={[x, 1.5, 3.51]}>
          <planeGeometry args={[0.7, 1.0]} />
          <meshStandardMaterial color="#0088cc" emissive="#0088cc" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Second floor windows */}
      {[-4.5, -2.2, 0.1, 2.4, 4.5].map((x, i) => (
        <mesh key={`floor2-win-${i}`} position={[x, 7.1, 2.75]}>
          <planeGeometry args={[0.7, 0.85]} />
          <meshStandardMaterial color="#0088cc" emissive="#0088cc" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Third floor windows */}
      {[-3.2, -0.8, 1.6, 3.8].map((x, i) => (
        <mesh key={`floor3-win-${i}`} position={[x, 10.0, 2.1]}>
          <planeGeometry args={[0.65, 0.75]} />
          <meshStandardMaterial color="#0088cc" emissive="#0088cc" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Second level - INDUSTRIAL STEEL */}
      <mesh position={[-0.5, 7.5, 0]} castShadow>
        <boxGeometry args={[10 * scale, 3.0, 5.5 * scale]} />
        <meshStandardMaterial color="#ffaa00" roughness={0.75} metalness={0.5} />
      </mesh>
      <mesh position={[-0.5, 7.5, 2.76]}>
        <boxGeometry args={[10 * scale, 3.0, 0.08]} />
        <meshStandardMaterial color="#ff7700" roughness={0.85} metalness={0.35} />
      </mesh>
      
      {/* Third level - DARK STEEL */}
      <mesh position={[0.2, 10.4, 0]} castShadow>
        <boxGeometry args={[8 * scale, 2.2, 4.2 * scale]} />
        <meshStandardMaterial color="#ff8800" roughness={0.8} metalness={0.45} />
      </mesh>
      
      {/* HVAC Units on roof */}
      <mesh position={[-3.5, 12.2, -1.2]} castShadow>
        <boxGeometry args={[2.8, 1.2, 1.8]} />
        <meshStandardMaterial color="#bb5500" roughness={0.85} metalness={0.5} />
      </mesh>
      <mesh position={[3.2, 12.1, 0.8]} castShadow>
        <boxGeometry args={[2.4, 1.1, 1.5]} />
        <meshStandardMaterial color="#bb5500" roughness={0.85} metalness={0.5} />
      </mesh>
      
      {/* Ventilation stacks */}
      {[-2.0, 1.5].map((x, i) => (
        <mesh key={`vent-${i}`} position={[x, 12.5, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 1.2, 6]} />
          <meshStandardMaterial color="#884400" roughness={0.8} metalness={0.6} />
        </mesh>
      ))}
      
      {/* Control room - side extension - INDUSTRIAL GRAY */}
      <mesh position={[4.8, 5.5, 0]} castShadow>
        <boxGeometry args={[2.2, 5.0, 4.5]} />
        <meshStandardMaterial color="#ff8800" roughness={0.75} metalness={0.5} />
      </mesh>
      <mesh position={[4.8, 5.5, 2.26]}>
        <boxGeometry args={[2.2, 5.0, 0.08]} />
        <meshStandardMaterial color="#ff7700" roughness={0.85} metalness={0.35} />
      </mesh>
      
      {/* Control room windows - ground floor */}
      {[-1.6, 0, 1.6].map((z, i) => (
        <mesh key={`ctrl-win-g-${i}`} position={[5.51, 2.5, z]}>
          <planeGeometry args={[0.8, 1.8]} />
          <meshStandardMaterial color="#0088cc" emissive="#0088cc" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Control room windows - mid floor */}
      {[-1.2, 0, 1.2].map((z, i) => (
        <mesh key={`ctrl-win-mid-${i}`} position={[5.51, 6.5, z]}>
          <planeGeometry args={[0.8, 1.4]} />
          <meshStandardMaterial color="#0088cc" emissive="#0088cc" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Warning lights - TOP OF BUILDING */}
      {[-3.5, 0, 3.5].map((x, i) => (
        <mesh key={i} position={[x, 12.2, 3.51]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff2200" emissiveIntensity={2.5} />
        </mesh>
      ))}
      
      {/* Catwalks - MULTIPLE LEVELS - INDUSTRIAL RAILINGS */}
      <mesh position={[0, 6.0, 3.51]} castShadow>
        <boxGeometry args={[10.5, 0.08, 0.7]} />
        <meshStandardMaterial color="#884400" roughness={0.85} metalness={0.65} />
      </mesh>
      {/* Walking platform railings */}
      <mesh position={[5.3, 6.0, 3.51]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.7]} />
        <meshStandardMaterial color="#663300" roughness={0.8} metalness={0.7} />
      </mesh>
      
      <mesh position={[0, 9.0, 2.75]} castShadow>
        <boxGeometry args={[8.5, 0.08, 0.7]} />
        <meshStandardMaterial color="#884400" roughness={0.85} metalness={0.65} />
      </mesh>
      
      {/* Major supply pipes - HORIZONTAL */}
      <mesh position={[-3.0, 3.2, -3.8]} castShadow>
        <boxGeometry args={[1.0, 0.35, 0.35]} />
        <meshStandardMaterial color="#663300" roughness={0.4} metalness={0.9} />
      </mesh>
      <mesh position={[2.5, 7.8, -3.2]} castShadow>
        <boxGeometry args={[1.2, 0.4, 0.4]} />
        <meshStandardMaterial color="#663300" roughness={0.4} metalness={0.9} />
      </mesh>
      
      {/* Vertical process pipe */}
      <mesh position={[-4.2, 8.5, -3.0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 7.5, 8]} />
        <meshStandardMaterial color="#884400" roughness={0.45} metalness={0.85} />
      </mesh>
      
      {/* Step/ladder details on pipes */}
      {[1, 3, 5, 7].map((i) => (
        <mesh key={`pipe-rung-${i}`} position={[-4.2, 5.0 + i * 0.7, -3.0]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.08]} />
          <meshStandardMaterial color="#663300" roughness={0.8} metalness={0.7} />
        </mesh>
      ))}
      
      {/* Floor separators/beams - STEEL GRAY */}
      <mesh position={[0, 6.0, 0]} receiveShadow>
        <boxGeometry args={[12.5 * scale, 0.15, 7.5 * scale]} />
        <meshStandardMaterial color="#884400" roughness={0.85} metalness={0.4} />
      </mesh>
      <mesh position={[-0.5, 9.0, 0]} receiveShadow>
        <boxGeometry args={[10.5 * scale, 0.15, 5.8 * scale]} />
        <meshStandardMaterial color="#884400" roughness={0.85} metalness={0.4} />
      </mesh>
      
      {/* Roof - INDUSTRIAL TARRED */}
      <mesh position={[0.2, 11.5, 0]} receiveShadow>
        <boxGeometry args={[8.2 * scale, 0.15, 4.5 * scale]} />
        <meshStandardMaterial color="#663300" roughness={0.95} metalness={0.2} />
      </mesh>
      
      {/* Vertical support columns - MAJOR STEEL GIRDERS */}
      {[-5.0, 0, 5.0].map((x, i) => (
        <mesh key={`col-${i}`} position={[x, 6.0, 0]} castShadow>
          <boxGeometry args={[0.45, 11.5, 0.45]} />
          <meshStandardMaterial color="#663300" roughness={0.6} metalness={0.8} />
        </mesh>
      ))}
      
      {/* Additional bracing columns */}
      {[-7.5, 7.5].map((z, i) => (
        <mesh key={`col-back-${i}`} position={[0, 8.0, z]} castShadow>
          <boxGeometry args={[12.5, 0.35, 0.35]} />
        <meshStandardMaterial color="#663300" roughness={0.65} metalness={0.75} />
        </mesh>
      ))}
    </group>
  )
}

// City building - residential or commercial
function CityBuilding({ x, z, width = 3, depth = 3, height = 2.5, color = '#606060' }) {
  return (
    <group position={[x, 0, z]}>
      {/* Main building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.3} />
      </mesh>
      
      {/* Front face windows */}
      {Array.from({ length: Math.floor(width / 1.2) }).map((_, i) => {
        const windowCount = Math.floor(width / 1.2)
        const startX = -(windowCount - 1) * 0.6
        return (
          <group key={`front-win-${i}`}>
            {[0.3, 0.8, 1.3].map((wy, j) => (
              <mesh key={`w-${i}-${j}`} position={[startX + i * 1.2, wy, depth / 2 + 0.01]}>
                <planeGeometry args={[0.8, 0.4]} />
                <meshStandardMaterial 
                  color="#aaa" 
                  emissive="#ffeb3b" 
                  emissiveIntensity={Math.random() * 0.4 + 0.1} 
                  transparent 
                  opacity={0.7}
                />
              </mesh>
            ))}
          </group>
        )
      })}
      
      {/* Roof */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width + 0.1, 0.12, depth + 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.2} />
      </mesh>
      
      {/* Door */}
      <mesh position={[0, height * 0.35, depth / 2 + 0.02]}>
        <boxGeometry args={[width * 0.25, height * 0.7, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

// Street/road
function Street({ x, z, length = 30, width = 2, direction = 'x' }) {
  const args = direction === 'x' ? [length, 0.05, width] : [width, 0.05, length]
  return (
    <mesh position={[x, 0.02, z]} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#2a2a2a" roughness={1.0} metalness={0.05} />
    </mesh>
  )
}

// Park/green area
function ParkArea({ x, z, width = 8, depth = 8 }) {
  return (
    <mesh position={[x, 0.01, z]} receiveShadow>
      <boxGeometry args={[width, 0.01, depth]} />
      <meshStandardMaterial color="#3a7a3a" roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

// Street lamp
function StreetLamp({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      {/* Pole */}
      <mesh position={[0, 2.25, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 4.5, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.6} />
      </mesh>
      
      {/* Light head */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.25]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.5} />
      </mesh>
      
      {/* Light glow */}
      <pointLight position={[0, 4.2, 0]} color="#ffffaa" intensity={0.3} distance={15} decay={2} />
    </group>
  )
}

// Factory worker figure with walking animation - enters/exits via doors only
function Worker({ x, z, pathIndex = 0 }) {
  const groupRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  
  // Define walking paths - workers always use doors (z=3.51) to enter/exit the building
  // Door locations: [-3.5, 3.51], [-0.5, 3.51], [2.5, 3.51]
  const paths = [
    // Path 1: Enter left door -> walk inside -> exit center door
    [[-3.5, 5], [-3.5, 3.51], [-3, 0], [0, 0], [-0.5, 3.51], [-0.5, 5]],
    // Path 2: Enter center door -> walk inside -> exit right door
    [[-0.5, 5], [-0.5, 3.51], [-1, 1], [1, 2], [2.5, 3.51], [2.5, 5]],
    // Path 3: Enter right door -> walk inside -> exit left door
    [[2.5, 5], [2.5, 3.51], [2, 1], [-2, -1], [-3.5, 3.51], [-3.5, 5]],
    // Path 4: Start outside -> enter center door -> around inside -> exit left
    [[-0.5, 8], [-0.5, 5], [-0.5, 3.51], [0, 2], [-1, -1], [-3.5, 3.51], [-3.5, 5], [-3.5, 8]],
    // Path 5: Patrol outside, periodic entry
    [[4, 5], [2.5, 5], [2.5, 3.51], [1, 1], [0, 0], [-0.5, 3.51], [-0.5, 5], [-2, 6]],
    // Path 6: Left side entry/exit
    [[-6, 4], [-3.5, 4], [-3.5, 3.51], [-2, -0.5], [0, 1], [2.5, 3.51], [2.5, 5], [3, 6]],
    // Path 7: Right to left traversal through building
    [[5, 6], [2.5, 5], [2.5, 3.51], [2, 0], [0, -1], [-2, 0], [-3.5, 3.51], [-3.5, 5], [-5, 6]],
    // Path 8: Center door multiple loops
    [[-0.5, 6], [-0.5, 3.51], [-0.5, 0], [0.5, 1], [0.5, 3.51], [0.5, 6]],
    // Path 9: Left door circuit
    [[-3.5, 7], [-3.5, 3.51], [-3, 1.5], [-1, 2], [-0.5, 3.51], [-0.5, 5], [-2, 7]],
    // Path 10: Right door circuit
    [[3, 5], [2.5, 5], [2.5, 3.51], [1.5, 1], [-1, 0], [-0.5, 3.51], [-0.5, 5], [0, 7]],
    // Path 11: Perimeter with building entry
    [[6, -3], [2.5, 3.51], [1, 0], [-1, 1], [-3.5, 3.51], [-4, 6]]
  ]
  
  const currentPath = paths[pathIndex % paths.length]
  
  useFrame(() => {
    if (!groupRef.current) return
    
    const t = (Date.now() / 1000) % 40 // 40 second walk cycle per path for slower pace
    const cycleProgress = t / 40
    
    // Calculate position along path
    let pathSegment = Math.floor(cycleProgress * currentPath.length)
    if (pathSegment >= currentPath.length) pathSegment = currentPath.length - 1
    
    const nextSegment = Math.min(pathSegment + 1, currentPath.length - 1)
    const segmentProgress = (cycleProgress * currentPath.length) % 1
    
    const currentPos = currentPath[pathSegment]
    const nextPos = currentPath[nextSegment]
    
    const newX = currentPos[0] + (nextPos[0] - currentPos[0]) * segmentProgress
    const newZ = currentPos[1] + (nextPos[1] - currentPos[1]) * segmentProgress
    
    // Calculate direction facing
    const dx = nextPos[0] - currentPos[0]
    const dz = nextPos[1] - currentPos[1]
    const facing = Math.atan2(dx, dz)
    
    groupRef.current.position.set(newX, 0, newZ)
    groupRef.current.rotation.y = facing
    
    // Walking leg animation
    const walkPhase = (t * 3) % (Math.PI * 2) // Faster walking cycle
    if (leftLegRef.current) {
      leftLegRef.current.rotation.z = Math.sin(walkPhase) * 0.3
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.z = Math.sin(walkPhase + Math.PI) * 0.3
    }
    
    // Arm swing animation
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(walkPhase + Math.PI) * 0.4
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(walkPhase) * 0.4
    }
  })
  
  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {/* Head */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Hard hat */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <coneGeometry args={[0.18, 0.15, 12]} />
        <meshStandardMaterial color="#ff9900" roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.25]} />
        <meshStandardMaterial color="#0066cc" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.25, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.25, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.1, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.1, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  )
}

// Workers group with animated walking paths
function Workers() {
  return (
    <group>
      {/* 3 workers with assigned walking paths */}
      <Worker x={-5} z={2} pathIndex={0} />
      <Worker x={-2} z={-1} pathIndex={1} />
      <Worker x={3} z={1.5} pathIndex={2} />
    </group>
  )
}

// Vehicle - animated car/truck driving on roads
function Vehicle({ pathIndex = 0, vehicleType = 'car' }) {
  const groupRef = useRef()
  
  // Define road paths for different vehicles
  const paths = [
    // Path 1: Main horizontal road loop
    [[-60, -30], [60, -30], [60, 30], [-60, 30], [-60, -30]],
    // Path 2: Main vertical road
    [[-30, -60], [-30, 60], [30, 60], [30, -60], [-30, -60]],
    // Path 3: Diagonal route
    [[-50, -50], [50, 50], [50, -50], [-50, -50]],
  ]
  
  const currentPath = paths[pathIndex % paths.length]
  const speed = vehicleType === 'truck' ? 0.4 : 0.6 // trucks slower than cars
  
  useFrame(() => {
    if (!groupRef.current) return
    
    const t = (Date.now() / 1000) * speed
    const cycleLength = 120 // seconds for full cycle
    const cycleProgress = (t % cycleLength) / cycleLength
    
    // Calculate position along path
    let pathSegment = Math.floor(cycleProgress * currentPath.length)
    if (pathSegment >= currentPath.length) pathSegment = currentPath.length - 1
    
    const nextSegment = Math.min(pathSegment + 1, currentPath.length - 1)
    const segmentProgress = (cycleProgress * currentPath.length) % 1
    
    const currentPos = currentPath[pathSegment]
    const nextPos = currentPath[nextSegment]
    
    const newX = currentPos[0] + (nextPos[0] - currentPos[0]) * segmentProgress
    const newZ = currentPos[1] + (nextPos[1] - currentPos[1]) * segmentProgress
    
    // Calculate direction facing
    const dx = nextPos[0] - currentPos[0]
    const dz = nextPos[1] - currentPos[1]
    const facing = Math.atan2(dx, dz)
    
    groupRef.current.position.set(newX, 0.35, newZ)
    groupRef.current.rotation.y = facing
  })
  
  const carWidth = vehicleType === 'truck' ? 0.6 : 0.5
  const carLength = vehicleType === 'truck' ? 1.8 : 1.2
  const carHeight = vehicleType === 'truck' ? 0.8 : 0.6
  const carColor = vehicleType === 'truck' ? '#cc4400' : '#cc0000'
  
  return (
    <group ref={groupRef}>
      {/* Car body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[carWidth, carHeight, carLength]} />
        <meshStandardMaterial color={carColor} roughness={0.6} metalness={0.8} />
      </mesh>
      
      {/* Car roof */}
      <mesh position={[0, carHeight * 0.6, -carLength * 0.15]} castShadow>
        <boxGeometry args={[carWidth * 0.8, carHeight * 0.4, carLength * 0.5]} />
        <meshStandardMaterial color={carColor} roughness={0.6} metalness={0.75} />
      </mesh>
      
      {/* Front left wheel */}
      <mesh position={[-carWidth / 2 + 0.08, 0, carLength / 2 - 0.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.3} />
      </mesh>
      
      {/* Front right wheel */}
      <mesh position={[carWidth / 2 - 0.08, 0, carLength / 2 - 0.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.3} />
      </mesh>
      
      {/* Rear left wheel */}
      <mesh position={[-carWidth / 2 + 0.08, 0, -carLength / 2 + 0.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.3} />
      </mesh>
      
      {/* Rear right wheel */}
      <mesh position={[carWidth / 2 - 0.08, 0, -carLength / 2 + 0.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.3} />
      </mesh>
      
      {/* Windows */}
      <mesh position={[-carWidth / 2 - 0.01, carHeight * 0.5, -carLength * 0.1]}>
        <planeGeometry args={[0.02, carHeight * 0.3]} />
        <meshStandardMaterial color="#0099ff" emissive="#0099ff" emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// City component - arranges buildings and streets around area
function City() {
  const buildingColors = ['#606060', '#707070', '#555555', '#656565', '#5a5a5a']
  
  return (
    <group>
      {/* Outer perimeter highways */}
      <Street x={0} z={-60} length={120} width={3.5} direction="x" />
      <Street x={0} z={60} length={120} width={3.5} direction="x" />
      <Street x={-60} z={0} length={120} width={3.5} direction="z" />
      <Street x={60} z={0} length={120} width={3.5} direction="z" />
      
      {/* Main streets */}
      <Street x={0} z={-30} length={60} width={2.5} direction="x" />
      <Street x={30} z={0} length={60} width={2.5} direction="z" />
      <Street x={-30} z={0} length={60} width={2.5} direction="z" />
      <Street x={0} z={30} length={60} width={2.5} direction="x" />
      
      {/* Secondary streets */}
      <Street x={-20} z={0} length={50} width={1.8} direction="z" />
      <Street x={20} z={0} length={50} width={1.8} direction="z" />
      <Street x={0} z={-20} length={50} width={1.8} direction="x" />
      <Street x={0} z={20} length={50} width={1.8} direction="x" />
      
      {/* Diagonal connector roads */}
      <Street x={-30} z={-30} length={84.8} width={2.0} direction="x" />
      <Street x={30} z={30} length={84.8} width={2.0} direction="x" />
      
      {/* Additional ring roads */}
      <Street x={-50} z={0} length={100} width={2.0} direction="z" />
      <Street x={50} z={0} length={100} width={2.0} direction="z" />
      <Street x={0} z={-50} length={100} width={2.0} direction="x" />
      <Street x={0} z={50} length={100} width={2.0} direction="x" />
      
      {/* Vehicles on roads */}
      <Vehicle pathIndex={0} vehicleType="car" />
      <Vehicle pathIndex={1} vehicleType="truck" />
      <Vehicle pathIndex={2} vehicleType="car" />
      <Vehicle pathIndex={0} vehicleType="truck" />
      <Vehicle pathIndex={1} vehicleType="car" />
      <Vehicle pathIndex={2} vehicleType="truck" />
      <Vehicle pathIndex={0} vehicleType="car" />
      <Vehicle pathIndex={1} vehicleType="car" />
      
      {/* Parks/green areas */}
      <ParkArea x={-35} z={-35} width={10} depth={10} />
      <ParkArea x={35} z={35} width={10} depth={10} />
      <ParkArea x={-35} z={35} width={8} depth={8} />
      <ParkArea x={35} z={-35} width={8} depth={8} />
      
      {/* Northwest quadrant buildings */}
      <CityBuilding x={-45} z={-45} width={4} depth={3.5} height={2.8} color={buildingColors[0]} />
      <CityBuilding x={-45} z={-37} width={3.5} depth={3} height={2.2} color={buildingColors[1]} />
      <CityBuilding x={-38} z={-45} width={3.8} depth={3.8} height={2.5} color={buildingColors[2]} />
      <CityBuilding x={-38} z={-37} width={3} depth={3} height={2.0} color={buildingColors[3]} />
      
      {/* Northeast quadrant buildings */}
      <CityBuilding x={45} z={-45} width={4} depth={3.5} height={2.6} color={buildingColors[0]} />
      <CityBuilding x={45} z={-37} width={3.5} depth={3} height={2.3} color={buildingColors[1]} />
      <CityBuilding x={38} z={-45} width={3.8} depth={3.8} height={2.4} color={buildingColors[2]} />
      <CityBuilding x={38} z={-37} width={3} depth={3} height={2.1} color={buildingColors[3]} />
      
      {/* Southwest quadrant buildings */}
      <CityBuilding x={-45} z={45} width={4} depth={3.5} height={2.7} color={buildingColors[0]} />
      <CityBuilding x={-45} z={37} width={3.5} depth={3} height={2.2} color={buildingColors[1]} />
      <CityBuilding x={-38} z={45} width={3.8} depth={3.8} height={2.5} color={buildingColors[2]} />
      <CityBuilding x={-38} z={37} width={3} depth={3} height={2.0} color={buildingColors[3]} />
      
      {/* Southeast quadrant buildings */}
      <CityBuilding x={45} z={45} width={4} depth={3.5} height={2.6} color={buildingColors[4]} />
      <CityBuilding x={45} z={37} width={3.5} depth={3} height={2.4} color={buildingColors[0]} />
      <CityBuilding x={38} z={45} width={3.8} depth={3.8} height={2.3} color={buildingColors[1]} />
      <CityBuilding x={38} z={37} width={3} depth={3} height={2.2} color={buildingColors[2]} />
      
      {/* Inner ring buildings - closer to factory */}
      <CityBuilding x={-28} z={-28} width={3.5} depth={3} height={2.0} color={buildingColors[3]} />
      <CityBuilding x={28} z={-28} width={3.5} depth={3} height={2.0} color={buildingColors[1]} />
      <CityBuilding x={-28} z={28} width={3.5} depth={3} height={2.0} color={buildingColors[4]} />
      <CityBuilding x={28} z={28} width={3.5} depth={3} height={2.0} color={buildingColors[0]} />
      
      {/* Additional scattered buildings */}
      <CityBuilding x={-52} z={0} width={3} depth={3} height={2.2} color={buildingColors[2]} />
      <CityBuilding x={52} z={0} width={3} depth={3} height={2.1} color={buildingColors[3]} />
      <CityBuilding x={0} z={-52} width={3} depth={3} height={2.3} color={buildingColors[1]} />
      <CityBuilding x={0} z={52} width={3} depth={3} height={2.0} color={buildingColors[4]} />
      
      {/* Street lamps */}
      {[-40, -20, 0, 20, 40].map((x, i) =>
        [-40, -20, 0, 20, 40].map((z, j) => (
          <StreetLamp key={`lamp-${i}-${j}`} x={x} z={z} />
        ))
      )}
    </group>
  )
}

// Side annex building - INDUSTRIAL GRAY
function Annex({ x, z, w = 3, h = 2, d = 2.2 }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.75} metalness={0.5} />
      </mesh>
      
      {/* Door */}
      <mesh position={[0, h * 0.35, d / 2 + 0.05]}>
        <boxGeometry args={[w * 0.3, h * 0.7, 0.08]} />
        <meshStandardMaterial color="#884400" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Windows */}
      {[-w * 0.3, 0, w * 0.3].map((wx, i) => (
        <mesh key={`annex-win-${i}`} position={[wx, h * 0.6, d / 2 + 0.05]}>
          <planeGeometry args={[w * 0.15, h * 0.35]} />
          <meshStandardMaterial color="#0088cc" emissive="#0088cc" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Roof */}
      <mesh position={[0, h, 0]}>
        <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
        <meshStandardMaterial color="#663300" roughness={0.9} metalness={0.2} />
      </mesh>
    </group>
  )
}

export default function FactoryModel({ isSimulating }) {
  const lightRef = useRef()
  const alertLightsRef = useRef([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (lightRef.current) {
      lightRef.current.intensity = isSimulating
        ? 1.2 + Math.abs(Math.sin(t * 6)) * 1.5
        : 0.4
    }
    alertLightsRef.current.forEach((m, i) => {
      if (m) {
        m.material.emissiveIntensity = isSimulating
          ? 1.5 + Math.abs(Math.sin(t * 5 + i)) * 3
          : 1.2
      }
    })
  })

  return (
    <group position={[0, 0, 0]}>
      <MainBuilding scale={2.0} />

      {/* Annex buildings - larger */}
      <Annex x={-10} z={0}   w={5.5} h={6.3} d={4.5} />
      <Annex x={9.5}  z={2} w={4.2} h={5.0} d={3.75} />
      <Annex x={-10} z={7} w={3.75} h={4.0} d={3.3} />

      {/* Flare stacks */}
      <FlareStack x={8.5}  z={-5.5} />
      <FlareStack x={-11} z={-4.0} />
      
      {/* Cooling towers - dramatic industrial elements */}
      <CoolingTower x={-12.5} z={-8.0} />
      <CoolingTower x={-12.5} z={-2.5} />
      <CoolingTower x={12.0} z={-6.5} />
      <CoolingTower x={12.0} z={0.5} />
      
      {/* DISTILLATION COLUMNS - Process equipment */}
      <DistillationColumn x={-6.5} z={-6.0} height={8.0} radius={0.4} />
      <DistillationColumn x={-2.2} z={-7.5} height={9.5} radius={0.38} />
      <DistillationColumn x={5.0} z={-8.0} height={8.5} radius={0.42} />
      <DistillationColumn x={9.5} z={-3.5} height={7.8} radius={0.35} />
      
      {/* SPHERICAL PRESSURE VESSELS - Storage */}
      <SphericalTank x={-14.0} z={3.5} radius={1.4} />
      <SphericalTank x={-14.0} z={6.5} radius={1.2} />
      <SphericalTank x={14.5} z={-0.5} radius={1.3} />
      <SphericalTank x={15.0} z={3.5} radius={1.1} />
      
      {/* HEAT EXCHANGERS - Temperature control */}
      <HeatExchanger x={-3.5} z={-4.5} />
      <HeatExchanger x={1.5} z={-5.8} />
      <HeatExchanger x={11.0} z={-1.0} />
      
      {/* SEPARATOR TANKS - Chemical processing */}
      <SeparatorTank x={-8.0} z={4.5} w={2.0} h={2.8} d={1.2} />
      <SeparatorTank x={6.0} z={5.0} w={1.8} h={2.5} d={1.0} />
      <SeparatorTank x={-0.5} z={6.5} w={2.2} h={3.0} d={1.3} />

      {/* Storage tanks cluster - much larger */}
      <Tank x={-8.5} z={-3.5} r={1.3} h={2.8} />
      <Tank x={-8.5} z={ 0.3} r={1.15} h={2.3} />
      <Tank x={-10} z={-1.5} r={0.95} h={2.0} />
      <Tank x={-6.5} z={-4.8} r={0.80} h={1.7} />
      <Tank x={ 8.5} z={-2.5} r={1.0} h={2.2} />
      <Tank x={ 10} z={ 0.8} r={0.80} h={1.9} />

      {/* Pipework network - EXTENSIVE INDUSTRIAL NETWORK */}
      {/* Main feed lines */}
      <Pipe from={[-6.0, 1.2, -3.0]} to={[-1.8, 1.2, -1.2]} r={0.08} />
      <Pipe from={[-6.0, 1.2,  0.3]} to={[-1.8, 1.2,  0.45]} r={0.075} />
      <Pipe from={[-8.5, 2.8, -3.5]} to={[-8.5, 2.8,  0.3]} r={0.06} />
      <Pipe from={[-8.5, 2.8, -3.5]} to={[-6.5, 2.8, -3.5]} r={0.06} />
      <Pipe from={[ 6.0, 1.2, -2.3]} to={[ 2.2, 1.2, -0.75]} r={0.075} />
      <Pipe from={[-1.8, 3.6, -1.2]} to={[ 2.2, 3.6, -0.75]} r={0.075} />
      
      {/* To/from distillation columns */}
      <Pipe from={[-6.5, 0.8, -6.0]} to={[-6.5, 5.0, -6.0]} r={0.065} />
      <Pipe from={[-2.2, 0.8, -7.5]} to={[-2.2, 6.5, -7.5]} r={0.065} />
      <Pipe from={[5.0, 0.8, -8.0]} to={[5.0, 5.8, -8.0]} r={0.065} />
      <Pipe from={[9.5, 0.8, -3.5]} to={[9.5, 4.8, -3.5]} r={0.06} />
      
      {/* Heat exchanger connections */}
      <Pipe from={[-3.5, 1.2, -4.5]} to={[-3.5, 2.8, -4.5]} r={0.06} />
      <Pipe from={[1.5, 1.2, -5.8]} to={[1.5, 2.8, -5.8]} r={0.055} />
      <Pipe from={[11.0, 1.2, -1.0]} to={[11.0, 2.8, -1.0]} r={0.06} />
      
      {/* Separator tank lines */}
      <Pipe from={[-8.0, 1.2, 4.5]} to={[-8.0, 3.2, 4.5]} r={0.065} />
      <Pipe from={[6.0, 1.2, 5.0]} to={[6.0, 3.0, 5.0]} r={0.06} />
      <Pipe from={[-0.5, 1.2, 6.5]} to={[-0.5, 3.5, 6.5]} r={0.065} />
      
      {/* Spherical tank connections */}
      <Pipe from={[-14.0, 0.8, 3.5]} to={[-14.0, 3.2, 3.5]} r={0.07} />
      <Pipe from={[-14.0, 0.8, 6.5]} to={[-14.0, 3.0, 6.5]} r={0.065} />
      <Pipe from={[14.5, 0.8, -0.5]} to={[14.5, 3.2, -0.5]} r={0.065} />
      <Pipe from={[15.0, 0.8, 3.5]} to={[15.0, 2.8, 3.5]} r={0.06} />
      
      {/* Cross-connections between units */}
      <Pipe from={[-3.5, 1.5, -4.5]} to={[-2.2, 1.5, -7.5]} r={0.055} />
      <Pipe from={[1.5, 1.5, -5.8]} to={[5.0, 1.5, -8.0]} r={0.055} />
      <Pipe from={[-6.5, 1.5, -6.0]} to={[-8.0, 1.5, 4.5]} r={0.05} />
      <Pipe from={[9.5, 1.5, -3.5]} to={[11.0, 1.5, -1.0]} r={0.05} />
      
      {/* Main utility lines running across facility */}
      <Pipe from={[-14.0, 2.5, 0]} to={[16.0, 2.5, 0]} r={0.08} />
      <Pipe from={[-14.0, 1.0, -10.0]} to={[16.0, 1.0, -10.0]} r={0.075} />

      {/* Connecting bridge between main and annex */}
      <mesh position={[-5.7, 4.2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.15, 1.2]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.8} metalness={0.7} />
      </mesh>
      
      {/* REACTORS - Pressurized vessels with multiple inlet/outlet ports */}
      {/* Main reactor cluster */}
      {[-5.0, 3.5, 9.5].map((x, i) => (
        <mesh key={`reactor-${i}`} position={[x, 1.8, 1.5]} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 3.6, 20]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.8} />
        </mesh>
      ))}
      
      {/* Reactor caps */}
      {[-5.0, 3.5, 9.5].map((x, i) => (
        <mesh key={`reactor-cap-${i}`} position={[x, 3.6, 1.5]}>
          <sphereGeometry args={[0.7, 16, 12]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.75} metalness={0.75} />
        </mesh>
      ))}
      
      {/* Pump/Compressor units */}
      <mesh position={[1.8, 0.9, -4.0]} castShadow>
        <boxGeometry args={[1.2, 1.8, 0.8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.75} />
      </mesh>
      <mesh position={[-2.5, 0.9, 8.0]} castShadow>
        <boxGeometry args={[1.0, 1.6, 0.75]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.75} />
      </mesh>
      
      {/* Pump motor mounts */}
      {[1.8, -2.5].map((x, i) => (
        <mesh key={`pump-motor-${i}`} position={[x, 2.0, i === 0 ? -4.0 : 8.0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.8, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.85} metalness={0.7} />
        </mesh>
      ))}
      
      {/* Manifold block - Central distribution */}
      <mesh position={[0, 1.2, -2.0]} castShadow>
        <boxGeometry args={[2.2, 1.0, 1.5]} />
        <meshStandardMaterial color="#884400" roughness={0.8} metalness={0.85} />
      </mesh>
      
      {/* Multiple valve ports on manifold */}
      {[-0.8, 0, 0.8].map((offset, i) => (
        <mesh key={`valve-${i}`} position={[offset, 1.8, -2.0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 6]} />
          <meshStandardMaterial color="#ff8800" roughness={0.7} metalness={0.9} />
        </mesh>
      ))}
      
      {/* Electrical transformer substation */}
      <mesh position={[13.0, 1.0, 6.5]} castShadow>
        <boxGeometry args={[2.0, 2.2, 1.8]} />
        <meshStandardMaterial color="#663300" roughness={0.85} metalness={0.65} />
      </mesh>
      
      {/* Transformer cooling radiators */}
      {[0.5, -0.5].map((offset, i) => (
        <mesh key={`radiator-${i}`} position={[13.0 + offset, 1.8, 7.5]} castShadow>
          <boxGeometry args={[0.3, 1.5, 0.15]} />
          <meshStandardMaterial color="#ff8800" roughness={0.6} metalness={0.8} />
        </mesh>
      ))}
      
      {/* High voltage insulators */}
      {[12.0, 14.0].map((x, i) => (
        <mesh key={`insulator-${i}`} position={[x, 3.2, 6.5]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
          <meshStandardMaterial color="#cccccc" roughness={0.4} metalness={0.3} emissive="#888888" emissiveIntensity={0.3} />
        </mesh>
      ))}
      
      {/* Gantry crane support beams */}
      <mesh position={[0, 7.0, -9.0]} castShadow>
        <boxGeometry args={[30, 0.4, 0.4]} />
        <meshStandardMaterial color="#663300" roughness={0.8} metalness={0.75} />
      </mesh>
      <mesh position={[-15, 7.0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 18]} />
        <meshStandardMaterial color="#663300" roughness={0.8} metalness={0.75} />
      </mesh>
      <mesh position={[15, 7.0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 18]} />
        <meshStandardMaterial color="#663300" roughness={0.8} metalness={0.75} />
      </mesh>

      {/* Alert light */}
      <pointLight
        ref={lightRef}
        position={[0, 6.5, 0]}
        color="#ff4400"
        intensity={0.4}
        distance={18}
        decay={2}
      />

      {/* Factory floor - larger CONCRETE GRAY */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[35, 0.02, 20]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.95} metalness={0.1} />
      </mesh>
      
      {/* Ground divider lines */}
      <mesh position={[0, 0.001, -8]} receiveShadow>
        <boxGeometry args={[35, 0.01, 0.15]} />
        <meshStandardMaterial color="#3a3a3a" roughness={1.0} />
      </mesh>
      
      {/* WORKERS IN FACTORY */}
      <Workers />
      
      {/* CITY SURROUNDING FACTORY */}
      <City />
    </group>
  )
}
