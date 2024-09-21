# image official conda
FROM continuumio/miniconda3

WORKDIR /build

# install system dependencies for gplates
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# create conda environment
COPY environment.yml .
RUN conda env create -f environment.yml
RUN mkdir -p /build/outputg

# now bring in the scripts
COPY . .

# set the entrypoint to load
#SHELL ["conda", "run", "-n", "pygplates_py310", "/bin/bash", "-c"]
ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "pygplates_py310", "python", "script.py"]
