# A Visualization Tool for GeoSpatial SD Models

Simply developing a model or simulation of a real-world system is only the first step in leveraging the power of simulation to support informed decision-making. Results that are generated must be communicated in an easy to understand manner, and one way to accomplish that is through visualizations. Without properly communicating the results of modeling and simulation efforts, that information may not be properly leveraged in the decision-making process. Furthermore, well-designed visualizations can be used to improve reasoning about the quantitative information that is produced by system dynamics models.

Instead of case-by-case visualization (which is what so many modeling projects have done), this tool enables the display of data generated from geo-spatial system dynamics models. It is generic enough to support many models with limited configuration work. Geo-spatial models can include topics from migration to regional or global economic patterns to climate change impact models and much more. The grand challenges faced with these topics are overwhelming. By providing a tool that helps with results visualization, it is that much simpler to make models and results more easily understandable and therefore simpler to operationalize.

(In-Progress Site)[https://eebart.github.io/mapmodelviz/]

![Tool Screenshot](/images/screenshot.png)

## Data Requirements
MapModelViz uses two sources of data: time-based model data and GeoJSON data for building choropleth vizualizations.

### Model Data
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

### GeoJSON Data
This data is paired with a GeoJSON dataset. GeoJSON data can be found through several sources online, both high and low resolution. Of course, the higher the resolution, the longer the loading time for the tool. There are a couple of key requirements for GeoJSON data format:

- The top-level is a dictionary with two objects: "type" and "features".
- The "features" object must be an array of features, each with at least a "type" string property, "geometry" object property (which includes "type" and "coordinates"), and a "properties" object.
- The "properties" object should have at least one elements: an ID that corresponds to the ID column in model data (Geo_ID in the example used in these docs). Optionally, "properties" can include a display name property.

Most of what is described is standard GeoJSON format. The ID *must* belong to the "properties" object, as described.

### Data Preparation
Though there will almost always be work that is specific to each case, a notebook has been included that prepares the proper formats for both model and GeoJSON data as a starting point. See the `data_preparation\` folder of this repository.

## Basic MapModelViz Use
MapModelViz is configured through the "Configure MapModelViz" button. Add new data through "Add New Model Dataset", which displays the form below.

![New Model](/images/newmodel.png)

The mapped property field should be the property that you want to view in choropleth form on the map view (`total_pop`, `number_phones`, or `water_usage` in the example earlier). The Geo ID Property is the name of the common property that is shared between model and GeoJSON data. The Geo Display property is the name of the optional display name property from GeoJSON data.

The last three properties, color scheme, scale, and data display control configure the display details in MapModelViz. First, color scheme assigns a choropleth setting for the configuration. There are several settings available, all taken from [ColorBrewer](http://colorbrewer2.org), developed by Cynthia Brewer, Mark Harrower and The Pennsylvania State University. Below is a sample of the choropleth selection tool.

![Choropleth Options](/images/choropleth.png)

Next, the scale represents how choropleth buckets are determined and chart axes are calculated with: linear or logorithmic. Finally, the data display property determines which configured model data is displayed in the choropleth (through Primary) and which are displayed in specific region-based charts in the details pane (Secondary). Multiple model data sets can be considered secondary, which allows you to potentially compare multiple policy options. However, only one model data set can be Primary at a time, as this is what determines what is displayed in the map on the left.

### Map Details
The map display on the left is built with Leaflet, with Esri support. The legend on the lower left, is automatically generated and indicates the current choropleth settings. Included is a slider, which allows you to manually explore the changing choropleth values over time. Playback is also supported and allows you to watch the changes over time without manual navigation.

You can select any region that is provided in the map view, which will display individual charts of the data for that specific region over time. Included in this detailed view are charts of other properties included in the model data that aren't the primary property. The larger chart is initially set to be what is shown as the choropleth data. If you would like to change this (because you used normalized data for the choropleth and you want to look at overall numbers as the primary large chart, for example), you can edit which charts are displayed and at what size (primary is the larger size and will be displayed on top, secondary is the smaller size and will be displayed underneath any primary charts).

The details view is also where you can compare the primary model data set to secondary data sets, as specified in the MapModelViz configuration. This allows you to compare, for example, the effects of a policy decision or a different uncertainty setting on trends in data for a specific region.

## Advanced MapModelViz Use
As MapModelViz is freely available on GitHub, it can also be further customized or embedded into your own sites. In this way, you can host static content that is made available for anyone to view and interact with. To ease this process, the MapModelViz site hosted on GitHub includes an export function in `Configure MapModelViz` that saves any configuration information as a properly structured JSON file, which can be loaded into your own site.


### To Download MapModelViz and Deploy your own Version
1. To get the source files onto your machine, you have a few options:
 - Use the Github clone or download functionality to either, well, clone the MapModelViz repository onto your local machine using the GitHub desktop client, or download a zip of the files. If you don't want to make a lot of changes to the code and aren't interested in creating a GitHub hosted version of MapModelViz yourself, then this option is probably sufficient.
  - Fork MapModelViz into your own repository, and then clone from there onto your local machine. This is the preferred option if you are planning to make a lot of changes to your own MapModelViz or you want to build a GitHub hosted site of MapModelViz.

2. If you don't already have NPM, get it. Check out the official NPM docs to do this: https://www.npmjs.com/get-npm

3. The next step is to navigate to the main directory of your copy of MapModelViz, on your local machine.
From here, run the command `npm install`. This will download all of the relevant development and production dependencies for MapModelViz.

4. Copy your exported `config.json` file (the configuration file must use this name), and relevant model data (CSV) and geoJSON files in the `src/assets/` folder of your own MapModelViz.

5. Once you have set up the `assets/` folder and made any other changes to the MapModelViz source that you would like, it's time to deploy. MapModelViz uses webpack for local deployment and production builds. This project also includes preconfigured NPM commands to simplify the build and deploy processes.

  To run a local deployment, simply enter the following command in a terminal (again, do this from the root diretor of your local MapModelViz folder)  `npm start`. This command spins up a development server, opens the MapModelViz tool in a browser, and watches for local changes as you continue to customize MapModelViz. You can use this for further development, and to verify that you have set up the configuration properly.

6. If you want to build a production version of MapModelViz to host on your own site, this is the step for you.
  - First, run the command `npm run build:prod` to build a production version of MapModelViz. The compiled code will be found in the `dist\` folder.
  - If you want to verify the build, you have to load it through a basic web server. MapModelViz will not work properly if you load the index.html file in the browser through the file system (`file:///....../index.html`).     
    - One option for a local http server is NPM's `http-server` (https://www.npmjs.com/package/http-server). You can install this globally on your machine using `npm install http-server -g`.
    - Once you've installed http-server, start it up in the root folder of MapModelViz using the command `http-server`. On startup, the command will tell the web address of your local server.
    - Load the built MapModelViz build with the following URL: `[http-server base url]\dist\index.html`.
  - Copy the contents of the `dist\` folder to wherever you want to deploy the site from. You're good to go!

7. This step describes the process for building and deploying to a GitHub page of your own. You can only do these steps if you have cloned or forked the original MapModelViz into your own repository.

  - First, run the command `npm run build:prod` to build a production version of MapModelViz. The compiled code will be found in the `dist\` folder.
  - Once you've built MapModelViz, be sure to check in the `dist\` folder to your own GitHub repository.
  - If you haven't already, configure your GitHub repository to support a GitHub page.
      - Create a branch for your repository called `gh-pages`. You can do this in many ways; check out this article for instructions: https://help.github.com/articles/creating-and-deleting-branches-within-your-repository/
      - Go to the GitHub pages section of your repository settings. Update the source settings to publish from the gh-pages branch. You don't need to select a theme or do any other configuration.  
  - Then, run the command `sh publish.sh` while in the root directory of MapModelViz in a terminal. This script will handle the process necessary to push your version of MapModelViz to the configured site.

Here's a list of all of the build and deploy commands that are preconfigured with NPM:
- `npm start`:
- `npm run build:dev` and `npm run build:prod`: Builds development and production distributions of MapModelViz that can be hosted on a simple http server.
- `npm run build:gh`: Builds a production version of MapModelViz that does not include the `assets\` folder. This command is what I use to build an unconfigured version of MapModelViz to deploy to https://eebart.github.io/mapmodelviz.
