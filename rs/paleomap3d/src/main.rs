#![allow(unused_variables)]
#![allow(dead_code)]


use std::fs;
use std::path::PathBuf;



/*
Test, create all the low resolution maps.
*/


fn main() -> Result<(), Box<dyn std::error::Error>> {
    let dir = PathBuf::from("../../data_raw/netcdf_1");

    let file_names: Vec<String> = fs::read_dir(dir)?
        .filter_map(|f| f.ok())
        .filter(|f| f.path().is_file())
        .filter_map(|f| f.file_name().into_string().ok())
        .filter(|f| f.ends_with(".nc"))
        .collect();
    
    for (count, map_file) in file_names.iter().enumerate() {
        println!("{}: {}", count, map_file);
        let u = map_file
            .chars()
            .enumerate()
            .filter(|(_, c)| *c == '_')
            .map(|(i, _)| i)
            .collect::<Vec<_>>();
        //println!("{:?}", u);
        let s = &map_file[u[2]+1..map_file.len()-3];
        let f1 = &s.replace(" ", "_");
        let f2 = &s.replace("_", " ");
        //println!("{}", f2);
        //let new_file_name = PathBuf::from(format!("{}_{}", count+1, f1));
        let new_file_name = PathBuf::from(format!("{}", count+1));
        println!("{:?}", &new_file_name);

        main2(map_file, new_file_name)?;
    }
    
    Ok(())
}



fn main2(file_path: &str, new: PathBuf) -> Result<(), netcdf::Error> {
    println!("{}", file_path);
    //let file = netcdf::open("../../data_raw/netcdf_6/Map21_PALEOMAP_6min_Mid-Cretaceous_90Ma.nc")?;
    let fp = PathBuf::from(format!("../../data_raw/netcdf_1/{}", file_path));
    let file = netcdf::open(fp).unwrap();
    //print_file_content(&file);
    let (data, height, width) = get_data(&file).unwrap();
    compress_and_write(&new, &data).unwrap();
    //write_to_file(&new, &data).unwrap();
    //brotli_compress(&new).unwrap();


    //print_data(&data, &height, &width);
    //write_to_file("test3.bin", &data).unwrap;
    //check_file("test3.bin", &data).unwrap();
    //brotli_compress("test3.bin").unwrap();
    //println!("{:?}", data);

    Ok(())
}

fn get_data(
    file: &netcdf::File
) -> Result<(Vec<i16>, usize, usize), netcdf::Error> {
    let var = file.variable("z").unwrap();
    let elevation_data = var.get::<f64, _>(..).unwrap();
    //println!("Elevation data shape: {:?}", elevation_data.shape());
    //println!("{} {}", elevation_data.shape()[0], elevation_data.shape()[1]);

    let s = elevation_data.shape();
    let i = s[0] as usize;
    let j = s[1] as usize;
    let n = i*j;
    //println!("{}", n);
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

fn compress_and_write(
    path: &PathBuf,
    data: &Vec<i16>,
) -> Result<(), Box<dyn std::error::Error>>{
    let mut compressed_buffer = Vec::new();
    let bytes: Vec<u8> = data.iter()
        .flat_map(|&x| x.to_le_bytes())
        .collect();
    let mut input = std::io::Cursor::new(bytes);

    brotli::BrotliCompress(
        &mut input,
        &mut compressed_buffer,
        &brotli::enc::BrotliEncoderParams {
            quality: 11,
            lgwin: 22,
            ..Default::default()
        }
    ).unwrap();
    println!("brotli compressed.");

    let mut out_file = std::fs::File::create(format!("./output/{}.br", path.display())).unwrap();
    std::io::Write::write_all(&mut out_file, &mut compressed_buffer).unwrap();
    println!("file out");

    Ok(())
}


fn brotli_compress(
    //path: &str,
    path: &PathBuf
) -> Result<(), Box<dyn std::error::Error>> {
    println!("brotli compressing {:?}", path);
    
    let mut file = std::fs::File::open(path).unwrap();
    let metadata = std::fs::File::metadata(&mut file).unwrap();
    let file_size = metadata.len() as usize;
    let mut bytes = vec![0u8; file_size];
    std::io::Read::read_exact(&mut file, &mut bytes).unwrap();
    
    let mut compressed_buffer = Vec::new();
    let mut input = std::io::Cursor::new(bytes);

    brotli::BrotliCompress(
        &mut input,
        &mut compressed_buffer,
        &brotli::enc::BrotliEncoderParams {
            quality: 11,
            lgwin: 22,
            ..Default::default()
        }
    ).unwrap();
    println!("brotli compressed.");

    let mut out_file = std::fs::File::create(format!("{:?}.br", path)).unwrap();
    std::io::Write::write_all(&mut out_file, &mut compressed_buffer).unwrap();
    println!("file out");

    Ok(())
}

fn write_to_file(
    //path: &str,
    path: &PathBuf,
    data: &Vec<i16>,
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

fn check_file(
    path: &str,
    data: &Vec<i16>
) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = std::fs::File::open(path).unwrap();
    //let meta = file.metadata().unwrap();
    let metadata = std::fs::File::metadata(&mut file).unwrap();
    let file_size = metadata.len() as usize;
    let num_values = file_size / std::mem::size_of::<i16>();

    let mut bytes = vec![0u8; file_size];
    //file.read_exact(&mut bytes).unwrap();
    std::io::Read::read_exact(&mut file, &mut bytes).unwrap();
    let mut file_data = Vec::with_capacity(num_values);
    for chunk in bytes.chunks_exact(2) {
        let value = i16::from_le_bytes([chunk[0], chunk[1]]);
        file_data.push(value);
    }

    for i in 0..181 {
        for j in 0..361 {
            let a = data[i * 361 + j];
            let b = file_data[i * 361 + j];
            if a != b {
                println!("oops {} {}", a, b);
            }
        }
    }
    println!("all good");
        
    Ok(())
}
