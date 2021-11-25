# campus-paths

A Web Application for finding the shortest path between 2 buildings on UW.

## Overview:
The campus-paths application works by setting up a server with the details on what buildings
are available and the shortest path between them. On the Front-End side made with ReactJS,
the user can clink on points that represent the buildings as well as select which entrance
to start from. In addition, there are additional options on how the path will be rendered.

## Live Demo
Visit the website [here](https://kapporing.github.io/campus-paths/) for a live demo. Spark server hosted on EC2, front-end react app hosted on GH-pages

## How to get it working:
1. Start the Spark Server. This can be done by opening campus-paths/src/main/java/server/SparkServer.java in an IDE and starting it up.

2. Open the front-end side. This can be done either by
	- Opening campus-paths/front-end/build/index.html
	or
	- Open the campus-paths/front-end/ folder and using a shell, type 'npm install && npm start'
## Usage:
Starting Point and Ending Point represent which 2 points to find the path into

Once both have been filled using the drop-down menu, click on 'Find Path' to display the path between them

Additionally, you can clear the paths by clicking on 'Clear'

the Options drop-down menu provides additional features in pathfinding such as
Animating the path so far based on the directions given and allowing the path to be drawn
in rainbow color
