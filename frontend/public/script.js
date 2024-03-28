const mapNames = [
    "Present-day (Holocene, 0 Ma)",
    "Early Pliocene (Zanclean, 4.47 Ma)",
    "Middle/Late Miocene (Serravallian&Tortonian, 10.5 Ma)",
    "Middle Miocene (Langhian, 14.9 Ma)",
    "Early Miocene (Aquitanian&Burdigalian, 19.5 Ma)",
    "Late Oligocene (Chattian, 25.6 Ma)",
    "Early Oligocene (Rupelian, 31 Ma)",
    "Late Eocene (Priabonian, 35.9 Ma)",
    "late Middle Eocene (Bartonian, 39.5 Ma)",
    "Early Middle Eocene (Lutetian, 44.5 Ma)",
    "Early Eocene (Ypresian, 51.9 Ma)",
    "Paleocene/Eocene Boundary (PETM, 56 Ma)",
    "Paleocene (Danian & Thanetian, 61 Ma)",
    "KT Boundary (Latest Maastrichtian, 66 Ma)",
    "Late Cretaceous (Maastrichtian, 69 Ma)",
    "Late Cretaceous (Late Campanian, 75 Ma)",
    "Late Cretaceous (Early Campanian, 80.8 Ma)",
    "Late Cretaceous (Santonian&Coniacian, 86.7 Ma)",
    "Mid-Cretaceous (Turonian , 91.9 Ma)",
    "Mid-Cretaceous (Cenomanian, 97.2 Ma)",
    "Early Cretaceous (Late Albian, 102.6 Ma)",
    "Early Cretaceous (Middle Albian, 107 Ma)",
    "Early Cretaceous (Early Albian, 111 Ma)",
    "Early Cretaceous (Late Aptian, 115.8 Ma)",
    "Early Cretaceous (Early Aptian, 121.8 Ma)",
    "Early Cretaceous (Barremian, 127.2 Ma)",
    "Early Cretaceous (Hauterivian, 131.2 Ma)",
    "Early Cretaceous (Valanginian, 136.4 Ma)",
    "Early Cretaceous (Berriasian, 142.4 Ma)",
    "Jurassic/Cretaceous Boundary (145 Ma)",
    "Late Jurassic (Tithonian, 148.6 Ma)",
    "Late Jurassic (Kimmeridgian, 154.7 Ma)",
    "Late Jurassic (Oxfordian, 160.4 Ma)",
    "Middle Jurassic (Callovian, 164.8 Ma)",
    "Middle Jurassic (Bajocian&Bathonian, 168.2)",
    "Middle Jurassic (Aalenian, 172.2 Ma)",
    "Early Jurassic (Toarcian, 178.4 Ma)",
    "Early Jurassic (Pliensbachian, 186.8 Ma)",
    "Early Jurassic (Sinemurian/Pliensbachian, 190.8 Ma)",
    "Early Jurassic (Hettangian&Sinemurian, 196 Ma)",
    "Late Triassic (Rhaetian/Hettangian, 201.3 Ma)",
    "Late Triassic (Rhaetian, 204.9 Ma)",
    "Late Triassic (Late Norian, 213.2 Ma)",
    "Late Triassic (Mid Norian, 217.8 Ma)",
    "Late Triassic (Early Norian, 222.4 Ma)",
    "Late Triassic (Carnian/Norian 227 Ma)",
    "Late Triassic (Carnian, 232 Ma)",
    "Late Triassic (Early Carnian, 233.6)",
    "Middle Triassic (Ladinian, 239.5 Ma)",
    "Middle Triassic (Anisian, 244.6 Ma)",
    "Permo-Triassic Boundary (252 Ma)",
    "Late Permian (Lopingian, 256 Ma)",
    "Late Middle Permian (Capitanian, 262.5 Ma)",
    "Middle Permian (Wordian/Capitanian Boundary 265.1 Ma)",
    "Middle Permian (Roadian&Wordian, 268.7 Ma)",
    "Early Permian (Late Kungurian, 275 Ma)",
    "Early Permian (Early Kungurian, 280 Ma)",
    "Early Permian (Artinskian, 286.8 Ma)",
    "Early Permian (Sakmarian, 292.6 Ma)",
    "Early Permian (Asselian, 297 Ma)",
    "Late Pennsylvanian (Gzhelian, 301.3 Ma)",
    "Late Pennsylvanian (Kasimovian, 305.4 Ma)",
    "Middle Pennsylvanian (Moscovian, 311.1 Ma)",
    "Early/Middle Carboniferous (Baskirian/Moscovian boundary, 314.6 Ma)",
    "Early Pennsylvanian (Bashkirian, 319.2 Ma)",
    "Late Mississippian (Serpukhovian, 327 Ma)",
    "Late Mississippian (Visean/Serpukhovian boundary, 330.9 Ma)",
    "Middle Mississippian (Late Visean, 333 Ma)",
    "Middle Mississippian (Middle Visean, 338.8Ma)",
    "Middle Mississippian (Early Visean, 344 Ma)",
    "Early Mississippian (Late Tournaisian, 349 Ma)",
    "Early Mississippian (Early Tournaisian, 354Ma)",
    "Devono-Carboniferous Boundary (358.9 Ma)",
    "Late Devonian (Middle Famennian, 365.6 Ma)",
    "Late Devonian (Early Famennian, 370 Ma)",
    "Late Devonian (Late Frasnian, 375 Ma)",
    "Late Devonian (Early Frasnian, 380 Ma)",
    "Middle Devonian (Givetian, 385.2 Ma)",
    "Middle Devonian (Eifelian, 390.5 Ma)",
    "Early Devonian (Late Emsian, 395 Ma)",
    "Early Devonian (Middle Emsian, 400 Ma)",
    "Early Devonian (Early Emsian, 405 Ma)",
    "Early Devonian (Pragian, 409.2 Ma)",
    "Early Devonian (Lochkovian, 415 Ma)",
    "Late Silurian (Pridoli, 421.1 Ma)",
    "Late Silurian (Ludlow, 425.2 Ma)",
    "Middle Silurian (Wenlock, 430.4 Ma)",
    "Early Silurian (Late Llandovery, 436 Ma)",
    "Early Silurian (Early Llandovery, 441.2 Ma)",
    "Late Ordovician (Hirnantian, 444.5 Ma)",
    "Late Ordovician (Katian, 449.1 Ma)",
    "Late Ordovician (Sandbian, 455.7 Ma)",
    "Middle Ordovician (Late Darwillian,460 Ma)",
    "Middle Ordovician (Early Darwillian,465 Ma)",
    "Early Ordovician (Floian/Dapingianboundary, 470 Ma)",
    "Early Ordovician (Late Early Floian, 475 Ma)",
    "Early Ordovician (Tremadoc, 481.6 Ma)",
    "Cambro-Ordovician Boundary (485.4 Ma)",
    "Late Cambrian (Jiangshanian, 491.8 Ma)",
    "Late Cambrian (Pabian, 495.5 Ma)",
    "Late Middle Cambrian (Guzhangian, 498.8 Ma)",
    "Late Middle Cambrian (Early Epoch 3, 505 Ma)",
    "Early Middle Cambrian (Late Epoch 2, 510 Ma)",
    "Early Middle Cambrian (Middle Epoch 2, 515 Ma)",
    "Early/Middle Cambrian boundary (520 Ma)",
    "Early Cambrian (Late Terreneuvian, 525 Ma)",
    "Early Cambrian (Middle Terreneuvian, 530 Ma)",
    "Early Cambrian (Early Terreneuvian, 535 Ma)",
    "Cambrian/Precambrian boundary (541 Ma)"
  ];

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let isRendering = true;

