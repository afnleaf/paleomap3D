const maps = [
    {"stratigraphic_age": "Present-day (Holocene, 0 Ma)", "filename": "csv_files/Map01_000Ma.csv"},
    {"stratigraphic_age": "Early Pliocene (Zanclean, 4.47 Ma)", "filename": "csv_files/Map03_005Ma.csv"},
    {"stratigraphic_age": "Middle/Late Miocene (Serravallian&Tortonian, 10.5 Ma)", "filename": "csv_files/Map05_010Ma.csv"},
    {"stratigraphic_age": "Middle Miocene (Langhian, 14.9 Ma)", "filename": "csv_files/Map06_015Ma.csv"},
    {"stratigraphic_age": "Early Miocene (Aquitanian&Burdigalian, 19.5 Ma)", "filename": "csv_files/Map07_020Ma.csv"},
    {"stratigraphic_age": "Late Oligocene (Chattian, 25.6 Ma)", "filename": "csv_files/Map08_025Ma.csv"},
    {"stratigraphic_age": "Early Oligocene (Rupelian, 31 Ma)", "filename": "csv_files/Map09_030Ma.csv"},
    {"stratigraphic_age": "Late Eocene (Priabonian, 35.9 Ma)", "filename": "csv_files/Map10_035Ma.csv"},
    {"stratigraphic_age": "late Middle Eocene (Bartonian, 39.5 Ma)", "filename": "csv_files/Map11_040Ma.csv"},
    {"stratigraphic_age": "Early Middle Eocene (Lutetian, 44.5 Ma)", "filename": "csv_files/Map12_045Ma.csv"},
    {"stratigraphic_age": "Early Eocene (Ypresian, 51.9 Ma)", "filename": "csv_files/Map13_050Ma.csv"},
    {"stratigraphic_age": "Paleocene/Eocene Boundary (PETM, 56 Ma)", "filename": "csv_files/Map14_055Ma.csv"},
    {"stratigraphic_age": "Paleocene (Danian & Thanetian, 61 Ma)", "filename": "csv_files/Map15_060Ma.csv"},
    {"stratigraphic_age": "KT Boundary (Latest Maastrichtian, 66 Ma)", "filename": "csv_files/Map16_065Ma.csv"},
    {"stratigraphic_age": "Late Cretaceous (Maastrichtian, 69 Ma)", "filename": "csv_files/Map17_070Ma.csv"},
    {"stratigraphic_age": "Late Cretaceous (Late Campanian, 75 Ma)", "filename": "csv_files/Map18_075Ma.csv"},
    {"stratigraphic_age": "Late Cretaceous (Early Campanian, 80.8 Ma)", "filename": "csv_files/Map19_080Ma.csv"},
    {"stratigraphic_age": "Late Cretaceous (Santonian&Coniacian, 86.7 Ma)", "filename": "csv_files/Map20_085Ma.csv"},
    {"stratigraphic_age": "Mid-Cretaceous (Turonian , 91.9 Ma)", "filename": "csv_files/Map21_090Ma.csv"},
    {"stratigraphic_age": "Mid-Cretaceous (Cenomanian, 97.2 Ma)", "filename": "csv_files/Map22_095Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Late Albian, 102.6 Ma)", "filename": "csv_files/Map23_100Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Middle Albian, 107 Ma)", "filename": "csv_files/Map24_105Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Early Albian, 111 Ma)", "filename": "csv_files/Map25_110Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Late Aptian, 115.8 Ma)", "filename": "csv_files/Map26_115Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Early Aptian, 121.8 Ma)", "filename": "csv_files/Map27_120Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Barremian, 127.2 Ma)", "filename": "csv_files/Map28_125Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Hauterivian, 131.2 Ma)", "filename": "csv_files/Map29_130Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Valanginian, 136.4 Ma)", "filename": "csv_files/Map30_135Ma.csv"},
    {"stratigraphic_age": "Early Cretaceous (Berriasian, 142.4 Ma)", "filename": "csv_files/Map31_140Ma.csv"},
    {"stratigraphic_age": "Jurassic/Cretaceous Boundary (145 Ma)", "filename": "csv_files/Map32_145Ma.csv"},
    {"stratigraphic_age": "Late Jurassic (Tithonian, 148.6 Ma)", "filename": "csv_files/Map33_150Ma.csv"},
    {"stratigraphic_age": "Late Jurassic (Kimmeridgian, 154.7 Ma)", "filename": "csv_files/Map34_155Ma.csv"},
    {"stratigraphic_age": "Late Jurassic (Oxfordian, 160.4 Ma)", "filename": "csv_files/Map35_160Ma.csv"},
    {"stratigraphic_age": "Middle Jurassic (Callovian, 164.8 Ma)", "filename": "csv_files/Map36_165Ma.csv"},
    {"stratigraphic_age": "Middle Jurassic (Bajocian&Bathonian, 168.2)", "filename": "csv_files/Map37_170Ma.csv"},
    {"stratigraphic_age": "Middle Jurassic (Aalenian, 172.2 Ma)", "filename": "csv_files/Map38_175Ma.csv"},
    {"stratigraphic_age": "Early Jurassic (Toarcian, 178.4 Ma)", "filename": "csv_files/Map39_180Ma.csv"},
    {"stratigraphic_age": "Early Jurassic (Pliensbachian, 186.8 Ma)", "filename": "csv_files/Map40_185Ma.csv"},
    {"stratigraphic_age": "Early Jurassic (Sinemurian/Pliensbachian, 190.8 Ma)", "filename": "csv_files/Map41_190Ma.csv"},
    {"stratigraphic_age": "Early Jurassic (Hettangian&Sinemurian, 196 Ma)", "filename": "csv_files/Map42_195Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Rhaetian/Hettangian, 201.3 Ma)", "filename": "csv_files/Map43_200Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Rhaetian, 204.9 Ma)", "filename": "csv_files/Map43.5_205Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Late Norian, 213.2 Ma)", "filename": "csv_files/Map44_210Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Mid Norian, 217.8 Ma)", "filename": "csv_files/Map44.5_215Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Early Norian, 222.4 Ma)", "filename": "csv_files/Map45_220Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Carnian/Norian 227 Ma)", "filename": "csv_files/Map45.5_225Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Carnian, 232 Ma)", "filename": "csv_files/Map46_230Ma.csv"},
    {"stratigraphic_age": "Late Triassic (Early Carnian, 233.6)", "filename": "csv_files/Map46.5_235Ma.csv"},
    {"stratigraphic_age": "Middle Triassic (Ladinian, 239.5 Ma)", "filename": "csv_files/Map47_240Ma.csv"},
    {"stratigraphic_age": "Middle Triassic (Anisian, 244.6 Ma)", "filename": "csv_files/Map48_245Ma.csv"},
    {"stratigraphic_age": "Permo-Triassic Boundary (252 Ma)", "filename": "csv_files/Map49_250Ma.csv"},
    {"stratigraphic_age": "Late Permian (Lopingian, 256 Ma)", "filename": "csv_files/Map50_255Ma.csv"},
    {"stratigraphic_age": "Late Middle Permian (Capitanian, 262.5 Ma)", "filename": "csv_files/Map51_260Ma.csv"},
    {"stratigraphic_age": "Middle Permian (Wordian/Capitanian Boundary 265.1 Ma)", "filename": "csv_files/Map51.5_265Ma.csv"},
    {"stratigraphic_age": "Middle Permian (Roadian&Wordian, 268.7 Ma)", "filename": "csv_files/Map52_270Ma.csv"},
    {"stratigraphic_age": "Early Permian (Late Kungurian, 275 Ma)", "filename": "csv_files/Map53_275Ma.csv"},
    {"stratigraphic_age": "Early Permian (Early Kungurian, 280 Ma)", "filename": "csv_files/Map53.5_280Ma.csv"},
    {"stratigraphic_age": "Early Permian (Artinskian, 286.8 Ma)", "filename": "csv_files/Map54_285Ma.csv"},
    {"stratigraphic_age": "Early Permian (Sakmarian, 292.6 Ma)", "filename": "csv_files/Map55_290Ma.csv"},
    {"stratigraphic_age": "Early Permian (Asselian, 297 Ma)", "filename": "csv_files/Map56_295Ma.csv"},
    {"stratigraphic_age": "Late Pennsylvanian (Gzhelian, 301.3 Ma)", "filename": "csv_files/Map57_300Ma.csv"},
    {"stratigraphic_age": "Late Pennsylvanian (Kasimovian, 305.4 Ma)", "filename": "csv_files/Map58_305Ma.csv"},
    {"stratigraphic_age": "Middle Pennsylvanian (Moscovian, 311.1 Ma)", "filename": "csv_files/Map59_310Ma.csv"},
    {"stratigraphic_age": "Early/Middle Carboniferous (Baskirian/Moscovian boundary, 314.6 Ma)", "filename": "csv_files/Map60_320Ma.csv"},
    {"stratigraphic_age": "Early Pennsylvanian (Bashkirian, 319.2 Ma)", "filename": "csv_files/Map61_325Ma.csv"},
    {"stratigraphic_age": "Late Mississippian (Serpukhovian, 327 Ma)", "filename": "csv_files/Map61.5_327Ma.csv"},
    {"stratigraphic_age": "Late Mississippian (Visean/Serpukhovian boundary, 330.9 Ma)", "filename": "csv_files/Map62_330Ma.csv"},
    {"stratigraphic_age": "Middle Mississippian (Late Visean, 333 Ma)", "filename": "csv_files/Map62.5_335Ma.csv"},
    {"stratigraphic_age": "Middle Mississippian (Middle Visean, 338.8Ma)", "filename": "csv_files/Map63_340Ma.csv"},
    {"stratigraphic_age": "Middle Mississippian (Early Visean, 344 Ma)", "filename": "csv_files/Map63.5_345Ma.csv"},
    {"stratigraphic_age": "Early Mississippian (Late Tournaisian, 349 Ma)", "filename": "csv_files/Map64_350Ma.csv"},
    {"stratigraphic_age": "Early Mississippian (Early Tournaisian, 354Ma)", "filename": "csv_files/Map64.5_355Ma.csv"},
    {"stratigraphic_age": "Devono-Carboniferous Boundary (358.9 Ma)", "filename": "csv_files/Map65_360Ma.csv"},
    {"stratigraphic_age": "Late Devonian (Middle Famennian, 365.6 Ma)", "filename": "csv_files/Map65.5_365Ma.csv"},
    {"stratigraphic_age": "Late Devonian (Early Famennian, 370 Ma)", "filename": "csv_files/Map66_370Ma.csv"},
    {"stratigraphic_age": "Late Devonian (Late Frasnian, 375 Ma)", "filename": "csv_files/Map66.5_375Ma.csv"},
    {"stratigraphic_age": "Late Devonian (Early Frasnian, 380 Ma)", "filename": "csv_files/Map67_380Ma.csv"},
    {"stratigraphic_age": "Middle Devonian (Givetian, 385.2 Ma)", "filename": "csv_files/Map67.5_385Ma.csv"},
    {"stratigraphic_age": "Middle Devonian (Eifelian, 390.5 Ma)", "filename": "csv_files/Map68_390Ma.csv"},
    {"stratigraphic_age": "Early Devonian (Late Emsian, 395 Ma)", "filename": "csv_files/Map69_395Ma.csv"},
    {"stratigraphic_age": "Early Devonian (Middle Emsian, 400 Ma)", "filename": "csv_files/Map70_400Ma.csv"},
    {"stratigraphic_age": "Early Devonian (Early Emsian, 405 Ma)", "filename": "csv_files/Map70.5_405Ma.csv"},
    {"stratigraphic_age": "Early Devonian (Pragian, 409.2 Ma)", "filename": "csv_files/Map71_410Ma.csv"},
    {"stratigraphic_age": "Early Devonian (Lochkovian, 415 Ma)", "filename": "csv_files/Map72_415Ma.csv"},
    {"stratigraphic_age": "Late Silurian (Pridoli, 421.1 Ma)", "filename": "csv_files/Map73_420Ma.csv"},
    {"stratigraphic_age": "Late Silurian (Ludlow, 425.2 Ma)", "filename": "csv_files/Map74_425Ma.csv"},
    {"stratigraphic_age": "Middle Silurian (Wenlock, 430.4 Ma)", "filename": "csv_files/Map75_430Ma.csv"},
    {"stratigraphic_age": "Early Silurian (Late Llandovery, 436 Ma)", "filename": "csv_files/Map75.5_435Ma.csv"},
    {"stratigraphic_age": "Early Silurian (Early Llandovery, 441.2 Ma)", "filename": "csv_files/Map76_440Ma.csv"},
    {"stratigraphic_age": "Late Ordovician (Hirnantian, 444.5 Ma)", "filename": "csv_files/Map77_445Ma.csv"},
    {"stratigraphic_age": "Late Ordovician (Katian, 449.1 Ma)", "filename": "csv_files/Map78_450Ma.csv"},
    {"stratigraphic_age": "Late Ordovician (Sandbian, 455.7 Ma)", "filename": "csv_files/Map79_455Ma.csv"},
    {"stratigraphic_age": "Middle Ordovician (Late Darwillian,460 Ma)", "filename": "csv_files/Map80_460Ma.csv"},
    {"stratigraphic_age": "Middle Ordovician (Early Darwillian,465 Ma)", "filename": "csv_files/Map80.5_465Ma.csv"},
    {"stratigraphic_age": "Early Ordovician (Floian/Dapingianboundary, 470 Ma)", "filename": "csv_files/Map81_470Ma.csv"},
    {"stratigraphic_age": "Early Ordovician (Late Early Floian, 475 Ma)", "filename": "csv_files/Map81.5_475Ma.csv"},
    {"stratigraphic_age": "Early Ordovician (Tremadoc, 481.6 Ma)", "filename": "csv_files/Map82_480Ma.csv"},
    {"stratigraphic_age": "Cambro-Ordovician Boundary (485.4 Ma)", "filename": "csv_files/Map82.5_485Ma.csv"},
    {"stratigraphic_age": "Late Cambrian (Jiangshanian, 491.8 Ma)", "filename": "csv_files/Map83_490Ma.csv"},
    {"stratigraphic_age": "Late Cambrian (Pabian, 495.5 Ma)", "filename": "csv_files/Map83.5_495Ma.csv"},
    {"stratigraphic_age": "Late Middle Cambrian (Guzhangian, 498.8 Ma)", "filename": "csv_files/Map84_500Ma.csv"},
    {"stratigraphic_age": "Late Middle Cambrian (Early Epoch 3, 505 Ma)", "filename": "csv_files/Map84.1_505Ma.csv"},
    {"stratigraphic_age": "Early Middle Cambrian (Late Epoch 2, 510 Ma)", "filename": "csv_files/Map84.2_510Ma.csv"},
    {"stratigraphic_age": "Early Middle Cambrian (Middle Epoch 2, 515 Ma)", "filename": "csv_files/Map85_515Ma.csv"},
    {"stratigraphic_age": "Early/Middle Cambrian boundary (520 Ma)", "filename": "csv_files/Map86_520Ma.csv"},
    {"stratigraphic_age": "Early Cambrian (Late Terreneuvian, 525 Ma)", "filename": "csv_files/Map86.5_525Ma.csv"},
    {"stratigraphic_age": "Early Cambrian (Middle Terreneuvian, 530 Ma)", "filename": "csv_files/Map87_530Ma.csv"},
    {"stratigraphic_age": "Early Cambrian (Early Terreneuvian, 535 Ma)", "filename": "csv_files/Map87.5_535Ma.csv"},
    {"stratigraphic_age": "Cambrian/Precambrian boundary (541 Ma)", "filename": "csv_files/Map88_540Ma.csv"}
  ]

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
controls.zoomSpeed = 0.5;
//ontrols.autoRotate = true;
//controls.autoRotateSpeed = 0.5;
controls.screenSpacePanning = true;

// set cam default
camera.position.set(0, 0, 200);
controls.update();

// get the default csv file
fetch(`/csv53`)
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
            mapTitle.textContent = `${maps[index].stratigraphic_age}`;
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
            color = new THREE.Color(0x2d7548);
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
