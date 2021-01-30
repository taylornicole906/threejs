import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import CANNON, { Material } from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'


/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//fog
const fog = new THREE.Fog('#48cae4', .01, 80)
scene.fog = fog


/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let fox = new THREE.Object3D();
let truck = new THREE.Object3D();

gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    (gltf) =>
    {
        fox = gltf.scene;
  
        fox.scale.set(.01, .01, .01)
        fox.position.set(-5,0,0)
        fox.rotation.y = Math.PI /4
        scene.add(fox)
        // Animation
        mixer = new THREE.AnimationMixer(fox)
        const action = mixer.clipAction(gltf.animations[0])
        action.play()
    }
)

gltfLoader.load(
    '/models/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf',
    (gltf) =>
    {
        truck = gltf.scene;
  
        truck.scale.set(.3, .3, .3)
        truck.position.set(-20,0,6.5)
        truck.rotation.y = Math.PI / 2
        scene.add(truck)

    }
)


/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const doorColorTexture = textureLoader.load('/textures/door/color.jpg')
const doorAlphaTexture = textureLoader.load('/textures/door/alpha.jpg')
const doorAmbientOcclusionTexture = textureLoader.load('/textures/door/ambientOcclusion.jpg')
const doorHeightTexture = textureLoader.load('/textures/door/height.jpg')
const doorNormalTexture = textureLoader.load('/textures/door/normal.jpg')
const doorMetalnessTexture = textureLoader.load('/textures/door/metalness.jpg')
const doorRoughnessTexture = textureLoader.load('/textures/door/roughness.jpg')
const bricksColorTexture = textureLoader.load('/textures/bricks/color.jpg')
const bricksAmbientOcclusionTexture = textureLoader.load('/textures/bricks/ambientOcclusion.jpg')
const bricksNormalTexture = textureLoader.load('/textures/bricks/normal.jpg')
const bricksRoughnessTexture = textureLoader.load('/textures/bricks/roughness.jpg')

const topLeft = new THREE.Color(0x00ffff)
const topRight = new THREE.Color(0xffffff)
const bottomRight = new THREE.Color(0xff00ff)
const bottomLeft = new THREE.Color(0x0000ff)


const data = new Uint8Array([
    Math.round(bottomLeft.r * 255), Math.round(bottomLeft.g * 255), Math.round(bottomLeft.b * 255),
    Math.round(bottomRight.r * 255), Math.round(bottomRight.g * 255), Math.round(bottomRight.b * 255),
    Math.round(topLeft.r * 255), Math.round(topLeft.g * 255), Math.round(topLeft.b * 255),
    Math.round(topRight.r * 255), Math.round(topRight.g * 255), Math.round(topRight.b * 255)
])

const backgroundTexture = new THREE.DataTexture(data, 2, 2, THREE.RGBFormat)
backgroundTexture.magFilter = THREE.LinearFilter
backgroundTexture.needsUpdate = true

//physics////////////************************************************************ */

//phys world
const world = new CANNON.World()
world.gravity.set(0,-9.8,0)
world.allowSleep = true //improves performance

//materials
const defaultMaterial = new CANNON.Material('defaultMaterial') 
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)
world.addContactMaterial(defaultContactMaterial)//now we dont need to add materials to every body
world.defaultContactMaterial = defaultContactMaterial


//Physics floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0 //makes it so nothing can move it
floorBody.addShape(floorShape);  //can add multiple shapes to single body
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
)
world.addBody(floorBody)

/**
 * House
 */
const house = new THREE.Group();
scene.add(house);
//walls
const walls = new THREE.Mesh(
    new THREE.BoxBufferGeometry(4,2.5,4),
    new THREE.MeshStandardMaterial({
        color: '#fec5bb',
        aoMap: bricksAmbientOcclusionTexture,
        normalMap: bricksNormalTexture,
        roughnessMap: bricksRoughnessTexture
    })
)
walls.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(walls.geometry.attributes.uv.array, 2))
walls.position.y = 2.5/2
house.add(walls)

const roof = new THREE.Mesh(
    new THREE.ConeBufferGeometry(3.5,1,4),
    new THREE.MeshStandardMaterial({ color: '#fec5bb'})
)
roof.position.y = 2.5 + 0.5
roof.rotation.y = Math.PI/4
house.add(roof)

//Door 
const door = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2,2,2,100),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.1,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture
    })
)
door.geometry.setAttribute(
    'uv2',
    new THREE.Float32BufferAttribute(door.geometry.attributes.uv.array, 2)

)
door.position.z = 2 + .01
door.position.y = 1
house.add(door)
//trees
const tree1 = new THREE.Group();
const tree2 = new THREE.Group();
scene.add(tree1, tree2)


//stem
const stem = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(.15,.15,3),
    new THREE.MeshStandardMaterial({color: 'brown'}
    )
)
stem.position.set(4,0,1)
tree1.add(stem)

