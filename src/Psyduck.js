import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three';
import { useHelper } from '@react-three/drei';
import { initInputController } from './InputController';

const updateModelPosition = (model, timeInSeconds) => {
  /* Manage velocity */

  // const acceleration = new THREE.Vector3(1, 0.25, 50.0);
  const acceleration = new THREE.Vector3(1, 0.25, 250.0);

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

  if (!model.current) {
    return;
  }
}

function Psyduck() {
  const gltf = useLoader(GLTFLoader, '/models/psyduck-anim6.glb');

  const mixer = useRef(null);
  const action = useRef(null);
  const model = useRef(null);

  const duckModel = gltf.scene;
  const rotation = [0, 0, 0];

  const updateModelAnimation = () => {
    if (!action.current) {
      return;
    }

    if (window.inputForward || window.inputBackward) {
      if (!action.current.walk.isRunning()) {
        action.current.walk.reset();
        action.current.walk.play();
        /* Cross fade from basically fades out the idle animation whilst
         * fading in the walk animation.
         * Fading in seems to gradually increase weightage to 100% on the animation
         * Fading out seems to gradually decrease weightage to 0% on the animation.
         * Because I think an animation mixer assigns a bunch of animations simultaneously.
         * So it kinda stops the old one, whilst fades in the new one by playing with weightages.
         */
        action.current.walk.crossFadeFrom(action.current.idle, 0.5);
      }
      return;
    }
    const oldAction = action.current.walk;
    const newAction = action.current.idle;
    if (!newAction.isRunning()) {
      newAction.reset();
      newAction.play();
      newAction.crossFadeFrom(oldAction, 0.5);
    }
  }

  useEffect(() => {

    if (gltf.animations.length > 0) {
      // mixer.current = new THREE.AnimationMixer(gltf.scene);
      mixer.current = new THREE.AnimationMixer(duckModel);
      // Play the first animation (index 0)
      // mixer.current.timeScale = 1.5;

      const walkAnimation = gltf.animations.find(animation => animation.name === 'walk');
      const idleAnimation = gltf.animations.find(animation => animation.name === 'idle');
      console.log(walkAnimation, '<< walk animation');
      // action.current = mixer.current.clipAction(walkAnimation);
      action.current = {
        walk: mixer.current.clipAction(walkAnimation),
        idle: mixer.current.clipAction(idleAnimation),
      };
      action.current.walk.play();
    }

    // Assign key listeners
    initInputController();
  }, [gltf]);

  // Update the animation mixer on each frame
  useFrame((state, delta) => {
    if (mixer.current) {
      updateModelAnimation();
      mixer.current.update(delta);
    }

    const time = state.clock.getElapsedTime();

    if (model.current) {
      updateModelPosition(model.current, delta);
    }

  });

  useHelper(model, THREE.BoxHelper, 'cyan');

  return <primitive
    ref={model}
    object={duckModel}
    position={[0, 0, 0]}
    rotation={rotation}
    name="Player" // Grass looks for this name and adjusts based on this primitive's position
  />
}

export default Psyduck;

