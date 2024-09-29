import { Plane, shaderMaterial } from "@react-three/drei"
import { extend, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const vertexShader = `
  #include <common>
  varying vec3 vWorldPosition;
  uniform float time;
  uniform float bendFactor;
  uniform float bendSegment;
  uniform float windStrength;
  uniform float windFrequency;
  uniform float noiseStrength;
  uniform float noiseScale;
  uniform float playerRadius;
  uniform vec3 playerPosition;
  uniform float interactionStrength;

  // Simple 2D noise function
  vec2 hash( vec2 p ) {
      p = vec2( dot(p,vec2(127.1,311.7)),
                dot(p,vec2(269.5,183.3)) );
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }

  float noise( in vec2 p ) {
      const float K1 = 0.366025404; // (sqrt(3)-1)/2;
      const float K2 = 0.211324865; // (3-sqrt(3))/6;

      vec2 i = floor( p + (p.x+p.y)*K1 );

      vec2 a = p - i + (i.x+i.y)*K2;
      vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0*K2;

      vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

      vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

      return dot( n, vec3(70.0) );
  }

  void main() {
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif

    float bendHeight = mvPosition.y / bendSegment; // Adjust this to set the height at which bending starts
    mvPosition = modelMatrix * mvPosition;
    if(mvPosition.y > bendHeight){

      // Simple wind effect
      float wind = sin(mvPosition.x * 0.05 + time * windFrequency) * windStrength;
      float noiseValue = noise(vec2(mvPosition.x * noiseScale + time * 0.1, mvPosition.z * noiseScale + time * 0.1)) * noiseStrength;

      vec3 pos = playerPosition - mvPosition.xyz;
      float dist = length(pos);
      float playerInfluence = smoothstep(playerRadius * 2.0, playerRadius * 0.5, dist);
      vec3 bendDirection = normalize(pos * vec3(-1.0, 0.0, -1.0));

      vec3 totalOffset = vec3(
          (wind + noiseValue) * bendFactor,
          0.0,
          (wind + noiseValue) * bendFactor
      ) + bendDirection * playerInfluence * interactionStrength;


      // Apply bending
      // mvPosition.x += (mvPosition.y - bendHeight) * bendFactor * (wind + noiseValue);
      // mvPosition.z += (mvPosition.y - bendHeight) * bendFactor * (wind + noiseValue);
      mvPosition.xyz += totalOffset * (mvPosition.y - bendHeight);
    }

    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

    vWorldPosition = mvPosition.xyz;
  }
`

const fragmentShader = `
#include <common>
  varying vec3 vWorldPosition;
  uniform vec3 baseColor;
  uniform vec3 playerPosition;
  void main() {
    vec3 finalColor = mix(vec3(vWorldPosition.y / 10.0), baseColor, 0.3);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const GrassMaterial = shaderMaterial(
  {
    time: 0,
    bendFactor: 10.5,
    bendSegment: 2.0,
    windStrength: 0.05,
    windFrequency: 1.0,
    noiseStrength: 0.05,
    noiseScale: 0.05,
    playerRadius: 10.0,
    playerPosition: new THREE.Vector3(0, 0, 0),
    interactionStrength: 1.0,
    baseColor: new THREE.Color(0, 1, 0)
  },
  vertexShader,
  fragmentShader
)

extend({ GrassMaterial })

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       grassMaterial: Partial<THREE.ShaderMaterial> & { ref: React.MutableRefObject<THREE.ShaderMaterial> }
//     }
//   }
// }

const Grass = ({ worldSize, segment, sampledMesh, density = 5 }) => {
  const grassRef = useRef(null)
  const grassMaterialRef = useRef(null)
  const { scene } = useThree();

  useEffect(() => {
    grassRef.current.frustumCulled = false
    grassRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  }, [])

  useFrame((state) => {
    if (grassMaterialRef.current) {
      grassMaterialRef.current.uniforms.time.value = state.clock.elapsedTime
      const player = scene.getObjectByName("Player")
      if (player) {
        grassMaterialRef.current.uniforms.playerPosition.value = player.position
      }
    }
  })

  useEffect(() => {
    if (sampledMesh) {
      sampledMesh.current.updateMatrixWorld(true)
      sampledMesh.current.geometry.applyMatrix4(sampledMesh.current.matrixWorld)
      sampledMesh.current.applyMatrix4(sampledMesh.current.matrixWorld)
      const sampler = new MeshSurfaceSampler(sampledMesh.current).setWeightAttribute("uv").build()

      const position = new THREE.Vector3()
      const normal = new THREE.Vector3()

      const dummy = new THREE.Object3D()

      for (let i = 0; i < worldSize * density; i++) {
        sampler.sample(position, normal)

        dummy.position.copy(position)
        dummy.lookAt(normal.sub(position))
        dummy.updateMatrix()

        grassRef.current?.setMatrixAt(i, dummy.matrix)
        grassRef.current?.setColorAt(i, new THREE.Color("green"))
      }
      grassRef.current.instanceMatrix.needsUpdate = true
      grassRef.current.instanceColor.needsUpdate = true
      grassRef.current.position.set(0, 5, 0)
    }
  }, [sampledMesh])

  const grass_geometry = useMemo(() => {
    const grass_geometry = new THREE.PlaneGeometry(1, 10, 1, segment)
    const vertices = grass_geometry.attributes.position.array
    vertices[0] = 0
    vertices[1] = 0
    grass_geometry.attributes.position.needsUpdate = true
    return grass_geometry
  }, [])
  return (
    <>
      {/* grass instance */}
      <instancedMesh ref={grassRef} args={[null, null, worldSize * density]} geometry={grass_geometry}>
        <grassMaterial side={THREE.DoubleSide} uniformsNeedUpdate={true} ref={grassMaterialRef} />
      </instancedMesh>
    </>
  )
}


const Scene = ({ worldSize = 100} ) => {
  const groundRef = useRef(null);
  return (
    <>
      <Plane
        ref={groundRef}
        args={[worldSize, worldSize, 100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial attach="material" side={THREE.DoubleSide} color={new THREE.Color(0, 1, 0)} />
      </Plane>
      <Grass worldSize={worldSize} sampledMesh={groundRef} segment={3} density={50} />
    </>
  )
}

export default Scene;