@echo off
:: HDF5 Configuration
set HDF5_DIR=C:\Users\leaf\vcpkg\installed\x64-windows
set HDF5_LIBDIR=C:\Users\leaf\vcpkg\installed\x64-windows\lib
set HDF5_INCLUDEDIR=C:\Users\leaf\vcpkg\installed\x64-windows\include

:: NetCDF Configuration
set NETCDF_DIR=C:\Users\leaf\vcpkg\installed\x64-windows
set NETCDF_LIBDIR=C:\Users\leaf\vcpkg\installed\x64-windows\lib
set NETCDF_INCLUDEDIR=C:\Users\leaf\vcpkg\installed\x64-windows\include

:: This is the key fix - create a symbolic link to make the build script happy
mklink /D "C:\Users\leaf\vcpkg\installed\x64-windows\Library" "C:\Users\leaf\vcpkg\installed\x64-windows"

:: Add the bin directory to PATH for runtime DLL loading
set PATH=%PATH%;C:\Users\leaf\vcpkg\installed\x64-windows\bin

:: Clean and build
cargo clean
cargo run
