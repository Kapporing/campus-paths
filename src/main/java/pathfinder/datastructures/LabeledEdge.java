package pathfinder.datastructures;

/**
 * <b>LabeledEdge</b> represents an immutable directed edge with the label of the edge
 * as well as the vertices from where it's going from to where it's going to.
 * @param <E> represents the Nodes' type
 * @param <T> represents the Labels' type (or weight). Labels have to be comparable
 */
public class LabeledEdge<E, T extends Comparable<T>> implements Comparable<LabeledEdge<E, T>>{
    E nodeFrom;
    E nodeTo;
    T label;

        /*
            Representation Invariant:
                nodeFrom != null && nodeTo != null && label != null

            AF(this): Represents a directed edge between two nodes with
                    this.nodeFrom = the origin of the labeledEdge (i.e where the edge is pointing OUT of)
                    this.nodeTo = the node the edge is pointing to,
                    this.label = label of the edge.

         */

    /**
     * Creates a LabeledEdge
     *
     * @param from  vertex where the edge is going out from
     * @param to    vertex where the edge is going in to.
     * @param label the label of the edge
     * @spec.requires   {@code from != null && to != null && label != null}
     * @spec.effects    Constructs a new Labeled Edge with the
     *                  from String to String and label.
     */
    public LabeledEdge(E from, E to, T label) {
        assert from != null && to != null && label != null : "Node/Label in Edges cannot be null";
        this.nodeFrom = from;
        this.nodeTo = to;
        this.label = label;
        this.checkRep();
    }

    /**
     * Returns the parent of this edge
     * @return the vertex the edge is coming out from (i.e the parent vertex)
     */
    public E from() {
        this.checkRep();
        return this.nodeFrom;
    }

    /**
     * Returns the child of this edge
     * @return the vertex the edge is going to (i.e the child vertex)
     */
    public E to() {
        this.checkRep();
        return this.nodeTo;
    }

    /**
     * Returns the label of the edge
     * @return the label of the edge.
     */
    public T label() {
        return this.label;
    }

    /**
     * Returns a string representation of the edge
     *
     * @return a string representation of the edge
     */
    @Override
    public String toString() {
        this.checkRep();
        return "Edge-Label: " + this.label + " -- (" + this.nodeFrom + " -> " + this.nodeTo + ")\n";
    }

    /**
     * Return true if and only if the edge has the same parent, child, and label.
     *
     * @param o Object to compare to
     *
     */
    @Override
    public boolean equals(Object o) {
        this.checkRep();
        if (!(o instanceof LabeledEdge<?, ?>)) {
            return false;
        }
        LabeledEdge<?, ?> check = (LabeledEdge<?, ?>) o;
        check.checkRep();
        return (check.label().equals(this.label) && check.from().equals(this.nodeFrom) && check.to().equals(this.nodeTo));
    }

    /**
     * Returns the hashcode of this edge
     *
     * @return hashCode of edge
     */
    @Override
    public int hashCode() {
        this.checkRep();
        return (nodeFrom.hashCode() ^ nodeTo.hashCode()) + label.hashCode();
    }

    /**
     * Throws an exception if the representation invariant is violated
     */
    private void checkRep() {
        if (this.nodeFrom == null) {
            throw new RuntimeException("from node cannot be null");
        }
        if (this.nodeTo == null) {
            throw new RuntimeException("to node cannot be null");
        }
        if (this.label == null) {
            throw new RuntimeException("label cannot be null");
        }
    }

    /**
     * Compares 2 LabeledEdge.
     *      If they are equal return 0
     *      else if their destination are equal but not their labels, compare by label
     *      else if their labels are equal but not their destination, compare by destination's hashcode
     *
     * @param o LabeledEdge to compare against
     * @return 0 if they are equal, else compare by destination if label is equal, else compare by label if destination is equal
     */
    @Override
    public int compareTo(LabeledEdge<E, T> o) {
        if (this.equals(o)) {
            return 0;
        } else {
            return this.to().equals(o.to()) ? this.label().compareTo(o.label) : Integer.compare(this.to().hashCode(), o.to().hashCode());
        }
    }
}
