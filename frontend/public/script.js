// now I can import from the server whatever I need, just add the route
import mapNames from './maps.js';

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
const loader = new THREE.CubeTextureLoader();
// had to adjust sun position from "bottom"
const textureCube = loader.load( [
    "front.png", "back.png",
	"top.png", "bottom.png",
    "right.png", "left.png"
] );
scene.background = textureCube;

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

let firstLoad = true;
// assign elevation color to the points
const seaLevel = 0;
// for swapping between map sizes
let mapMode = false;
let mapSize = "small";
let pointSize = 0.04;
// array of inferred positions for parsing 0.1
let latlon = [];
// variable to keep track of the fetch queue
let fetchBinaryFileQueue = Promise.resolve();

// create default scene
fetchBinaryFile(0, mapSize);

// event listeners 
document.addEventListener("DOMContentLoaded", function() {
    // toggle for map size
    // Get the checkbox element
    const checkbox = document.querySelector('input[type="checkbox"]');
    // access the slider element to create new scenes
    const slider = document.getElementById("myRange");

    if(checkbox && slider) {
        // Add an event listener to detect changes in the checkbox state
        checkbox.addEventListener('change', function() {
            // Check if the checkbox is checked
            if (this.checked) {
                // only do this on first load
                // had to put it here because of white screen staying too long
                if(firstLoad) {
                    for (let i = 90.0; i >= -90.0; i -= 0.1 ) {
                        for (let j = -180.0; j <= 180.0; j += 0.1) {
                            latlon.push([i, j])
                        }
                    }
                    firstLoad = false;
                }
                // Checkbox is checked, do something
                //console.log('Checkbox is checked');
                mapMode = true;
                mapSize = "large";
                pointSize = 0.004;
            } else {
                // Checkbox is unchecked, do something else
                //console.log('Checkbox is unchecked');
                mapMode = false;
                mapSize = "small";
                pointSize = 0.04;
            }
            let index = getMapIndex(slider.value);
            if(index != null) {
                // get binary file from server and create new scene
                fetchBinaryFile(Math.abs(slider.value), mapSize);
            }
        });

        function handleMapChange() {
            // index to get with using absolute value
            // some conditions for improved slider visuals
            let index = getMapIndex(slider.value);
            if(index != null) {
                // change map title
                const mapTitleElement = document.getElementById("title");
                mapTitleElement.innerHTML = mapNames[index].replace(/\n/g, "<br>");

                // get binary file from server and create new scene
                fetchBinaryFile(index, mapSize);
            }
        }

        slider.addEventListener("input", function() {
            handleMapChange();
        });

        // for keypresses
        document.addEventListener("keydown", function(event) {
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

    

    /*
    // for future random reset points
    controls.addEventListener( "change", () => { 
        console.log( controls.object );  
        console.log( controls.object.position ); 
        console.log( controls.object.rotation ); 
        console.log( controls.object.up ); 
    });
    */
});



// go for the route where the map at index is located
// how to make this entire process more efficient?
async function fetchBinaryFile(index, size) {
    // promise for the fetch request
    const fetchBinaryFilePromise = new Promise((resolve, reject) =>{
        // get the binary file
        fetch(`/${size}${index}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch bin file');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            // free old scene
            unloadScene();
            // allocate new scene
            createScene(data);
            // complete upon scene render
            resolve();
        })
        .catch(error => {
            console.error('Error fetching bin file:', error);
            // reject on error
            reject(error);
        });
    });

    // add the promise to the fetch queue
    fetchBinaryFileQueue = fetchBinaryFileQueue.then(() => fetchBinaryFilePromise);
}

function getMapIndex(value) {
    if(value <= 0 && value >= -108){
        return Math.abs(value)
    } else {
        return null;
    }
}
    

// create the default scene
/*
fetch(`/bin0`)
.then(response => {
    if (!response.ok) {
        throw new Error('Failed to fetch binary file');
    }
    return response.arrayBuffer();
})
.then(data => {
    createScene(data);
})
.catch(error => {
    console.error('Error fetching binary file:', error);
});
*/

/*
lat:01011010, lon:010110100, z:111000010011001
lat:01011010, lon:010110100, z:111000010011001, b:01011010010110100111000010011001
01011010 010110100 111000010011001

10011001 01110000 01011010 01011010
10011001 01110000 01011010 01011010
10011001 01110000 01011010 01011010
        
01011010 01011010 01110000 10011001
01011010 01011010 01110000 10011001

01011010 010110100111000010011001
*/
// parse custom binary files
// get big endian data view
function parseBin(data) {
    // data that we use to build earth
    let vertices = [];
    let elevations = [];
    const R = 1;
    // so that we can read our data properly
    let dataView = new DataView(data);
    //console.log(dataView.buffer.byteLength);
    //let j = 0;
    const bufferSize = dataView.buffer.byteLength;
    for (let i = 0; i + 4 <= bufferSize; i += 4) {
        const nibble = dataView.getUint32(i, false);
        // extract the bits out by position
        const lat = (nibble >>> 24) & 0xFF;
        const lon = (nibble >>> 15) & 0x1FF;
        const ele = nibble & 0x7FFF;
        // convert the bits to signed integers
        const la = (lat & 0x80 ? lat | 0xFFFFFF00 : lat);
        const lo = (lon & 0x100 ? lon | 0xFFFFFE00 : lon);
        const el = (ele & 0x4000 ? ele | 0xFFFF8000 : ele);
        // get float
        const latitude = parseFloat(la);
        const longitude = parseFloat(lo);
        const elevation = parseFloat(el);

        //console.log(`${j}: lat:${lat.toString(2).padStart(8, '0')}, lon:${lon.toString(2).padStart(9, '0')}, z:${z.toString(2).padStart(15, '0')}`);
        //console.log(`${j}: lat:${latitude}, lon:${longitude}, z:${elevation}`);
        //console.log(`${j}: lat:${la}, lon:${lo}, z:${el}`);

        // convert to radians
        const rlo = longitude * (Math.PI / 180);
        const rla = latitude * (Math.PI / 180);
        // get x, y, z coordinates, scaled with radius
        const x = R * Math.cos(rla) * Math.cos(rlo)
        const y = R * Math.cos(rla) * Math.sin(rlo)
        const z = R * Math.sin(rla)

        vertices.push(x, y, z);
        elevations.push(elevation);

        //j++;
    }

    return { vertices, elevations };
}

function parseBin6(data) {
    // data that we use to build earth
    let vertices = [];
    let elevations = [];
    const R = 1;
    // so that we can read our data properly
    let dataView = new DataView(data);
    //console.log(dataView.buffer.byteLength);
    const bufferSize = dataView.buffer.byteLength;

    let j = 0;
    for (let i = 0; i + 2 <= bufferSize; i += 2) {
        let word = dataView.getUint16(i, false);
        // Check if the highest bit is 1 (indicating a negative number)
        if (word & 0x8000) {
            // Perform Two's complement conversion for negative numbers
            word = -((~word & 0xFFFF) + 1);
        }
        const latitude = parseFloat(latlon[j][0]);
        const longitude = parseFloat(latlon[j][1]);
        const elevation = parseFloat(word);

        // convert to radians
        const rlo = longitude * (Math.PI / 180);
        const rla = latitude * (Math.PI / 180);
        // get x, y, z coordinates, scaled with radius
        const x = R * Math.cos(rla) * Math.cos(rlo)
        const y = R * Math.cos(rla) * Math.sin(rlo)
        const z = R * Math.sin(rla)

        vertices.push(x, y, z);
        elevations.push(elevation);

        j++;
    }

    return { vertices, elevations };
}

// create a scene out of the given data
async function createScene(data) {
    let vertices, elevations;
    if(mapMode) {
        ({ vertices, elevations } = parseBin6(data));
    } else {
        ({ vertices, elevations } = parseBin(data));
    }
    //await renderTools();
    await renderZenithPoles();
    await renderOuterEarth(vertices, elevations);
    await renderInnerEarth();
}

// render visual helpers
async function renderTools() {
    const axesHelper = new THREE.AxesHelper( 5 );
    console.log(axesHelper)
    scene.add( axesHelper );
}

// render north and south poles aka the zenith axis
async function renderZenithPoles() {
    const northGeo = new THREE.BufferGeometry();
    const northVertices = new Float32Array([
        0, 0, 0,  // Start of the line (origin)
        0, 0, 1.2  // End of the line (along the z-axis)
    ]);
    northGeo.setAttribute('position', new THREE.BufferAttribute(northVertices, 3));
    const northMat = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const north = new THREE.Line(northGeo, northMat);
    scene.add(north);

    const southGeo = new THREE.BufferGeometry();
    const southVertices = new Float32Array([
        0, 0, -1.2,  // Start of the line (origin)
        0, 0, 0,  // End of the line (along the z-axis)
    ]);
    southGeo.setAttribute('position', new THREE.BufferAttribute(southVertices, 3));
    const southMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const south = new THREE.Line(southGeo, southMat);
    scene.add(south);
}

// render the earth using points from bin file
async function renderOuterEarth(vertices, elevations) {
    // create buffer geometry for points
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(vertices.length).fill(0), 3)); 

    // colour the point with material
    const material = new THREE.PointsMaterial({
        //size: 0.04,
        size: pointSize,
        vertexColors: THREE.VertexColors,
        dithering: true,
    });

    for (let i = 0; i < elevations.length; i++) {
        const elevation = elevations[i];
        let color;
        if(mapMode) {
            color = getColorLarge(elevation);
        } else {
            color = getColorSmall(elevation);
        }
        // set the color for each vertex
        geometry.attributes.color.setXYZ(i, color.r, color.g, color.b);
    }
    // update the colours
    geometry.attributes.color.needsUpdate = true;

    // single points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);
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

// a function that represents our elevation color gradient
function getColorSmall(elevation) {
    let color;
    // set color based on elevation
    if (elevation >= -12000 && elevation < -6000)    
        //color = new THREE.Color(0x32292f);
        color = new THREE.Color(0x080e30);
    else if (elevation >= -6000 && elevation < -3000)
        color = new THREE.Color(0x1f2d47);
    else if (elevation >= -3000 && elevation < -150)
        color = new THREE.Color(0x2a3c63);
    else if (elevation >= -150 && elevation <= seaLevel)
        color = new THREE.Color(0x344b75);
    else if (elevation > seaLevel && elevation < 100)
        color = new THREE.Color(0x347a2a);
    else if (elevation >= 100 && elevation < 400)
        color = new THREE.Color(0x00530b);
    else if (elevation >= 400 && elevation < 1000)
        color = new THREE.Color(0x3d3704);
    else if (elevation >= 1000 && elevation < 2000)
        color = new THREE.Color(0x805411);
    else if (elevation >= 2000 && elevation < 3200)
        color = new THREE.Color(0x977944);
    else
        color = new THREE.Color(0xadacac);

    return color;
}

// a function that represents our elevation color gradient for the higher resolution map
function getColorLarge(elevation) {
    let color;
    // set color based on elevation
    if (elevation >= -12000 && elevation < -6000)    
    //color = new THREE.Color(0x32292f);
    color = new THREE.Color(0x080e30);
    else if (elevation >= -6000 && elevation < -3000)
        color = new THREE.Color(0x1f2d47);
    else if (elevation >= -3000 && elevation < -150)
        color = new THREE.Color(0x2a3c63);
    else if (elevation >= -150 && elevation <= seaLevel)
        color = new THREE.Color(0x344b75);
    else if (elevation > seaLevel && elevation < 100)
        color = new THREE.Color(0x347a2a);
    else if (elevation >= 100 && elevation < 400)
        color = new THREE.Color(0x00530b);
    else if (elevation >= 400 && elevation < 1000)
        color = new THREE.Color(0x3d3704);
    else if (elevation >= 1000 && elevation < 2000)
        color = new THREE.Color(0x805411);
    else if (elevation >= 2000 && elevation < 3200)
        color = new THREE.Color(0x977944);
    else
        color = new THREE.Color(0xadacac);

    return color;
}

// unload all objects from the scene
function unloadScene() {
    while(scene.children.length > 0){ 
        // free material
        scene.children[0].material.dispose();
        // free geometry
        scene.children[0].geometry.dispose();
        scene.remove(scene.children[0]); 
    }
    renderer.dispose();
}

// render the scene with the rendering renderer
function render() {
    renderer.render(scene, camera)
}

// animate the scene lel
function animate(t = 0) {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

animate();

