import pygplates
import matplotlib.pyplot as plt
import numpy as np
import re
# my module
import maps

def reconstruct_and_plot(edges, rotations, time, output_file):
    # load files and reconstruct based on time
    edges = pygplates.FeatureCollection(edges)
    rotations = pygplates.RotationModel(rotations)
    reconstructed_features = []
    pygplates.reconstruct(edges, rotations, reconstructed_features, time)

    # create a map figure with an equirectangular projection to match planet textures
    fig, ax = plt.subplots(figsize=(20, 10), dpi=100)

    # plot features
    for feature in reconstructed_features:
        geometry = feature.get_reconstructed_geometry()
        if isinstance(geometry, pygplates.GeometryOnSphere):
            try:
                points = geometry.to_lat_lon_array()
                ax.plot(points[:, 1], points[:, 0], color='black', linewidth=1)
            except AttributeError:
                # case where to_lat_lon_array() is not available
                for geometry_part in geometry.get_parts():
                    points = geometry_part.to_lat_lon_array()
                    ax.plot(points[:, 1], points[:, 0], color='black', linewidth=1)

    # remove axis grid, ticks, labels, spines, set limits so entire map is visible
    ax.grid(False)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.set_xlim(-180, 180)
    ax.set_ylim(-90, 90)
    # remove plot padding
    plt.tight_layout(pad=0)

    # save plot as transparent image
    plt.savefig(output_file, bbox_inches='tight', pad_inches=0, dpi=100, transparent=True)
    plt.close()
    print(f"Saved plot to {output_file}")


def main():
    political_boundaries_file = './inputg/PALEOMAP_PoliticalBoundaries.gpml'
    plates_file = './inputg/PALEOMAP_PlatePolygons.gpml'
    rotation_model_file = './inputg/PALEOMAP_PlateModel.rot'

    times = get_reconstruction_times()

    for i, time in enumerate(times):
        output_file = f'./outputg/boundaries{i+1}.png'
        #output_file = f'./outputg/plates{i+1}.png'
        reconstruct_and_plot(political_boundaries_file, rotation_model_file, time, output_file)
        #reconstruct_and_plot(plates_file, rotation_model_file, time, output_file)


def get_reconstruction_times():  
    mapnames = maps.mapnames()
    times = []
    for m in mapnames:
        '''
        numbers = re.findall(r'\d+\.?\d*', m)
        if numbers:
            print(f"{m} -- {numbers[0]}")
        '''
        result = re.findall(r'\((.*?)\)', m)
        r = 0
        if result:
            if ',' in result[0]:
                r = result[0].split(',', 1)[1].strip()
            else:
                r = result[0]
            numbers = re.findall(r'\d+\.?\d*', r)
            if numbers:
                #print(f"{m.ljust(75)} {numbers[0]}")
                times.append(float(numbers[0]))
    
    #for t in times:
    #    print(t)

    return times



if __name__ == "__main__":
    main()
