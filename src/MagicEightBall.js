import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

function MagicEightBall () {
  const gltf = useLoader(GLTFLoader, '/models/8ball.glb');
  const mixer = useRef(null);
  useEffect(() => {
    mixer.current = new THREE.AnimationMixer(gltf.scene);
    const shakeBallAnimation = gltf.animations[0];
    const shakeGlassAnimation = gltf.animations[1];
    const shakeBallAction = mixer.current.clipAction(shakeBallAnimation);
    const shakeGlassAction = mixer.current.clipAction(shakeGlassAnimation);
    window.shake = () => {
      shakeBallAction.play();
      shakeGlassAction.play();
    }
    window.stopShake = () => {
      shakeBallAction.reset();
      shakeGlassAction.reset();
      shakeBallAction.stop();
      shakeGlassAction.stop();
    };
  }, [gltf]);

  useEffect(() => {
    let stopShakeTimer;
    window.addEventListener('devicemotion', event => {
      if ((event.rotationRate.alpha > 256 || event.rotationRate.beta > 256 || event.rotationRate.gamma > 256)) {
        if (stopShakeTimer) {
          clearTimeout(stopShakeTimer);
        }
        window.shake();

        document.getElementById('dbg-text').innerHTML = 'Shaking!';

        stopShakeTimer = setTimeout(() => {
          window.stopShake();
          document.getElementById('dbg-text').innerHTML = 'Not shaking!';
        }, 2000);
      }
    });
  })

  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });
  return <primitive object={gltf.scene}/>
}

export default MagicEightBall;