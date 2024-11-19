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
const rotation = Math.PI / 2;

// for gplates
/*
const gtex = textureLoader.load('/fileout.png');
const gmat = new THREE.MeshBasicMaterial({ 
    map: gtex,
    transparent: true,
    //opacity: 0.5,
});
*/
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

// earth layers
// for swapping between map sizes
let mapSize = "small";
// line layers
let plateMode = false;
let borderMode = false;

// variable to keep track of the fetch queue
let fetchFileQueue = Promise.resolve();
// handle map change (debouncing)
let isFetching = false;
let pendingIndex = null;

// do this once
renderZenithPoles();
renderInnerEarth();

// create default scene
//await fetchTextureFile(0, mapSize);
await loadTexturesAndCreateScene(0, mapSize, false, false);
    /*
    .then(() => {
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
    */

// get the map at slider index
async function handleMapChange() {
    console.log("handleMapChange()");
    if(isFetching) {
        pendingIndex = getMapIndex(slider.value);
        return;
    }
    isFetching = true;
    // index to get with using absolute value
    // some conditions for improved slider visuals
    let index = getMapIndex(slider.value); 
    if(index != null) {
        // change map title
        const mapTitleElement = document.getElementById("title");
        mapTitleElement.innerHTML = mapNames[index].replace(/\n/g, "<br>");
        // allocate new scene
        //await fetchTextureFile(index, mapSize);
        console.log(`m: ${mapSize}, p: ${plateMode}, b: ${borderMode}`)
        await loadTexturesAndCreateScene(index, mapSize, plateMode, borderMode);
        // free old map for memory optimization
        unloadPreviousMap();
    }
    isFetching = false;
    /*
    if (pendingIndex !== null) {
        const nextIndex = pendingIndex;
        pendingIndex = null;
        handleMapChange();
    }
    */
}

// slider inverted, so use absolute value
function getMapIndex(value) {
    if(value <= 0 && value >= -108){
        return Math.abs(value)
    } else {
        return null;
    }
}

/*
// go for the route where the map at index is located
// how to make this entire process more efficient?
async function fetchTextureFile(index, size) {
    // promise for the fetch request
    const fetchTextureFilePromise = new Promise((resolve, reject) => {
        // load the texture file from path
        const textureURL = `/${size}texture${index}`;
        textureLoader.load(textureURL, (texture) => {
            texture.minFilter = THREE.LinearFilter; // Reduce memory usage
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            createSceneFromTexture(texture);
            resolve();
        }, undefined, reject);
    });
    // add the promise to the fetch queue
    fetchFileQueue = fetchFileQueue.then(() => fetchTextureFilePromise);
    return fetchTextureFilePromise;
}
*/

async function loadTexture(url) {
    //console.log(url); 
    return new Promise((resolve, reject) => {
        textureLoader.load(
            url,
            (texture) => {
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                resolve(texture);
            },
            undefined,
            (error) => {
                console.error(`Error loading texture: ${error}`);
                reject(error);
            }
        );
    });
}

async function fetchTextureFile(index, size) {
    const textureURL = `/${size}texture${index}`;
    return loadTexture(textureURL);
}

async function fetchBorderFile(index) {
    const textureURL = `/border${index}`;
    return loadTexture(textureURL);
}

async function fetchPlateFile(index) {
    const textureURL = `/plate${index}`;
    return loadTexture(textureURL);
}

async function loadTexturesAndCreateScene(index, size, p, b) { 
    console.log("loadTexturesAndCreateScene()");
    try {
        // always load base texture
        const baseTexture = await fetchTextureFile(index, size);
        // load additional textures based on toggles
        const plateTexture = p ? await fetchPlateFile(index) : null;
        const borderTexture = b ? await fetchBorderFile(index) : null;
        const textureData = {
            base: baseTexture,
            plate: plateTexture,
            border: borderTexture
        };
        await createSceneFromTexture(textureData);
    } catch (error) {
        console.error("Error loading textures:", error);
    }
}

