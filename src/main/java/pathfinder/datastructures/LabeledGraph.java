package pathfinder.datastructures;

import java.util.*;

/**
 * <b>LabeledGraph</b> is a mutable graph that contains vertices with edges
 * labeled with a string to another vertex. That is, every edge in the graph
 * is labeled by a string. Labels are not unique; multiple edges may have the same label but labels cannot be empty.
 * However, no 2 edges with the same parent and child nodes will have the same edge label,
 * where children here refers to the vertices where there is an edge from the parent (i.e a vertex).
 *
 * <p>Graphs can be described as a collection of nodes (i.e vertices) and edges. Each
 * edge connects two nodes. LabeledGraph is a directed graph, meaning that edges are one-way:
 * (i.e an edge e = {A, B} indicates B is directly reachable from A).
 *
 * <p>A path is a sequence of edges {node1, node2}, {node2, node3}, {node3, node4}
 * ,... In other words, a path is an ordered list of edges, where an edge to some node
 * is immediately followed by an edge from that node.
 *
 * <p>
 *  The set of String (i.e Set&lt;String&gt; nodes) nodes represents the
 *  set of vertices present in the Graph.
 *
 *  Map&lt;String, Set&lt;LabeledEdge&gt;&gt; neighbors represents the
 *  set of children of a vertex.
 * </p>
 *
 * @param <E> represents the type of Nodes
 * @param <T>  represents the label type of the edges
 */

public class LabeledGraph<E, T extends Comparable<T>> {

    Set<E> nodes;
    Map<E, Set<LabeledEdge<E, T>>> neighbors;

    /*
        Representation Invariant:
            this.nodes != null && this.neighbors != null;
            this.nodes is equal to the keySet of neighbors;
            that is, every node must have an associated Set of LabeledEdge that represent its edges to its neighbors

            each node in nodes and neighbors must also be non-null, and each Set of LabeledEdge representing the neighbors
            must be non null.

         Abstraction Function:
            AF(this) = Directed Graph with,
            this.nodes = {}, this.neighbors = {} if graph is empty
            this.nodes = {n1 .... nN}, this.neighbors = {n1={...}, n2={...}, ..., nN={...}} otherwise,
            where n1 ... nN represents nodes in the graph and n1={...} represents node={set of neighbors}
     */

    private final static boolean DEBUG = false;

    /**
     *  Creates an Empty directed LabeledGraph
     *
     * @spec.effects  constructs an empty directed graph
     */
    public LabeledGraph() {
        this.nodes = new HashSet<>();
        this.neighbors = new HashMap<>();
    }

    /**
     *  Adds a Vertex to the graph if it does not exist.
     *
     * @param add Node to be added
     * @spec.requires {@code add} is not null
     * @spec.modifies this.nodes
     * @spec.effects adds <code>add</code> to this.nodes if not yet present, add <code>add</code> to neighbors.
     * @return true if and only if the node does not yet exist and was successfully inserted into the graph
     */
    public boolean addNode(E add) {
        this.checkRep();
        assert add != null : "Node to be added cannot be null";
        if (this.nodes.contains(add)) {
            this.checkRep();
            return false;
        }
        this.neighbors.put(add, new HashSet<>());
        this.nodes.add(add);
        this.checkRep();
        return true;
    }

    /**
     * creates an edge from <code>from</code> to <code>to</code> with
     * label <code>label</code> in the graph.
     *
     * @param from  : the parent node
     * @param to    : the child node
     * @param label : the label to put on the LabeledEdge
     * @spec.requires {@code from != null and to != null and label != null}
     * @spec.modifies this.neighbors
     * @spec.effects adds edge from <code>from</code> to <code>to</code> with label
     *          <code>label</code> to the graph if it does not already exist
     * @return  true if and only if the edge was inserted into the graph
     */
    public boolean addEdge(E from, E to, T label) {
        this.checkRep();
        assert from != null && to != null && label != null : "Node/Label cannot be empty";
        if (!this.neighbors.containsKey(from) || !this.neighbors.containsKey(to)) {
            throw new IllegalArgumentException("Node does not exist in graph");
        }
        Set<LabeledEdge<E, T>> edgeSet = this.neighbors.get(from);
        LabeledEdge<E, T> edge = new LabeledEdge<>(from, to, label);
        if (!edgeSet.contains(edge)) {
            edgeSet.add(edge);
            this.checkRep();
            return true;
        }
        this.checkRep();
        return false;
    }

