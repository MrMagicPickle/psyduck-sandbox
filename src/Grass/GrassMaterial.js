import * as THREE from 'three';
import { useEffect } from 'react';
import { extend } from '@react-three/fiber';

const MyShaderMaterial = {
  uniforms: {
    ...THREE.ShaderLib.standard.uniforms,
    time: { value: 0 },
  },
  vertexShader: `
    uniform float time;
    void main() {
      vec3 pos = position;
      pos.y += sin(pos.x * 1.0 + time) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    ${THREE.ShaderLib.standard.fragmentShader}
  `,
};

extend({ MyShaderMaterial });

export default MyShaderMaterial;