import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three';
import { useHelper } from '@react-three/drei';
import { initInputController } from './InputController';

const updateModelPosition = (model, timeInSeconds) => {
  /* Manage velocity */
  const acceleration = new THREE.Vector3(1, 0.25, 50.0);
  const decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
  const velocity = new THREE.Vector3(0, 0, 0);
  const frameDecceleration = new THREE.Vector3(
    velocity.x * decceleration.x,
    velocity.y * decceleration.y,
    velocity.z * decceleration.z
  );
  frameDecceleration.multiplyScalar(timeInSeconds);
  frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
      Math.abs(frameDecceleration.z), Math.abs(velocity.z));

  velocity.add(frameDecceleration);

  const acc = acceleration.clone();

  // Manage changes in speed and rotation
  const controlObject = model;
  const _Q = new THREE.Quaternion();
  const _A = new THREE.Vector3();
  const _R = controlObject.quaternion.clone();

  if (window.inputForward) {
    velocity.z += acc.z * timeInSeconds;
  }
  if (window.inputBackward) {
    velocity.z -= acc.z * timeInSeconds;
  }
  if (window.inputLeft) {
    _A.set(0, 1, 0);
    _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * acceleration.y);
    _R.multiply(_Q);
  }
  if (window.inputRight) {
    _A.set(0, 1, 0);
    _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * acceleration.y);
    _R.multiply(_Q);
  }
  // console.log(_R, '<< R')
  controlObject.quaternion.copy(_R);


  /* Forward */
  const forward = new THREE.Vector3(0, 0, 1);
  forward.applyQuaternion(controlObject.quaternion);
  forward.normalize();
  forward.multiplyScalar(velocity.z * timeInSeconds);


  /* Sideways */
  const sideways = new THREE.Vector3(1, 0, 0);
  sideways.applyQuaternion(controlObject.quaternion);
  sideways.normalize();
  sideways.multiplyScalar(velocity.x * timeInSeconds);

  /* Update control object position */
  controlObject.position.add(forward);
  controlObject.position.add(sideways);

  model.position.copy(controlObject.position);
  // console.log(model.position);
  if (!model.current) {
    return;
  }
  // model.current.position.copy(controlObject.position);


}

function Psyduck() {
  const gltf = useLoader(GLTFLoader, '/models/psyduck-anim5.glb');

  const mixer = useRef(null);
  const action = useRef(null);
  const model = useRef(null);
  console.log(gltf.scene, '<< gltf');
  // const duckModel = gltf.scene.children.find(child => child.name === 'Sketchfab_model');
  const duckModel = gltf.scene;
  // const rotation = [0, 0, -Math.PI / 2];
  // const rotation = [-Math.PI/2, 0, 0];
  const rotation = [0, 0, 0];
  useEffect(() => {

    if (gltf.animations.length > 0) {
      // mixer.current = new THREE.AnimationMixer(gltf.scene);
      mixer.current = new THREE.AnimationMixer(duckModel);
      // Play the first animation (index 0)
      // mixer.current.timeScale = 1.5;
      action.current = mixer.current.clipAction(gltf.animations[0]);
      action.current.play();
    }

    // Assign key listeners
    initInputController();
    // duckModel.current = gltf.scene.children.find(child => child.name === 'Sketchfab_model');
    // console.log(duckModel.current, '<< current');
  }, [gltf]);

  // Update the animation mixer on each frame
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }

    const time = state.clock.getElapsedTime();
    // model.current.position.z = time;
    if (model.current) {
      updateModelPosition(model.current, delta);
    }
  });

  useHelper(model, THREE.BoxHelper, 'cyan');

  useEffect(() => {
    window.action = action;
  }, []);

  return <primitive ref={model} object={duckModel} position={[0, -1, 0]} rotation={rotation}/>
}

export default Psyduck;

