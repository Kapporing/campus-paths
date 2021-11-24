package server;

import com.google.gson.Gson;
import pathfinder.CampusMap;
import pathfinder.datastructures.Path;
import pathfinder.datastructures.Point;
import pathfinder.parser.CampusBuilding;
import pathfinder.textInterface.CoordinateProperties;
import pathfinder.textInterface.Direction;
import server.utils.CORSFilter;
import spark.Spark;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SparkServer {

    public static void main(String[] args) {
        CORSFilter corsFilter = new CORSFilter();
        corsFilter.apply();
        // The above two lines help set up some settings that allow the
        // React application to make requests to the Spark server, even though it
        // comes from a different server.

        CampusMap map = new CampusMap();
        Gson gson = new Gson();

        Spark.get("/", (req, res) -> "Hello World!");

        Spark.post("/path", (req, res) -> {
            String start = req.queryParams("start");
            String end = req.queryParams("end");
            if (start.isEmpty() && end.isEmpty()) {
                res.status(418);
                return "The server refuses to brew coffee because it is, permanently, a teapot.\n" +
                        "(Both points are empty!)";
            }
            if (start.isEmpty() || !map.shortNameExists(start)) {
                res.status(400);
                return "Starting Point is empty";
            }
            if (end.isEmpty() || !map.shortNameExists(end)) {
                res.status(400);
                return "Ending Point is empty";
            }
            Path<Point> shortestPath = map.findShortestPath(start, end);
            // If no path is found
            if (shortestPath == null) {
                return gson.toJson(new PathResponse(start, end, new Path<>(new Point(-1, -1))));
            } else {
                return gson.toJson(new PathResponse(start, end, shortestPath));
            }
        });

        Spark.post("/buildings", (req, res) -> gson.toJson(new BuildingResponse(map.buildingsList(), map.buildingNames())));
    }

    private static class BuildingResponse {
        private final Map<String, String> buildingNames;
        private final Set<CampusBuilding> buildings;

        public BuildingResponse(Set<CampusBuilding> buildings, Map<String, String> buildingNames) {
            this.buildings = buildings;
            this.buildingNames = buildingNames;
        }
    }

    private static class PathResponse {
        private final Path<Point> path;
        private final List<String> directions;

        public PathResponse(String start, String end, Path<Point> path) {
            this.path = path;
            List<String> dirs = new ArrayList<>();
            dirs.add("Path from " + start + " to " + end);
            for(Path<Point>.Segment pathSegment : path) {
                Direction dir = Direction.resolveDirection(pathSegment.getStart().getX(),
                        pathSegment.getStart().getY(),
                        pathSegment.getEnd().getX(),
                        pathSegment.getEnd().getY(),
                        CoordinateProperties.INCREASING_DOWN_RIGHT);
                dirs.add(String.format("\tWalk %.0f feet %s",
                        pathSegment.getCost(),
                        dir.name()));
            }
            dirs.add(String.format("Total distance: %.0f feet", path.getCost()));
            this.directions = dirs;
        }
    }
}


