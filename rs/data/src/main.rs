/*
* main.rs 
* simple pipeline to create all the low resolution maps from netcdf
* in: netcdf
* out: brotli compressed raw elevation buffer (grid)
* have to store: names?, latlon system?
* or just hardcode that in the visualization
*
* this code is pretty janky, but because you only really need to run it once
* it doesn't matter (for now?)
*
* the part that matters is how we wrote the data to the file
* outer for 0 to 181 
* inner for 0 to 361
*
* ok update, we will flatten to one big brotli file rather than 109 little
* ones that then get combined in the actual program.
*
*/

#![allow(unused_variables)]
#![allow(dead_code)]

use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::time::Instant;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let dir = PathBuf::from("../../data_raw/deg06");

    let mut file_names: Vec<String> = fs::read_dir(dir)?
        .filter_map(|f| f.ok())
        .filter(|f| f.path().is_file())
        .filter_map(|f| f.file_name().into_string().ok())
        .filter(|f| f.ends_with(".nc"))
        .collect();
    file_names.sort();

    // big flat data
    let mut big = Vec::new();
    // loop through each file we have
    for (count, map_file) in file_names.iter().enumerate() {
        println!("{}: {}", count, map_file);
        let u = map_file
            .chars()
            .enumerate()
            .filter(|(_, c)| *c == '_')
            .map(|(i, _)| i)
            .collect::<Vec<_>>();
        println!("{:?}", u);
        let s = &map_file[u[2]+1..map_file.len()-3];
        let f1 = &s.replace(" ", "_");
        let f2 = &s.replace("_", " ");
        println!("{}", f2);
        //let new_file_name = PathBuf::from(format!("{}_{}", count+1, f1));
        //let new_file_name = PathBuf::from(format!("{}", count+1));
        //println!("processing: {:?}", &new_file_name);
        println!("processing: {:?}", &map_file);
        let fp = PathBuf::from(format!("../../data_raw/deg06/{}", map_file));
        let file = netcdf::open(fp).unwrap();
        //print_file_content(&file);
        let (data, height, width) = get_data(&file).unwrap();
        // then concat in memory
        big.extend(data);
        //main2(map_file, new_file_name)?;
    }

    // now compress
    compress_and_write(&PathBuf::from("big6min"), &big).unwrap();

    Ok(())
}

// bad name
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
) -> Result<(), Box<dyn std::error::Error>> {
    let n_in = data.len() * 2;
    let mut compressed_buffer = Vec::new();
    let bytes: Vec<u8> = data.iter()
        .flat_map(|&x| x.to_le_bytes())
        .collect();
    let counter = Arc::new(AtomicUsize::new(0));
    let mut input = CountingRead {
        inner: std::io::Cursor::new(bytes),
        counter: counter.clone(),
    };

    let t0 = Instant::now();
    with_progress(
        &format!("compressing {:?} + brotli q11", path),
        n_in,
        counter,
        || {
            brotli::BrotliCompress(
                &mut input,
                &mut compressed_buffer,
                &brotli::enc::BrotliEncoderParams {
                    quality: 11,
                    lgwin: 24,
                    ..Default::default()
                }
            ).unwrap();
        },
    );
    println!("compressed: {} bytes ({:.1} MiB) in {:.1}s",
             compressed_buffer.len(),
             compressed_buffer.len() as f64 / 1048576.0,
             t0.elapsed().as_secs_f64());

    let mut out_file = std::fs::File::create(format!("./{}.br", path.display())).unwrap();
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

// this stuff isn't really used
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

// wraps a Read so we can watch how much brotli has pulled in from the main thread
struct CountingRead<R: std::io::Read> {
    inner: R,
    counter: Arc<AtomicUsize>,
}

impl<R: std::io::Read> std::io::Read for CountingRead<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.counter.fetch_add(n, Ordering::Relaxed);
        Ok(n)
    }
}

// run f() while a ticker thread renders "XX.X% (n.n / n.n MiB)" in place using \r,
// driven by `counter` which the wrapped reader bumps as brotli pulls bytes.
// caveat: this is input-consumed, not output-emitted. brotli reads ahead and may
// sit at ~100% while it finalizes the last block.
fn with_progress<F, R>(label: &str, total: usize, counter: Arc<AtomicUsize>, f: F) -> R
where
    F: FnOnce() -> R,
{
    use std::io::Write;
    use std::thread;
    use std::time::Duration;

    let stop = Arc::new(AtomicBool::new(false));
    let stop_t = stop.clone();
    let counter_t = counter.clone();
    let label_owned = label.to_string();
    let total_mib = total as f64 / 1048576.0;

    let handle = thread::spawn(move || {
        loop {
            if stop_t.load(Ordering::Relaxed) { break; }
            let read = counter_t.load(Ordering::Relaxed);
            let pct = ((read as f64) / (total as f64) * 100.0).min(100.0);
            let mib = read as f64 / 1048576.0;
            print!("\r{}  {:5.1}% ({:6.1} / {:6.1} MiB)", label_owned, pct, mib, total_mib);
            std::io::stdout().flush().ok();
            thread::sleep(Duration::from_millis(250));
        }
    });
    let r = f();
    stop.store(true, Ordering::Relaxed);
    handle.join().ok();
    // wipe the in-place progress line so the caller's println starts fresh
    print!("\r{}\r", " ".repeat(120));
    std::io::stdout().flush().ok();
    r
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