// make path then build earth mesh
async function createSceneFromTexture(textureData) {
    //await renderTools();
    await renderOuterEarthFromTexture(textureData);
}

// render visual helpers
async function renderTools() {
    const axesHelper = new THREE.AxesHelper( 5 );
    //console.log(axesHelper)
    scene.add(axesHelper);
}

// render the earth by mapping a texture to the previously created icosahedron
async function renderOuterEarthFromTexture(textureData) {
    const outerEarth = new THREE.Group();

    // crate base earth layer
    const baseMaterial = new THREE.MeshBasicMaterial({
        map: textureData.base
    });
    const earth = new THREE.Mesh(icogeo, baseMaterial);
    earth.rotation.x = rotation;
    outerEarth.add(earth);

    // add plate layer if it exists
    if (textureData.plate) {
        const plateMaterial = new THREE.MeshBasicMaterial({
            map: textureData.plate,
            transparent: true,
        });
        const plateMesh = new THREE.Mesh(icogeo, plateMaterial);
        plateMesh.rotation.x = rotation;
        plateMesh.renderOrder = 1;
        outerEarth.add(plateMesh);
    }

    // add border layer if it exists
    if (textureData.border) {
        const borderMaterial = new THREE.MeshBasicMaterial({
            map: textureData.border,
            transparent: true,
        });
        const borderMesh = new THREE.Mesh(icogeo, borderMaterial);
        borderMesh.rotation.x = rotation;
        borderMesh.renderOrder = 2;
        outerEarth.add(borderMesh);
    }

    scene.add(outerEarth);
}

// render north and south poles aka the zenith axis
async function renderZenithPoles() {
    const zenithPoles= new THREE.Group();
    const northGeo = new THREE.BufferGeometry();
    const northVertices = new Float32Array([
        0, 0, 0,    // start of the line (origin)
        0, 0, 1.2   // end of the line (along the z-axis)
    ]);
    northGeo.setAttribute("position", new THREE.BufferAttribute(northVertices, 3));
    const northMat = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const north = new THREE.Line(northGeo, northMat);
    zenithPoles.add(north);

    const southGeo = new THREE.BufferGeometry();
    const southVertices = new Float32Array([
        0, 0, -1.2,  // start of the line (origin)
        0, 0, 0,     // end of the line (along the z-axis)
    ]);
    southGeo.setAttribute("position", new THREE.BufferAttribute(southVertices, 3));
    const southMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const south = new THREE.Line(southGeo, southMat);
    zenithPoles.add(south);
    scene.add(zenithPoles);
}

// render da deep core
async function renderInnerEarth() {
    const innerEarth = new THREE.Group();

    let geo;
    let mat;

    // inner core
    geo = new THREE.IcosahedronGeometry(0.375, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
    });
    const innercore = new THREE.Mesh(geo, mat);
    innerEarth.add(innercore);

    // outer core
    geo = new THREE.IcosahedronGeometry(0.625, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0xf69f31,
    });
    const outercore = new THREE.Mesh(geo, mat);
    innerEarth.add(outercore);

    // mantle
    geo = new THREE.IcosahedronGeometry(0.925, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0xe76c2f,
    });
    const mantle = new THREE.Mesh(geo, mat);
    innerEarth.add(mantle);

    // crust
    geo = new THREE.IcosahedronGeometry(0.9875, 2);
    mat = new THREE.MeshBasicMaterial({ 
        color: 0x75381a,
    });
    const crust = new THREE.Mesh(geo, mat);
    innerEarth.add(crust);
    
    scene.add(innerEarth);
}

// unload 2nd last map from the scene
function unloadPreviousMap() {
    let n = scene.children.length;
    const prevGroup = scene.children[n-2];
    scene.remove(prevGroup);
    while(prevGroup.children.length > 0) {
        disposeMesh(prevGroup.children[0])
    }
}

