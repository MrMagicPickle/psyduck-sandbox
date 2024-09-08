import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import MyShaderMaterial from "./GrassMaterial";

/**
 *
 * Failed attempt - https://chatgpt.com/c/66dd66f0-0dfc-8003-9cdc-600bc6b704e4
 * I wanted to animate the grass behavior whilst preserving the original material.
 */
function Grass() {
  const gltf = useLoader(GLTFLoader, '/models/grass.glb');
  const timeRef = useRef(0);
  let grasses = [];
  useEffect(() => {

    gltf.scene.traverse((child) => {
      if (child.name.includes('grass')) {
        grasses.push(child);
      }
    });
    console.log(grasses);

    grasses.forEach((grass) => {
      grass.material.onBeforeCompile = (shader) => {
        console.log(shader.vertexShader)
        shader.uniforms.time = MyShaderMaterial.uniforms.time;
        // shader.vertexShader = shader.vertexShader.replace(
        //   '#include <begin_vertex>',
        //   `
        //     vec3 transformed = vec3(position);
        //     transformed.y += sin(transformed.x * 1.0 + time) * 0.1;
        //   `
        // );
        shader.vertexShader = `uniform float time;\n` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          'vWorldPosition = worldPosition.xyz;',
          `
          vWorldPosition = worldPosition.xyz + vec3(0.0, sin(worldPosition.x * 1.0 + time) * 0.1, 0.0);
          `
        );

        console.log('----UPDATED----');
        console.log(shader.vertexShader)
        grass.material.userData.shader = shader;
      }
      return;
    });
  }, [gltf]);

  useFrame(() => {
    if (grasses.length <= 0) {
      return;
    }

    timeRef.current += 0.01;
    grasses.forEach((child) => {
      if (!child.material.userData.shader) {
        return;
      }
      // child.material.userData.shader.uniforms.time.value = timeRef.current;
      console.log(child.material.shader, '<< material');
      child.material.shader.uniforms.time.value = timeRef.current;
    });
  });
  return <primitive object={gltf.scene} />
}
export default Grass;