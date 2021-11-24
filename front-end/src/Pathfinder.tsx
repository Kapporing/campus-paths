import React, {Component} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Pathfinder.tsx';
import {
    Col,
    Container,
    Row,
    Form,
    Button,
    ButtonGroup,
    Modal,
    Dropdown,
    DropdownButton,
    Tooltip, OverlayTrigger
} from "react-bootstrap";
import {Options} from "./App";

interface PathfinderState {
    start: string;              // The start point of the pathfinder in Short-Name of building basis
    end: string;                // The end point of the pathfinder in Short-Name of building basis
    startLongname: string;      // The start point of the pathfinder in Long-Name of building basis
    endLongname: string;        // The end point of the pathfinder in Long-Name of building basis
    showError: [boolean, string];
    // Experimental!!
    options: Options;
}

interface PathfinderProps {
    buildingsMap: Map<string, string>;         // The list of buildings passed down from the parent
    updatePoints(pointTuples: any): void;       // onChange, update the points to connect to pass to the CampusMap to draw
    updateDirections(directions: any): void;    // onChange, update the list of directions to pass to CampusMap
    clickedPaths: [string, string];             // Passed down from parent to reflect a request of path from user's clicks
    // Experimental!!
    updateOptions(opt: Options): void;
}

/**
 * This class represents a Pathfinder component that includes the Starting/Ending point dropdown menu
 * as well as the Find Path/Clear button to search for paths
 */
class Pathfinder extends Component<PathfinderProps, PathfinderState> {


    // Constructor to initialize our state
    constructor(props: any) {
        super(props);
        this.state = {
            start: "",
            end: "",
            startLongname: "",
            endLongname: "",
            showError: [false, ""],
            options: {
                hogWild: false,
                rainbow: false,
                toAnimate: false
            }
        };
    }

    /**
     * Used to determine whether an incoming change in prop can change the current state of the Component
     * Used in determining if the user has clicked on the Map in CampusMap as the only prop we want to
     * worry about is the clickedPaths prop. If it's not empty, it means the user has clicked on a point
     *
     * @param props         The changed props handed over from App
     * @param current_state The current state of the Component
     */
    static getDerivedStateFromProps(props: PathfinderProps, current_state: PathfinderState) {
        // This if statement checks if the user has inputted another start-point from the map
        // it works by understanding the fact that the clickedPath tuple always fills in the idx 0
        // first before idx 1 and that every time a full path is sent, the tuple is set to empty on both idx
        if (props.clickedPaths[0] !== "" && props.clickedPaths[1] === ""
         && current_state.start !== "" && current_state.end !== "") {
            props.updatePoints([]);     // Clears out the current drawn path
            let st = props.clickedPaths[0];
            let st_long = st === "" ? "" : st + " " + props.buildingsMap.get(st);
            return {
                start: st,
                startLongname: st_long,
                end: "",
                endLongname: ""
            }
        }
        // Checks if it's still in its default state or user has passed in something
        if (props.clickedPaths[0] !== "" || props.clickedPaths[1] !== "") {
            // If the user has clicked on something, to prevent state-locking (meaning the state cannot be changed by our own component),
            // we have to check if the user has selected something from the dropdown menu
            // This is because the Dropdown menu still takes priority over the user's clicks
            if ((current_state.start !== props.clickedPaths[0] && current_state.start === "")
                || (current_state.end !== props.clickedPaths[1] && current_state.end === "")) {
                // If not, we change the state of the object to reflect the user's request of start/end building
                // from their click
                let st = props.clickedPaths[0];
                let st_long = st === "" ? "" : st + " " + props.buildingsMap.get(st);

                let en = props.clickedPaths[1];
                let en_long = en === "" ? "" :en + " " + props.buildingsMap.get(en);
                return {
                    start: st,
                    startLongname: st_long,
                    end: en,
                    endLongname: en_long
                }
            }
        }
        return null
    }

    /**
     * Stores the Short name of the starting building when user changes it using the dropdown menu
     *
     * @param event
     */
    onStartChange = (event: any) => {
        // Gets the index of the selected option from the dropdown
        const selectedIndex = event.target.options.selectedIndex;
        // Get the key of the option, in this case it's the 'id' value
        let startingPoint = event.target.options[selectedIndex].getAttribute('id');
        let startPointLong = event.target.value;
        this.setState({
            start: startingPoint,
            startLongname: startPointLong
        });
    };

    /**
     * Stores the Short name of the ending building when user changes it using the dropdown menu
     *
     * @param event
     */
    onEndChange = (event: any) => {
        // Gets the index of the selected option from the dropdown
        const selectedIndex = event.target.options.selectedIndex;
        // Get the key of the option, in this case it's the 'id' value
        let endingPoint = event.target.options[selectedIndex].getAttribute('id');
        let endPointLong = event.target.value;
        this.setState({
            end: endingPoint,
            endLongname: endPointLong
        });
    };

    /**
     * Finds the path between start/end as determined by the state
     */
    findPath = () => {
        // Gets the start/end points
        let start = this.state.start;
        let end = this.state.end;
        // Create a XMLHttpRequest to the server to get the Path object as a JSON object to the React server
        const xhr = new XMLHttpRequest();

        xhr.open("POST", "http://ec2-35-86-242-182.us-west-2.compute.amazonaws.com:4567/path?start=" + encodeURIComponent(start) + "&end=" + encodeURIComponent(end));
        xhr.onload = () => this.getPathFinished(xhr);       // Calls the getPathFinished function when done
        xhr.send("");
    };

