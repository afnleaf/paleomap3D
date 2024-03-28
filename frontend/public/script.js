// get the csv file
fetch('/csv')
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


// create a scene out of csv data
async function createScene(csvData) {
    // data to be parsed
    let vertices = [];
    let elevations = [];

    const R = 100;
    // process the data
    const lines = csvData.split("\n");
    console.log(`${lines.length}`);
    prevline = "";
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
    //console.log("test")
    //console.log(vertices);
    //console.log(elevations);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Create buffer geometry for points
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(vertices.length).fill(0), 3)); 

    //console.log(geometry)
    // colour the point with material
    const material = new THREE.PointsMaterial({
        size: 4,
        vertexColors: THREE.VertexColors
    });

    // assign elevation color to the points
    const threshold = 0;
    
    for (let i = 0; i < elevations.length; i++) {
        const elevation = elevations[i];
        let color;
        // set color based on sea level
        if (elevation < threshold) {
            // blue sea level
            color = new THREE.Color(0x2a3c63);
        } else {
            // forest green
            color = new THREE.Color(0x347a2a);
        }
        // Set the color for each vertex
        geometry.attributes.color.setXYZ(i, color.r, color.g, color.b);
    }
    // update the colours
    geometry.attributes.color.needsUpdate = true;

    // single points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // set cam default
    camera.position.set(0, 0, 150);
    controls.update();

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}
