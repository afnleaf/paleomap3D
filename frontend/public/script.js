// import from the server whatever is needed, just add the route
import mapNames from "./maps.js";

// global render
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// global cam
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// set cam default
camera.position.set(2.1947505764760233, -1.8200564599467817, 1.7229850186341116);
camera.rotation.set(0.8127890828467345, 0.7192327649925704, 0.5026356479842529);
camera.up.set(-0.6433751963742183, 0.595381764123396, 0.4812368560696019);

// global scene
const scene = new THREE.Scene();

// space background
const cubeLoader = new THREE.CubeTextureLoader();
// had to adjust sun position from "bottom"
const textureCube = cubeLoader.load( [
    "front.png", "back.png",
	"top.png", "bottom.png",
    "right.png", "left.png"
] );
scene.background = textureCube;

// do this once
const textureLoader = new THREE.TextureLoader();
const icogeo = new THREE.IcosahedronGeometry(1, 16);

render();

// global controls
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.enable = true;
controls.minDistance = 0;
controls.maxDistance = 100;
//controls.enableDamping = true;
//controls.dampingFactor = 0.1;
controls.staticMoving = true;
controls.zoomSpeed = 0.9;

// for swapping between map sizes
let mapSize = "small";

// create default scene
await createSceneFromTexture(0, mapSize)
    .then(() => {
        // do this once
        renderZenithPoles();
        renderInnerEarth();
    })
    .catch((error) => {
        console.error("Error: ", error);
    });

// get the map at slider index
async function handleMapChange() {
    // index to get with using absolute value
    // some conditions for improved slider visuals
    let index = getMapIndex(slider.value);
    if(index != null) {
        // change map title
        const mapTitleElement = document.getElementById("title");
        mapTitleElement.innerHTML = mapNames[index].replace(/\n/g, "<br>");
        // allocate new scene
        await createSceneFromTexture(index, mapSize);
        // free old map for memory optimization
        unloadPreviousMap();
    }
}

// slider inverted, so use absolute value
function getMapIndex(value) {
    if(value <= 0 && value >= -108){
        return Math.abs(value)
    } else {
        return null;
    }
}

// make path then build earth mesh
async function createSceneFromTexture(index, size) {
    const texturePath = `/${size}texture${index}`;
    //await renderTools();
    await renderOuterEarthFromTexture(texturePath);
}

// render visual helpers
async function renderTools() {
    const axesHelper = new THREE.AxesHelper( 5 );
    //console.log(axesHelper)
    scene.add(axesHelper);
}

// render the earth by mapping a texture to the previously created icosahedron
async function renderOuterEarthFromTexture(textureURL) {
    return new Promise((resolve, reject) => {
        textureLoader.load(textureURL, (texture) => {
            const mat = new THREE.MeshBasicMaterial({
                map: texture
            });
            const earth = new THREE.Mesh(icogeo, mat);
            earth.rotation.x = Math.PI / 2;
            scene.add(earth);
            resolve();
        }, undefined, reject);
    });
}

// render north and south poles aka the zenith axis
async function renderZenithPoles() {
    const northGeo = new THREE.BufferGeometry();
    const northVertices = new Float32Array([
        0, 0, 0,  // Start of the line (origin)
        0, 0, 1.2  // End of the line (along the z-axis)
    ]);
    northGeo.setAttribute("position", new THREE.BufferAttribute(northVertices, 3));
    const northMat = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const north = new THREE.Line(northGeo, northMat);
    scene.add(north);

    const southGeo = new THREE.BufferGeometry();
    const southVertices = new Float32Array([
        0, 0, -1.2,  // Start of the line (origin)
        0, 0, 0,  // End of the line (along the z-axis)
    ]);
    southGeo.setAttribute("position", new THREE.BufferAttribute(southVertices, 3));
    const southMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const south = new THREE.Line(southGeo, southMat);
    scene.add(south);
}

// render da deep core
async function renderInnerEarth() {
    let geo;
    let mat;

    // inner core
    geo = new THREE.IcosahedronGeometry(0.375, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
    });
    const innercore = new THREE.Mesh(geo, mat);
    scene.add(innercore);

    // outer core
    geo = new THREE.IcosahedronGeometry(0.625, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0xf69f31,
    });
    const outercore = new THREE.Mesh(geo, mat);
    scene.add(outercore);

    // mantle
    geo = new THREE.IcosahedronGeometry(0.925, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0xe76c2f,
    });
    const mantle = new THREE.Mesh(geo, mat);
    scene.add(mantle);

    // crust
    geo = new THREE.IcosahedronGeometry(0.9875, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0x75381a,
    });
    const crust = new THREE.Mesh(geo, mat);
    scene.add(crust);
}

// unload 2nd last map from the scene
function unloadPreviousMap() {
    let n = scene.children.length;
    if(n < 2) {
        return;
    }
    scene.remove(scene.children[n-2]);
}

// render the scene with the rendering renderer
function render() {
    renderer.render(scene, camera)
}

// animate the scene lel
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

animate();

// event listeners at the bottom because of async issues

// toggle for map size
// Get the checkbox element
const checkbox = document.querySelector("input[type='checkbox']");
// access the slider element to create new scenes
const slider = document.getElementById("myRange");

if(checkbox && slider) {
    // add an event listener to detect changes in the checkbox state
    checkbox.addEventListener("change", (event) => {
        // check if the checkbox is checked
        if (event.target.checked) {
            mapSize = "large";
        } else {
            mapSize = "small";
        }
        handleMapChange();
    });

    // if the slider is used
    slider.addEventListener("input", () => {
        handleMapChange();
    });

    // for keypresses to change the slider value
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            slider.value = parseInt(slider.value) + 1;
            handleMapChange();
        } else if (event.key === "ArrowLeft") {
            slider.value = parseInt(slider.value) - 1;
            handleMapChange();
        }
    });
} else {
    console.error("Input elements not found");
}

// to update scene as user adjusts it
window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.setSize(w, h);
    render();
});