    /**
     * Parses the result of looking for paths from start and end, sends the parsed path as well as a list of directions to CampusMap
     *
     * @param xhr XMLHttpRequest object that was used to query
     */
    getPathFinished = (xhr: XMLHttpRequest) => {
        // If it wasn't successful, alert the user
        if (xhr.status !== 200) {
            this.setState({
               showError: [true, xhr.responseText]
            });
        } else {
            // If successful, parse it to a JSON object from the JSON format and then send the Path to App->CampusMap
            let jsonObj = JSON.parse(xhr.responseText);
            this.sendPath(jsonObj.path);
            this.sendDirections(jsonObj.directions);
        }
    };

    /**
     * Sends a list of points to be drawn/rendered on CampusMap
     *
     * @param json object representing a Path with segments
     */
    sendPath = (json: any) => {
        // Create an array of [x,y] tuples
        let tuples: [number, number][] = [];
        // Push the starting [x,y] coordinate pair
        tuples.push([json.start.x, json.start.y]);
        // for each segment of the path, push the ending pair *ONLY*
        for (let segment of json.path) {
            tuples.push([segment.end.x, segment.end.y]);
        }
        // Send it to app via the onChange function
        this.props.updatePoints(tuples);
    };

    /**
     * Sends a list of directions over to CampusMap to display
     *
     * @param directions list of directions. Must be formatted exactly either empty or in form of ["Path from A to B", ..., "Total distance: ... feet"]
     */
    sendDirections = (directions: string[]) => {
        this.props.updateDirections(directions);
    }

    /**
     * Clears any path shown on the screen as well
     * as clear out the dropdown menu
     */
    clearPath = () => {
        this.setState({
            start: "",
            end: "",
            startLongname: "",
            endLongname: ""
        });
        this.props.updatePoints([]);
    }

    setHogWild = () => {
        let newOpt = this.state.options;
        newOpt.hogWild = !newOpt.hogWild;
        newOpt.rainbow = false;
        this.setState({
            options: newOpt
        });
        this.props.updateOptions(this.state.options);
    }

    setRainbow = () => {
        let newOpt = this.state.options;
        newOpt.rainbow = !newOpt.rainbow;
        newOpt.hogWild = false;
        this.setState({
            options: newOpt
        });
        this.props.updateOptions(this.state.options);
    }

    setAnimate = () => {
        let newOpt = this.state.options;
        newOpt.toAnimate = !newOpt.toAnimate;
        this.setState({
            options: newOpt
        });
        this.props.updateOptions(this.state.options);
    }


    render() {
        // Dropdown handling.
        // Create a list of tags and insert all possible buildings to be selected inside the list to be shown
        // in the dropdown menu later
        let list: any[] = [];
        list.push(<option id="" key={-1}/>);
        let map = this.props.buildingsMap;
        // @ts-ignore
        for (let [k, v] of map) {
            list.push(
                <option id={k} key ={k}>{k + " " + v}</option>
            );
        }
        return (
            <>
                <Modal show={this.state.showError[0]} onHide={() => this.setState({showError: [false, ""]})} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Error</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="text-center">
                            <p className="lead"> {this.state.showError[1]} </p>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => this.setState({showError: [false, ""]})}>
                            OK
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Container>
                    <Row>
                        <Col>
                            <Form.Group>
                                <Form.Label>Starting Point</Form.Label>
                                <Form.Control as="select" value={this.state.startLongname} onChange={this.onStartChange}>
                                    {list}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Ending Point</Form.Label>
                                <Form.Control as="select" value={this.state.endLongname} onChange={this.onEndChange}>
                                    {list}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <br/>
                            <ButtonGroup>
                                <Button variant="outline-primary" onClick={this.findPath}>Find Path</Button>
                                <Button variant="outline-primary" onClick={this.clearPath}>Clear</Button>
                                <DropdownButton as={ButtonGroup} title="Options" id="bg-nested-dropdown" variant="success">
                                    <OverlayTrigger
                                        placement="left"
                                        delay={{ show: 250, hide: 250 }}
                                        overlay={
                                            <Tooltip id="hogwild-tooltip">
                                                Randomize color for path-drawing
                                            </Tooltip>
                                        }>
                                        <Dropdown.Item active={this.state.options.hogWild}
                                                       onClick={this.setHogWild}>
                                                Random Colors
                                        </Dropdown.Item>
                                    </OverlayTrigger>

                                    <OverlayTrigger
                                        placement="left"
                                        delay={{ show: 250, hide: 250 }}
                                        overlay={
                                            <Tooltip id="rainbow-tooltip">
                                                Make Path-Color Rainbow
                                            </Tooltip>
                                        }>
                                        <Dropdown.Item active={this.state.options.rainbow}
                                                       onClick={this.setRainbow}>
                                            Rainbow
                                        </Dropdown.Item>
                                    </OverlayTrigger>

                                    <Dropdown.Divider/>

                                    <OverlayTrigger
                                        placement="left"
                                        delay={{ show: 250, hide: 250 }}
                                        overlay={
                                            <Tooltip id="animate-tooltip">
                                                Animate path-drawing
                                            </Tooltip>
                                        }>
                                        <Dropdown.Item active={this.state.options.toAnimate}
                                                       onClick={this.setAnimate}>
                                            Animate
                                        </Dropdown.Item>
                                    </OverlayTrigger>
                                </DropdownButton>
                            </ButtonGroup>
                        </Col>
                    </Row>
                </Container>
            </>
        );
    }
}

export default Pathfinder;