function stopRenderer() {
    isRendering = false;
}

// Controls
//const controls = new THREE.OrbitControls(camera, renderer.domElement);
const controls = new THREE.TrackballControls(camera, renderer.domElement);

controls.enable =  true;
controls.minDistance = 150;
controls.maxDistance = 1000;
//controls.enableDamping = true;
//controls.dampingFactor = 0.1;
controls.staticMoving = true;
controls.zoomSpeed = 0.5;
//controls.autoRotate = true;
//controls.autoRotateSpeed = 0.5;
controls.screenSpacePanning = true;

// set cam default
camera.position.set(100, 200, 200);
controls.update();

// get the default csv file
fetch(`/csv0`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch CSV file');
        }
        return response.text();
    })
    .then(data => {
        createScene(data);
    })
    .catch(error => {
        console.error('Error fetching CSV file:', error);
    });

// event listener for slider
document.addEventListener("DOMContentLoaded", function() {
    // Access the slider element
    const slider = document.getElementById("myRange");

    // Check if the slider element exists
    if (slider) {
        // Add an event listener to handle changes in the slider value
        slider.addEventListener("input", function() {
            // Update the value displayed below the slider
            //const sliderValue = document.getElementById("sliderValue");
            //sliderValue.textContent = `Map: ${Math.abs(slider.value)}`;

            const index = Math.abs(slider.value);

            const mapTitle = document.getElementById("title");
            mapTitle.textContent = `${mapNames[index]}`;
            //console.log(maps[index].stratigraphic_age);

            // get the csv file
            fetch(`/csv${index}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch CSV file');
                }
                return response.text();
            })
            .then(data => {
                createScene(data);
            })
            .catch(error => {
                console.error('Error fetching CSV file:', error);
            });
        });
    } else {
        console.error("Slider element not found");
    }
});


function parse(csvData) {
    // data to be parsed
    let vertices = [];
    let elevations = [];

    const R = 100;
    // process the data
    let lines = csvData.split("\n");
    // have to check for carriage return in some of the files
    // will standardize later
    if(lines.length <= 1) {
        lines = csvData.split("\r");
    }
    //console.log(`${lines.length}`);
    //prevline = "";
    for (const [index, line] of lines.entries()) {
        // conditions to avoid
        if (index === 0) continue;
        if (line === "") continue;

        const [lo, la, el] = line.split(",");
        const longitude = parseFloat(lo);
        const latitude = parseFloat(la);
        const elevation = parseFloat(el);
        
        /*
        if (isNaN(longitude) || isNaN(latitude) || isNaN(elevation)) {
            console.log('One of the values is NaN');
            console.log(line);
            console.log(prevline);
            console.log(index)
            console.log(longitude);
            console.log(latitude);
            console.log(elevation);
        } else {
            console.log('All values are valid numbers');
        }
        */
        
        // covert to cartesian coords
        rlo = longitude * (Math.PI / 180);
        rla = latitude * (Math.PI / 180);
        const x = R * Math.cos(rla) * Math.cos(rlo)
        const y = R * Math.cos(rla) * Math.sin(rlo)
        const z = R * Math.sin(rla)

        //const vertex = new THREE.Vector3(x, y, z);
        //vertices.push(vertex);
        vertices.push(x, y, z);
        elevations.push(elevation);

        //prevline = line
        // take less points
        //if(index === 1000) break;
    }
    //console.log("test end")
    //console.log(vertices);
    //console.log(elevations);

    return { vertices, elevations };
}


// create a scene out of csv data
async function createScene(csvData) {
    let { vertices, elevations } = parse(csvData);


    // Create buffer geometry for points
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(vertices.length).fill(0), 3)); 

    //console.log(geometry)
    // colour the point with material
    const material = new THREE.PointsMaterial({
        size: 4,
        vertexColors: THREE.VertexColors,
        dithering: true,
        side: THREE.FrontSide
    });

    // assign elevation color to the points
    const seaLevel = 0;
    for (let i = 0; i < elevations.length; i++) {
        const elevation = elevations[i];
        let color;
        // set color based on elevation
        if (elevation >= -11000 && elevation < -6000)
            color = new THREE.Color(0x32292f);
        else if (elevation >= -6000 && elevation < -3000)
            color = new THREE.Color(0x1f2d47);
        else if (elevation >= -3000 && elevation < -150)
            color = new THREE.Color(0x2a3c63);
        else if (elevation >= -150 && elevation <= seaLevel)
            color = new THREE.Color(0x344b75);
        else if (elevation > seaLevel && elevation < 100)
            //color = new THREE.Color(0x2d7548);
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

        // set the color for each vertex
        geometry.attributes.color.setXYZ(i, color.r, color.g, color.b);
    }
    // update the colours
    geometry.attributes.color.needsUpdate = true;

    // single points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);
}

function animate() {
    if (!isRendering) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
