import './style.css'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg');
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

/**
 * Materials
 */
debugObject.portalColorStart = '#cd62cd';
debugObject.portalColorEnd = '#ffffff';

gui.addColor(debugObject, 'portalColorStart').onChange(() => portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart))
gui.addColor(debugObject, 'portalColorEnd').onChange(() => portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd))

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
const portalLightMaterial = new THREE.RawShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
    }
});
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: '#ffffe5'});


/**
 * Model
 */
gltfLoader.load('portal.glb',
    (gltf) => {
        gltf.scene.traverse((child) => {
            child.material = bakedMaterial;
        });
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked');
        bakedMesh.material = bakedMaterial;
        const poleLightMeshes = gltf.scene.children.filter(child => ['poleLightA', 'poleLightB'].includes(child.name));
        poleLightMeshes.forEach(poleLight => poleLight.material = poleLightMaterial)
        const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight');
        portalLightMesh.material = portalLightMaterial;

        scene.add(gltf.scene);
    }
);

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 3.8;
    positionArray[i * 3 + 1] = Math.random() / 2 + 1;
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 3.8;

    scaleArray[i] = Math.random() + 1;
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));

const firefliesMaterial = new THREE.RawShaderMaterial({
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 40 },
        uTime: { value: 0 }
    },
    // blending: THREE.AdditiveBlending,
    depthWrite: false
});

const firefliesPoints = new THREE.Points(firefliesGeometry, firefliesMaterial);

scene.add(firefliesPoints);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio()
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding;

debugObject.clearColor = '#b4d0ff';
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, 'clearColor').onChange(() => renderer.setClearColor(debugObject.clearColor))
gui.add(firefliesMaterial.uniforms.uSize, 'value').min(1).max(500).name('size');

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update fireflies
    firefliesMaterial.uniforms.uTime.value = elapsedTime;
    portalLightMaterial.uniforms.uTime.value = elapsedTime;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()