const leaves = new THREE.Mesh(
    new THREE.SphereBufferGeometry(1),
    new THREE.MeshStandardMaterial({color: '#70e000'})
)
leaves.position.set(4,2,1)
tree1.add(leaves)

//bush 
const bushGeometry = new THREE.SphereBufferGeometry(1,16,16)
const bushMaterial = new THREE.MeshStandardMaterial({color: '#70e000'})

const bush1 = new THREE.Mesh(bushGeometry, bushMaterial)
bush1.scale.set(0.5,0.5,0.5)
bush1.position.set(0.8,0.2,2.2)

const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
bush2.scale.set(0.2,0.2,0.2)
bush2.position.set(1.4,0.2,2.2)
const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
bush3.scale.set(0.45,0.45,0.45)
bush3.position.set(-1.1, 0.2,2.2)

const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
bush4.scale.set(0.3,0.3,0.3)
bush4.position.set(-1.5,0.2,2.2)

const bush5 = new THREE.Mesh(bushGeometry, bushMaterial);
bush5.scale.set(0.2,0.2,0.2)
bush5.position.set(-.6,0.1,2.2)

const bush6 = new THREE.Mesh(bushGeometry, bushMaterial);
bush6.scale.set(0.3,0.3,0.3)
bush6.position.set(1,0.1,2.5)

const bush7 = new THREE.Mesh(bushGeometry, bushMaterial);
bush7.scale.set(0.15,0.15,0.15)
bush7.position.set(-1,0.1,2.6)
house.add(bush1, bush2, bush3,bush4 , bush5, bush6, bush7)

// Floor

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        map: backgroundTexture
        
    })
)

floor.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2))
floor.rotation.x = - Math.PI * 0.5
floor.position.y = 0
scene.add(floor)

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#ffffff', 0.6)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight('#ffffff', 0.5)
moonLight.position.set(5, 5, 2)
gui.add(moonLight, 'intensity').min(0).max(1).step(0.001)
gui.add(moonLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'z').min(- 5).max(5).step(0.001)
scene.add(moonLight)

//door light
const doorLight = new THREE.PointLight('#ffffff', 1, 2.5)
doorLight.position.set(0,2.2,2.7)
scene.add(doorLight)

//wall light
const wallLight1 = new THREE.PointLight('#ffffff', 1, 1)
wallLight1.position.set(2,2.25,2.7)
scene.add(wallLight1)

const wallLight2 = new THREE.PointLight('#ffffff', 1, 2.5)
wallLight2.position.set(-3.5,2.25,2.7)
scene.add(wallLight2)

/**
 * moving lights
 */
const ghost1 = new THREE.PointLight('#ffb4a2', 2, 3)
scene.add(ghost1)

const ghost2 = new THREE.PointLight('#ffb4a2', 2, 3)
scene.add(ghost2)

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
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 4
camera.position.z = 17
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#90e0ef')


//shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
moonLight.castShadow = true
doorLight.castShadow = true
walls.castShadow = true
bush1.castShadow = true
bush2.castShadow = true
bush3.castShadow = true
bush4.castShadow = true
floor.receiveShadow = true

//Utils
const objectsToUpdate = []

const createSphere = (radius, position) =>
{
    //three.js mesh
    const mesh = new THREE.Mesh(
        new THREE.SphereBufferGeometry(radius,20,20),
        new THREE.MeshStandardMaterial({
            map: backgroundTexture,
            metalness: 0,
            roughness: 0.4
        })

    )
    mesh.castShadow = true;
    mesh.position.copy(position)
    scene.add(mesh);

    //cannon js body
    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0,3,0),
        shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    world.addBody(body)

    //save in objects to update
    objectsToUpdate.push({
        mesh: mesh,
        body: body
    })
}

createSphere(0.5, {x: 8, y: 9, z: 0})


/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0;
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime
    
    //update phys world
    world.step(1/60,deltaTime,3);
    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position);

    }

    //update three js sphere to correspond w physics body
    //sphere.position.copy(sphereBody.position) 
    if(mixer)
    {
        mixer.update(deltaTime)
    }
    truck.position.x = -9 + elapsedTime*2
    // Ghosts
    const ghost1Angle = elapsedTime * .03
    ghost1.position.x = Math.cos(ghost1Angle) * 2
    ghost1.position.z = Math.sin(ghost1Angle) * 2
    ghost1.position.y = Math.sin(elapsedTime * 2)

    const ghost2Angle = - elapsedTime * .03
    ghost2.position.x = Math.cos(ghost2Angle) * 1.5
    ghost2.position.z = Math.sin(ghost2Angle) * 1.5
    ghost2.position.y = Math.sin(elapsedTime * 1) + Math.sin(elapsedTime * 2.5)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()