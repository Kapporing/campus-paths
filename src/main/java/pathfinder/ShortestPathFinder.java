package pathfinder;
import pathfinder.datastructures.LabeledEdge;
import pathfinder.datastructures.LabeledGraph;
import pathfinder.datastructures.Path;

import java.util.*;

/**
 * Non-ADT Class that contains the Dijkstra's algorithm for finding shortest path in a LabeledGraph
 */
public class ShortestPathFinder {
    /*
        This class does not represent an ADT
     */

    /**
     * Finds the shortest path in {@code graph} from a start node {@code start} to an end node {@code end}
     * using Dijkstra's algorithm. Shortest path means a path from the start node to the end node with the
     * minimum-cost edges (i.e lowest weights). This algorithm also assumes that the weights are not negative.
     * <b>
     *     If the weights of the edges out of the nodes have negative values in them, this algorithm might not return
     *     the minimum-cost path between the nodes.
     * </b>
     *
     * @param graph the graph in which the start and end node lies
     * @param start the starting node
     * @param end the ending node
     * @param <E> Type of Nodes in the graph
     * @param <T> Type of Labels/Weights in the graph.
     * @return a Path object representing the shortest path from {@code start} to {@code end}
     */

    public static <E, T extends Comparable<T>> Path<E> shortestPathSolver(LabeledGraph<E, T> graph, E start, E end) {
        Set<E> finished = new HashSet<>();      // Represents the set of nodes we've visited
        Comparator<Path<E>> comparator = Comparator.comparingDouble(Path::getCost);     // Create a new comparator based on cost of Path
        PriorityQueue<Path<E>> fringe = new PriorityQueue<>(comparator);     // PriorityQueue of nodes we'll be popping off from

        // Add the starting node
        fringe.add(new Path<>(start));

        // General idea is to pop off the first item on the fringe with the lowest cost and then
        // extend it by all the edges off the last node at the end of the path and repeat
        // until the edge node has been found. If the path's ending node has already been visited,
        // (i.e in the finished set) then we don't extend it, since we've already visited it and found the minimum cost
        // path for it.
        while (!fringe.isEmpty()) {
            Path<E> minPath = fringe.poll();
            E minDest = minPath.getEnd();
            if (minDest.equals(end)) {
                return minPath;
            }
            if (finished.contains(minDest)) {
                continue;
            }
            for (LabeledEdge<E, T> edge : graph.listEdgesOut(minDest)) {
                E child = edge.to();
                if (!finished.contains(child)) {
                    Path<E> newPath = minPath.extend(child, (Double) edge.label());
                    fringe.add(newPath);
                }
            }
            finished.add(minDest);
        }
        return null;
    }
}
