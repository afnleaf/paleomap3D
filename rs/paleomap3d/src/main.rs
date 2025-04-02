#[allow(unused_variables)]
#[allow(dead_code)]

fn main() -> Result<(), netcdf::Error> {
    let file = netcdf::open("../../data_raw/netcdf_1/Map01_PALEOMAP_1deg_Holocene_0Ma.nc")?;
    print_file_content(&file);
    let (mut data, height, width) = get_data(&file).unwrap();
    print_data(&data, &height, &width);
    write_to_file("test.bin", data);
    //println!("{:?}", data);

    Ok(())
}


fn get_data(
    file: &netcdf::File
) -> Result<(Vec<i16>, usize, usize), netcdf::Error> {
    let var = file.variable("z").unwrap();
    let elevation_data = var.get::<f64, _>(..).unwrap();
    println!("Elevation data shape: {:?}", elevation_data.shape());
    println!("{} {}", elevation_data.shape()[0], elevation_data.shape()[1]);

    let s = elevation_data.shape();
    let i = s[0] as usize;
    let j = s[1] as usize;
    let n = i*j;
    println!("{}", n);
    let mut data: Vec<i16> = Vec::with_capacity(n as usize);

    for i in 0..i {
        for j in 0..j {
            let c = elevation_data[[i, j]] as i16;
            //println!("Elevation at {},{}: {:?}", i, j, c);
            data.push(c);
        }
    }

    Ok((data, i, j))
}

fn write_to_file(
    path: &str,
    data: Vec<i16>
) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = std::fs::File::create(path).unwrap();
    let bytes: Vec<u8> = data.iter()
        .flat_map(|&x| x.to_le_bytes()).collect();
    std::io::Write::write_all(&mut file, &bytes).unwrap();
    Ok(())
}

fn print_data(
    data: &Vec<i16>,
    height: &usize,
    width: &usize,
) {
    for i in 0..*height {
        for j in 0..*width {
            let c = data[i * (*width) + j];
            println!("Elevation at {},{}: {:?}", i, j, c);
            //println!("lat:{} lon:{} ele:{}", i, j, c);
        }
    }
}

fn print_file_content(file: &netcdf::File) {
    println!("{:?}", file);
    println!{"Dimensions:"}; 
    for dim in file.dimensions() {
        println!("  Name: {}, Length: {}", dim.name(), dim.len());
    }
    println!{"Variables:"}; 
    for var in file.variables() {
        println!("  Name: {}", var.name());
        println!("  Dimensions: {:?}", var.dimensions());
        println!("  Attributes:");
        for attr in var.attributes() {
            println!("    {}: {:?}", attr.name(), attr.value());
        }
        // Try to get shape and sample data
        if let Ok(data) = var.get::<i32, _>(..) {
            println!("  Shape: {:?}", data.shape());
            println!("  First few values: {:?}", data.as_slice().unwrap().iter().take(5).collect::<Vec<_>>());
        } else {
            println!("  Could not get data, check variable type or dimensions.");
        }
    }

}
