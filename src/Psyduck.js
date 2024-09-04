import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three';

function Psyduck() {
  const gltf = useLoader(GLTFLoader, '/models/psyduck-anim1.glb');
  console.log(gltf.animations, '<< animations');

  const mixer = useRef(null);
  useEffect(() => {
    if (gltf.animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(gltf.scene);

      // Play the first animation (index 0)
      const action = mixer.current.clipAction(gltf.animations[0]);
      action.play();
    }
  }, [gltf]);

  // Update the animation mixer on each frame
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });


  return <primitive object={gltf.scene} />
}

export default Psyduck;