function disposeMesh(mesh) {
    if(mesh.parent) mesh.parent.remove(mesh);
    if(mesh.isMesh) {
        if(mesh.geometry) mesh.geometry.dispose();
        if(mesh.material.map) mesh.material.map.dispose();
        if(mesh.material) mesh.material.dispose(); 
    }
}

// render tth the rendering renderer
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
// dom content loaded before scripts tag in index.html

//const controlshud = document.querySelector("controlshud");
// toggle for map size
// get the hdToggle element
const hdToggle = document.getElementById("hdToggle");
const borderToggle = document.getElementById("borderToggle");
const plateToggle = document.getElementById("plateToggle");
// access the slider element to create new scenes
const slider = document.getElementById("myRange");
// get the arrow elements
const buttonLeft = document.getElementById("arrow-left");
const buttonRight = document.getElementById("arrow-right");
// fullscreen
const fullscreenToggle = document.getElementById("fullscreen-button");
const fullscreenAlt = document.getElementById("fullscreen-alt");
const fullscreenExit = document.getElementById("fullscreen-exit");

// for keydown
let isKeyPressed = false;
let delay = 10;

if(hdToggle) {
    // add an event listener to detect changes in the hdToggle state
    hdToggle.addEventListener("change", (e) => {
        console.log(`hdToggle ${e.target.checked}`);
        // check if the hdToggle is checked
        if(e.target.checked) {
            mapSize = "large";
        } else {
            mapSize = "small";
        }
        handleMapChange();
    });
}

if(borderToggle) {
    borderToggle.addEventListener("change", (e) => {
        console.log(`borderToggle ${e.target.checked}`);
        if(e.target.checked) {
            borderMode = true;
        } else {
            borderMode = false;
        }
        handleMapChange();
    });
}

if(plateToggle) {
    plateToggle.addEventListener("change", (e) => {
        console.log(`plateToggle ${e.target.checked}`);
        if(e.target.checked) {
            plateMode = true;
        } else {
            plateMode = false;
        }
        handleMapChange();
    });
}

if(slider) {
    // if the slider is used
    slider.addEventListener("input", debounce(() => {
        handleMapChange();
    }, delay));

    // for keypresses to change the slider value
    document.addEventListener("keydown", (event) => {
        if(!isKeyPressed) {
            isKeyPressed = true;
            // check which key
            if (event.key === "ArrowRight") {
                slider.value = parseInt(slider.value) + 1;
                handleMapChange();
            } else if (event.key === "ArrowLeft") {
                slider.value = parseInt(slider.value) - 1;
                handleMapChange();
            }
            // delay
            setTimeout(() => {
                isKeyPressed = false;
            }, delay);
        }
    });    
}

if(buttonLeft) {
    buttonLeft.addEventListener("click", () => {
        slider.value = parseInt(slider.value) - 1;
        handleMapChange();
    });
}

if(buttonRight) {
    buttonRight.addEventListener("click", () => {
        slider.value = parseInt(slider.value) + 1;
        handleMapChange();
    });

}

let fullscreen = false;
if(fullscreenToggle && fullscreenAlt && fullscreenExit) {
    fullscreenToggle.addEventListener("click", () => {
        fullscreen = !fullscreen;
        fullscreenAlt.style.display = fullscreen ? "none" : "flex";
        fullscreenExit.style.display = fullscreen ? "flex" : "none";
        const infohud = document.querySelector(".infohud");
        if(infohud) {
            infohud.style.display = fullscreen ? "none" : "flex";
        }
    });
}

// add delay to process
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
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

// handle renderer breaking
renderer.domElement.addEventListener('webglcontextlost', (event) => {
    console.log("ded");
    event.preventDefault();
}, false);
renderer.domElement.addEventListener('webglcontextrestored', (event) => {
    console.log("back up?");
    handleMapChange();
}, false);

