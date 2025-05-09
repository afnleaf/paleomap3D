/*****************************************************************************/
// deprecated binary file stuff -----------------------------------------------
// keeping in this file cause I like some of the code here


//let firstLoad = true;
//let pointSize = 0.04;
// array of inferred positions for parsing 0.1
//let latlon = [];
//fetchBinaryFile(0, mapSize);
//let mapMode = false;
// assign elevation color to the points
//const seaLevel = 0;

// get binary file from server and create new scene
//fetchBinaryFile(index, mapSize);
//fetchTextureFile(index, mapSize);
// only do this on first load
// had to put it here because of white screen staying too long
/*
if(firstLoad) {
    generateVertices();
    firstLoad = false;
}
*/
// checkbox is checked, do something
//console.log("Checkbox is checked");
//console.log("Checkbox is unchecked");
//mapMode = false;
//mapMode = true;
//pointSize = 0.004;
//pointSize = 0.04;

document.addEventListener("DOMContentLoaded", () => {   
    // for future random reset points
    //controls.addEventListener( "change", () => { 
    //    console.log( controls.object );  
    //    console.log( controls.object.position ); 
    //    console.log( controls.object.rotation ); 
    //    console.log( controls.object.up ); 
    //});
});

// infer vertices for the 0.1
function generateVertices() {
    for (let i = 90.0; i >= -90.0; i -= 0.1 ) {
        for (let j = -180.0; j <= 180.0; j += 0.1) {
            latlon.push([i, j])
        }
    }
}

// go for the route where the map at index is located
// how to make this entire process more efficient?
async function fetchBinaryFile(index, size) {
    // promise for the fetch request
    const fetchBinaryFilePromise = new Promise((resolve, reject) =>{
        // get the binary file
        fetch(`/${size}${index}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch bin file");
            }
            return response.arrayBuffer();
        })
        .then(data => {
            // free old scene
            unloadScene();
            // allocate new scene
            createSceneFromBin(data);
            // complete upon scene render
            resolve();
        })
        .catch(error => {
            console.error("Error fetching bin file:", error);
            // reject on error
            reject(error);
        });
    });

    // add the promise to the fetch queue
    fetchFileQueue = fetchFileQueue.then(() => fetchBinaryFilePromise);
    return fetchBinaryFilePromise;
}

// go for the route where the map at index is located
// how to make this entire process more efficient?
async function fetchTextureFile(index, size) {
    // promise for the fetch request
    const fetchTextureFilePromise = new Promise((resolve, reject) =>{
        // get the binary file
        fetch(`/${size}texture${index}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch texture file");
            }
            return response.blob();
        })
        .then(data => {
            // convert to object url
            const texture = URL.createObjectURL(data);
            // free old scene
            //unloadScene();
            // allocate new scene
            createSceneFromTexture(texture);
            // complete upon scene render
            resolve();
        })
        .catch(error => {
            console.error("Error:", error);
            // reject on error
            reject(error);
        });
    });

    // add the promise to the fetch queue
    fetchFileQueue = fetchFileQueue.then(() => fetchTextureFilePromise);
    return fetchTextureFilePromise;
}

// create the default scene
/*
fetch(`/bin0`)
.then(response => {
    if (!response.ok) {
        throw new Error("Failed to fetch binary file");
    }
    return response.arrayBuffer();
})
.then(data => {
    createScene(data);
})
.catch(error => {
    console.error("Error fetching binary file:", error);
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
        const la = (lat & 0x80 ? lat | 0xFFFFFF00 : lat)
        const lo = (lon & 0x100 ? lon | 0xFFFFFE00 : lon);
        const el = (ele & 0x4000 ? ele | 0xFFFF8000 : ele);
        // get float
        const latitude = parseFloat(la);
        const longitude = parseFloat(lo);
        const elevation = parseFloat(el);

        //console.log(`${j}: lat:${lat.toString(2).padStart(8, "0")}, lon:${lon.toString(2).padStart(9, "0")}, z:${z.toString(2).padStart(15, "0")}`);
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
            // Perform Two"s complement conversion for negative numbers
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
async function createSceneFromBin(data) {
    let vertices, elevations;
    if(mapMode) {
        ({ vertices, elevations } = parseBin6(data));
    } else {
        ({ vertices, elevations } = parseBin(data));
    }
    //await renderTools();
    await renderZenithPoles();
    await renderOuterEarthFromBin(vertices, elevations);
    await renderInnerEarth();
}

// render the earth using points from bin file
async function renderOuterEarthFromBin(vertices, elevations) {
    // create buffer geometry for points
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(new Array(vertices.length).fill(0), 3)); 

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
function unloadSceneBin() {
    while(scene.children.length > 0){ 
        // free material
        scene.children[0].material.dispose();
        // free geometry
        scene.children[0].geometry.dispose();
        scene.remove(scene.children[0]); 
    }
    renderer.dispose();
}