    /**
     * remove an edge from <code>from</code> to <code>to</code> with
     * label <code>label</code> out of the graph.
     *
     * @param from  : the parent node
     * @param to    : the child node
     * @param label : the label to identify which edge
     * @spec.requires {@code from != null && to != null && label != null && !label.isempty()}
     * @spec.modifies this.neighbors
     * @spec.effects removes edge from <code>from</code> to <code>to</code> with label
     *          <code>label</code> to the graph if it does not already exist
     * @throws IllegalArgumentException if either node does not exist in the graph
     * @return  a copy of the edge that was removed, null if edge does not exist
     */
    public LabeledEdge<E, T> removeEdge(E from, E to, T label) {
        this.checkRep();
        assert from != null && to != null && label != null : "Nodes and Labels cannot be null";
        if (!this.neighbors.containsKey(from) || !this.neighbors.containsKey(to)) {
            throw new IllegalArgumentException("Node does not exist in graph");
        }
        Set<LabeledEdge<E, T>> edgeSet = this.neighbors.get(from);
        LabeledEdge<E, T> edge = new LabeledEdge<>(from, to, label);
        if (!edgeSet.contains(edge)) {
            return null;
        }
        edgeSet.remove(edge);
        this.checkRep();
        return edge;
    }

    /**
     * Returns the set of nodes in the graph, sorts it based on hashCode of the node type
     *
     * @return a list of nodes in the graph
     */
    public List<E> listNodes() {
        this.checkRep();
        List<E> ret = new ArrayList<>(this.nodes);
        ret.sort(Comparator.comparingInt(Object::hashCode));
        return ret;
    }

    /**
     * Returns the set of children of a given parent node
     *
     * @param parentNode the parent node to look up
     * @spec.requires {@code parentNode != null}
     * @return   set of nodes that has a directed edge from parentNode
     * @throws IllegalArgumentException if {@code parentNode} does not exist
     */
    public List<String> listChildren(E parentNode) {
        Set<LabeledEdge<E, T>> edges = this.listEdgesOut(parentNode);
        Set<String> children = new HashSet<>();
        for (LabeledEdge<E, T> edgeOut : edges) {
            children.add(edgeOut.to().toString() + "(" + edgeOut.label().toString() + ")");
        }
        List<String> ret = new ArrayList<>(children);
        Collections.sort(ret);
        return ret;
    }

    /**
     *  Returns a Set of Edges our of this node, (i.e returns the set of edges connecting parent node to children nodes)
     * @param node the parent node that we will find the edges out of
     * @spec.requires {@code node != null}
     * @return a set of edges connecting {@code node} to its children
     * @throws IllegalArgumentException if {@code node} does not exist
     */
    public Set<LabeledEdge<E, T>> listEdgesOut(E node) {
        this.checkRep();
        assert node != null : "Node to search for cannot be null";
        if (!this.neighbors.containsKey(node)) {
            throw new IllegalArgumentException("Parent node is not in the graph");
        }
        return this.neighbors.get(node);
    }
    /**
     * Returns true if and only if <code>node</code> exists in the graph
     *
     * @param node : node to look for
     * @spec.requires  {@code node != null}
     * @return  true if and only if <code>node</code> exist in the set of nodes (i.e in the graph)
     */
    public boolean contains(E node) {
        this.checkRep();
        assert node != null : "Node to search for cannot be null";
        return this.neighbors.containsKey(node);
    }

    /**
     * Returns the size of the graph (i.e the number of nodes in the graph)
     *
     * @return number of nodes in graph
     */
    public int size() {
        this.checkRep();
        return this.neighbors.size();
    }

    /**
     * Returns the number of edges in between two nodes
     *
     * @param n1 : first node
     * @param n2 : second node
     * @spec.requires {@code n1 != null && n2 != null }
     * @throws IllegalArgumentException if either node does not exist in the graph
     * @return number of edges in between the two nodes
     */
    public int numEdges(E n1, E n2) {
        this.checkRep();
        assert n1 != null && n2 != null : "Node cannot be null";
        assert neighbors.containsKey(n1) : "Node" + n1 + " is not in the graph";
        assert neighbors.containsKey(n2) : "Node" + n2 + " is not in the graph";

        int count = 0;
        for (LabeledEdge<E, T> edge : this.neighbors.get(n1)) {
            if (edge.to().equals(n2)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Returns a string representation of the graph
     *
     * @return a string representation of the graph
     */
    public String toString() {
        this.checkRep();
        return this.neighbors.toString();
    }

    /**
     * Throws an exception if the representation invariant is violated
     */
    private void checkRep() {
        if (this.neighbors == null) {
            throw new RuntimeException("neighbors is null: no graph");
        }
        if (DEBUG) {
            Set<E> nodeList = this.neighbors.keySet();
            assert nodeList.equals(this.nodes) : "Neighbors Map and Nodes Set don't match";
            for (E node : nodeList) {
                if (node == null) {
                    throw new RuntimeException("Node in Graph cannot be null");
                }
                Set<LabeledEdge<E, T>> edges = this.neighbors.get(node);
                if (edges == null) {
                    throw new RuntimeException("Set of edges out of a node cannot be null");
                }
                for (LabeledEdge<E, T> edge : edges) {
                    if (edge == null) {
                        throw new RuntimeException("Edge cannot be null");
                    }
                    if (!nodeList.contains(edge.to())) {
                        throw new RuntimeException("Node has an edge to a non-graph node");
                    }
                }
            }
        }
    }
}
