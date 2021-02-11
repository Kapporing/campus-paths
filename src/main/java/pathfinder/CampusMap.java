package pathfinder;

import pathfinder.datastructures.LabeledGraph;
import pathfinder.datastructures.Path;
import pathfinder.datastructures.Point;
import pathfinder.parser.CampusBuilding;
import pathfinder.parser.CampusPath;
import pathfinder.parser.CampusPathsParser;

import java.util.*;

/**
 *  This class represents the Model interface of the PathFinder app. It handles most of the
 *  back-end work of the app when it's called by the Controller, returns the result and will then
 *  be showed by the View. It does things such as store the graph in memory and provide methods to access
 *  information about the graph, including finding the shortest path.
 *  This class also represents an immutable representation of LabeledGraph using Points
 */

public class CampusMap implements ModelAPI {

    /**
     *  AF:
     *      AF(this) = campus map parsed from campus_buildings.tsv and campus_paths.tsv
     *      that utilizes the LabeledGraph class to store Points of interests in the campus as a graph.
     *      with edges as doubles.
     *      pointToBuildings = {p1=b1 ... pN=bN} for each campus buildings, where pI is the point representation of the building
     *      shortNameToPoint = {s1=p1 ... sN=pN} for each campus building, where sI is the short name representation of the building
     *                                           and pI is the point representation of the building
     *
     *  RI:
     *      this.graph != null
     *      this.pointToBuildings != null   && this.pointToBuildings.size() == this.shortNameToPoint.size()
     *      this.shortNameToPoint != null   && this.shortNameToPoint.size() == this.pointToBuildings.size()
     */
    private final LabeledGraph<Point, Double> graph;
    Map<Point, CampusBuilding> pointToBuildings;
    Map<String, Point> shortNameToPoint;
    Map<ShortestPathPair<String, String>, Path<Point>> shortestPathMap;
    Set<CampusBuilding> buildings;

    /**
     * Constructs a graph using the campus_buildings.tsv and campus_paths.tsv files
     *
     * @spec.effects construct a graph using campus_buildings.tsv and campus_paths.tsv files
     * @throws pathfinder.parser.CampusPathsParser.ParserException if the file cannot be found
     */
    public CampusMap() {
        this.graph = new LabeledGraph<>();
        this.pointToBuildings = new HashMap<>();
        this.shortNameToPoint = new HashMap<>();
        this.shortestPathMap = new HashMap<>();
        this.buildings = new HashSet<>();
        List<CampusBuilding> buildings = CampusPathsParser.parseCampusBuildings("campus_buildings.tsv");
        List<CampusPath> paths = CampusPathsParser.parseCampusPaths("campus_paths.tsv");
        for (CampusBuilding b : buildings) {
            Point p = new Point(b.getX(), b.getY());
            this.buildings.add(b);
            this.pointToBuildings.put(p, b);
            this.shortNameToPoint.put(b.getShortName(), p);
            this.graph.addNode(p);
        }
        for (CampusPath path : paths) {
            Point start = new Point(path.getX1(), path.getY1());
            Point end = new Point(path.getX2(), path.getY2());
            this.graph.addNode(start);       // Since graph already checks for existing nodes, we don't have to care
            this.graph.addNode(end);         // about checking if node already exists in graph before adding
            this.graph.addEdge(start, end, path.getDistance());  // Assume reverse edge is found in csv file, so add once.
        }
        this.checkRep();
    }

    /**
     * @param shortName The short name of a building to query.
     * @return {@literal true} iff the short name provided exists in this campus map.
     */
    @Override
    public boolean shortNameExists(String shortName) {
        this.checkRep();
        return this.shortNameToPoint.containsKey(shortName);
    }

    /**
     * @param shortName The short name of a building to look up.
     * @return The long name of the building corresponding to the provided short name.
     * @throws IllegalArgumentException if the short name provided does not exist.
     */
    @Override
    public String longNameForShort(String shortName) {
        if (!shortNameExists(shortName)) {
            throw new IllegalArgumentException("Short name provided does not exist.");
        }
        this.checkRep();
        return pointToBuildings.get(shortNameToPoint.get(shortName)).getLongName();
    }

    /**
     * @return A mapping from all the buildings' short names to their long names in this campus map.
     */
    @Override
    public Map<String, String> buildingNames() {
        Map<String, String> shortToLong = new HashMap<>();
        for (String s : this.shortNameToPoint.keySet()) {
            shortToLong.put(s, longNameForShort(s));
        }
        this.checkRep();
        return shortToLong;
    }

    /**
     * Finds the shortest path, by distance, between the two provided buildings.
     *
     * @param startShortName The short name of the building at the beginning of this path.
     * @param endShortName   The short name of the building at the end of this path.
     * @return A path between {@code startBuilding} and {@code endBuilding}, or {@literal null}
     * if none exists.
     * @throws IllegalArgumentException if {@code startBuilding} or {@code endBuilding} are
     *                                  {@literal null}, or not valid short names of buildings in
     *                                  this campus map.
     */
    @Override
    public Path<Point> findShortestPath(String startShortName, String endShortName) {
        if (startShortName == null || endShortName == null
         || !shortNameExists(startShortName) || !shortNameExists(endShortName)) {
            throw new IllegalArgumentException("Invalid starting/ending location");
        }
        ShortestPathPair<String, String> startEndPair = new ShortestPathPair<>(startShortName, endShortName);
        if (shortestPathMap.containsKey(startEndPair)) {
            return shortestPathMap.get(startEndPair);
        }
        Point start = this.shortNameToPoint.get(startShortName);
        Point end = this.shortNameToPoint.get(endShortName);
        Path<Point> shortestPath = ShortestPathFinder.shortestPathSolver(this.graph, start, end);
        shortestPathMap.put(startEndPair, shortestPath);
        this.checkRep();
        return shortestPath;
    }

    /**
     * Returns a copy of the set of all buildings in the campus map
     * @return a copy of the set of all buildings in the campus map
     */
    public Set<CampusBuilding> buildingsList() {
        return new HashSet<>(this.buildings);
    }

    /**
     * Throws an exception if the representation invariant is violated
     */
    private void checkRep() {
        if (this.graph == null) {
            throw new RuntimeException("Graph cannot be null");
        }
        if (this.shortNameToPoint == null) {
            throw new RuntimeException("short name to point map cannot be null");
        }
        if (this.pointToBuildings == null) {
            throw new RuntimeException("point to buildings map cannot be null");
        }
        if (this.shortestPathMap == null) {
            throw new RuntimeException("shortest path map cannot be null");
        }
        if (this.shortNameToPoint.size() != this.pointToBuildings.size()) {
            throw new RuntimeException("shortNameToPoint map has different size than pointToBuildings map");
        }
    }
}

class ShortestPathPair<X, Y> {
    public final X start;
    public final Y end;

    public ShortestPathPair(X x, Y y) {
        this.start = x;
        this.end = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ShortestPathPair<?, ?> that = (ShortestPathPair<?, ?>) o;
        return start.equals(that.start) &&
                end.equals(that.end);
    }

    @Override
    public int hashCode() {
        return Objects.hash(start, end);
    }
}
