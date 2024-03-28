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
            const sliderValue = document.getElementById("sliderValue");
            sliderValue.textContent = `Map: ${slider.value}`;

            // get the csv file
            fetch(`/csv${slider.value - 1}`)
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
    console.log(`${lines.length}`);
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
        // set color based on sea level
        if (elevation >= -11000 && elevation < -3000) {
            // blue sea level
            color = new THREE.Color(0x1f2d47);
        } 
        else if (elevation >= -5000 && elevation <= seaLevel)
            // blue sea level
            color = new THREE.Color(0x2a3c63);

        else if (elevation > seaLevel && elevation < 500) {
            // forest green
            color = new THREE.Color(0x347a2a);
        }   
        else {
            color = new THREE.Color(0x615446);
        }
        // Set the color for each vertex
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
