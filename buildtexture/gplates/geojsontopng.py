import json
import matplotlib.pyplot as plt
import geopandas as gpd

def geojson_to_png(polygon_file, polyline_file, output_file, time_period):
    # read GeoJSON files
    gdf_polygon = gpd.read_file(polygon_file)
    gdf_polyline = gpd.read_file(polyline_file)
    
    # create a new figure with a specific size
    fig, ax = plt.subplots(figsize=(20, 10), dpi=100)
    
    # plot the GeoDataFrame
    gdf_polygon.plot(ax=ax, edgecolor='gray', facecolor='none', linewidth=0.5)
    gdf_polyline.plot(ax=ax, color='black', linewidth=0.5)
    
    # remove axes
    ax.axis('off')
    
    # add a title with the time period
    #plt.title(f"{time_period}", fontsize=12, pad=20)
    
    # make the background transparent
    fig.patch.set_alpha(0)
    
    # save the figure with a transparent background
    plt.savefig(output_file, bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close()
    
    print(f"Saved plot to {output_file}")

def main():
    polygon_file = "./input/reconstructed_95.00Ma_polygon.geojson"
    polyline_file = "./input/reconstructed_95.00Ma_polyline.geojson"
    png = "./output/fileout.png"
    time_period = "95.00 Ma"
    geojson_to_png(polygon_file, polyline_file, png, time_period)

if __name__ == "__main__":
    main()
