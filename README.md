# A Visualization Tool for GeoSpatial SD Models

Simply developing a model or simulation of a real-world system is only the first step in leveraging the power of simulation to support informed decision-making. Results that are generated must be communicated in an easy to understand manner, and one way to accomplish that is through visualizations. Without properly communicating the results of modeling and simulation efforts, that information may not be properly leveraged in the decision-making process. Furthermore, well-designed visualizations can be used to improve reasoning about the quantitative information that is produced by system dynamics models.

Instead of case-by-case visualization (which is what so many modeling projects have done), this tool enables the display of data generated from geo-spatial system dynamics models. It is generic enough to support many models with limited configuration work. Geo-spatial models can include topics from migration to regional or global economic patterns to climate change impact models and much more. The grand challenges faced with these topics are overwhelming. By providing a tool that helps with results visualization, it is that much simpler to make models and results more easily understandable and therefore simpler to operationalize.

(In-Progress Site)[https://eebart.github.io/mapmodelviz/]

![Tool Screenshot](/images/screenshot.png)

## Data Requirements
MapModelViz uses two sources of data: time-based model data and GeoJSON data for building choropleth vizualizations.

The model data must be a CSV document with the following column structure:

- Column One: Key that connects model data to GeoJSON regions.
- Column Two: Region name (Country, Province, State, etc.)
- Column Three: Column name is Time and contents of the column are the names of properties to be mapped
- Columns Four through N: Column headers are the time series labels. Row contents are the values of each property evaluated over the time series.

Here's an example in table form. Notice how the time series data is saved as column headers led by a header called Time, which lines up with the names of properties that the data represents.

| Geo_ID        | Country       | Time          | 2000          | 2001          | 2002          | ...           | 
| ------------- | ------------- | ------------- | ------------- | ------------- | ------------- | ------------- | 
| USA | United States | total_pop | 500 | 596 | 795 | ... | 
| USA | United States | number_phones | 500 | 596 | 795 | ... | 
| USA | United States | water_usage | 500 | 596 | 795 | ... | 
| NED | United States | total_pop | 500 | 596 | 795 | ... | 
| NED | United States | number_phones | 500 | 596 | 795 | ... | 
| NED | United States | water_usage | 500 | 596 | 795 | ... | 

This data is paired with a GeoJSON dataset. GeoJSON data can be found through several sources online, both high and low resolution. Of course, the higher the resolution, the longer the loading time for the tool. There are a couple of key requirements for GeoJSON data format:

- The top-level is a dictionary with two objects: "type" and "features".
- The "features" object must be an array of features, each with at least a "type" string property, "geometry" object property (which includes "type" and "coordinates"), and a "properties" object.
- The "properties" object should have at least one elements: an ID that corresponds to the ID column in model data (Geo_ID in the example used in these docs). Optionally, "properties" can include a display name property.

Most of what is described is standard GeoJSON format. The ID *must* belong to the "properties" object, as described.

#### Data Preparation
Though there will almost always be work that is specific to each case, a notebook has been included that prepares the proper formats for both model and GeoJSON data as a starting point. See the `data_preparation\` folder of this repository.

## Basic MapModelViz Use
MapModelViz is configured through the "Configure MapModelViz" button. Add new data through "Add New Model Dataset", which displays the form below.

![New Model](/images/newmodel.png)

The mapped property field should be the property that you want to view in choropleth form on the map view (`total_pop`, `number_phones`, or `water_usage` in the example earlier). The Geo ID Property is the name of the common property that is shared between model and GeoJSON data. The Geo Display property is the name of the optional display name property from GeoJSON data.

The last three properties, color scheme, scale, and data display control configure the display details in MapModelViz. First, color scheme assigns a choropleth setting for the configuration. There are several settings available, all taken from [ColorBrewer](http://colorbrewer2.org), developed by Cynthia Brewer, Mark Harrower and The Pennsylvania State University. Below is a sample of the choropleth selection tool.

![Choropleth Options](/images/choropleth.png)

Next, the scale represents how choropleth buckets are determined and chart axes are calculated with: linear or logorithmic. Finally, the data display property determines which configured model data is displayed in the choropleth (through Primary) and which are displayed in specific region-based charts in the details pane (Secondary). Multiple model data sets can be considered secondary, which allows you to potentially compare multiple policy options. However, only one model data set can be Primary at a time, as this is what determines what is displayed in the map on the left.

## Map Details
The map display on the left is built with Leaflet, with Esri support. The legend on the lower left, is automatically generated and indicates the current choropleth settings. Included is a slider, which allows you to manually explore the changing choropleth values over time. Playback is also supported and allows you to watch the changes over time without manual navigation.

You can select any region that is provided in the map view, which will display individual charts of the data for that specific region over time. Included in this detailed view are charts of other properties included in the model data that aren't the primary property (indicated as Mapped Property in the model data configuration). The details view is also where you can compare the primary model data set to secondary ones, as specified in the MapModelViz configuration.

## Advanced MapModelViz Use
As MapModelViz is freely available on GitHub, it can also be further customized or embedded into your own sites. In this way, you can host static content that is available for anyone to view and interact with. To ease this process, the MapModelViz site hosted on GitHub includes an export function in `Configure MapModelViz` that saves any configuration information as a JSON file, which can be loaded into your own site.

First, fork and download MapModelViz to your machine. Include your exported `config.json` file (the configuration file must use this name), and relevant model data (CSV) and geoJSON files in the `src/assets/` folder of your own MapModelViz. This tool is configured with npm and WebPack, a common JavaScript bundler. Already included are a few essential commands for building and running MapModelViz:

- `npm start`: Spins up a development server and watches for local changes as you customize MapModelViz
- `npm run build:dev` and `npm run build:prod`: Builds development and production distributions of MapModelViz that can be hosted on a simple http server.
- `publish.sh`: After building a distribution, you can set up and publish a website hosted by github using this script. All you have to do is configure your GitHub repository to publish a GitHub page using the gh-pages branch, build a development or production distribution, check that distribution into your main branch, and then run the script `publish.sh`.
