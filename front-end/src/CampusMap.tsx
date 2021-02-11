import React, {Component} from 'react';
import {CampusBuilding, Options} from './App';
import "./CampusMap.css";
import {
    Button,
    Col,
    Container,
    ListGroup,
    Modal,
    Pagination,
    ProgressBar,
    Row,
    ToggleButton,
    ToggleButtonGroup
} from "react-bootstrap";
import assert from "assert";

interface CampusMapState {
    backgroundImage: HTMLImageElement | null;       // Stores the background image
    directionPage: number;                          // Stores the current page in which the direction 'page' is at.
    showModal: boolean;                             // Determines whether pop-up from selecting multiple entrance is shown
    entrance: string;                               // The current entrance chosen.
}

interface CampusMapProps {
    // List of tuples representing a point (intersection) of paths (or buildings) -- used for drawing
    points: [number, number][];
    // List of English direction. Either empty or in form of ["Path from A to B", ..., "Total distance: ... feet"] -- used to give english directions
    directions: string[];
    // List of buildings, see App.CampusBuilding interface for layout   -- used to draw all possible entry points (can be removed)
    buildings: CampusBuilding[];
    // Map of "main" building/entrance to a list of all entrances in the same building (i.e KNE (S) -> KNE(S), KNE, KNE(SW) ...)  -- used for click navigation
    // NOTE: Key of map does not necessarily have to be the building name without the entrance like above^
    centralBuilding: Map<string, CampusBuilding[]>;
    // Sends a request to pathFinder that a point in the map has been clicked.  -- used for click navigation
    sendPath(start: string, end: string): void;
    // Experimental!!
    options: Options;
}

let validPoints: Map<string, [number, number]> = new Map();


class CampusMap extends Component<CampusMapProps, CampusMapState> {

    // NOTE:
    // This component is a suggestion for you to use, if you would like to.
    // It has some skeleton code that helps set up some of the more difficult parts
    // of getting <canvas> elements to display nicely with large images.
    //
    // If you don't want to use this component, you're free to delete it.

    canvas: React.RefObject<HTMLCanvasElement>;
    currentClickedPair: [string, string];
    entrancesList: any[];
    selectedMainBuilding: string;
    pageReset: boolean;


    constructor(props: any) {
        super(props);
        this.state = {
            backgroundImage: null,
            directionPage: 0,
            showModal: false,
            entrance: ""
        };
        this.canvas = React.createRef();
        this.currentClickedPair = ["", ""];
        this.entrancesList = [];
        this.selectedMainBuilding = "";
        this.pageReset = false;
    }

    componentDidMount() {
        // Might want to do something here?
        this.fetchAndSaveImage();
    }

    /**
     * After updating, make sure to draw the path (if any exists)
     * putting draw buildings here was the only workaround to having setState be asynchronous in app
     * (i.e cannot send a parsed list of centralMap(building->list of entrances))
     */
    componentDidUpdate() {
        // Might want something here too...
        this.drawBackgroundImage();
        let canvas = this.canvas.current;
        if (canvas === null) throw Error("Unable to draw, no canvas ref.");
        let ctx = canvas.getContext("2d");
        if (this.props.points.length !== 0){
            let pointTuples: [number, number][] = this.props.points;
            if (this.props.options.toAnimate) {
                this.animateLine(ctx, pointTuples);
            } else {
                this.drawPath(ctx, pointTuples);
            }
        }
        // this.drawBuildingPoints(ctx);        // may be useful later on? draws all possible entrances
        this.drawBigBuildings(ctx);
    }

    fetchAndSaveImage() {
        // Creates an Image object, and sets a callback function
        // for when the image is done loading (it might take a while).
        let background: HTMLImageElement = new Image();
        background.onload = () => {
            this.setState({
                backgroundImage: background
            });
        };
        // Once our callback is set up, we tell the image what file it should
        // load from. This also triggers the loading process.
        background.src = "./campus_map.jpg";
    }

    /**
     * Draws the background image stored in the canvas
     */
    drawBackgroundImage() {
        let canvas = this.canvas.current;
        if (canvas === null) throw Error("Unable to draw, no canvas ref.");
        let ctx = canvas.getContext("2d");
        if (ctx === null) throw Error("Unable to draw, no valid graphics context.");
        //
        if (this.state.backgroundImage !== null) { // This means the image has been loaded.
            // Sets the internal "drawing space" of the canvas to have the correct size.
            // This helps the canvas not be blurry.
            canvas.width = this.state.backgroundImage.width;
            canvas.height = this.state.backgroundImage.height;
            ctx.drawImage(this.state.backgroundImage, 0, 0);
        }
    }

    /**
     * Draws the "main" buildings determined by the key of the centralMap.
     * ** maybe try to do some offsetting?
     * (i.e if main building is KNE (N) then draw it a bit more to the south to get actual location) **
     *
     * @param ctx: CanvasRenderingContext2D object, used to draw a circle around each building
     */
    drawBigBuildings = (ctx: any) => {
        let temp = this.props.centralBuilding;
        let validpt: Map<string, [number, number]> = new Map();
        temp.forEach(function(value, key) {
            let point = value[0];
            validpt.set(key, [point.x, point.y]);
            ctx.beginPath();
            ctx.lineWidth = 15;
            ctx.strokeStyle = "#4B2E83";        // UW's purple
            ctx.arc(point.x, point.y, 25, 0, 2 * Math.PI);
            ctx.stroke();
        });

        validPoints = validpt;
    };

    /**
     * Draws ALL possible entrances and buildings
     *
     * @param ctx: CanvasRenderingContext2D object, used to draw a circle around each building
     */
    drawBuildingPoints = (ctx: any) => {
        for (let i = 0; i < this.props.buildings.length; i++) {
            let point = this.props.buildings[i];
            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = "purple";
            ctx.arc(point.x, point.y, 25, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    /**
     * Draws a path (if any) from start: [ tuples[0][0], tuples[0][1] ]
     *                       to   end: [ tuples[tuples.length - 1][0], tuples[tuples.length - 1][1] ]
     *
     * @param ctx CanvasRenderingContext2D object, used to draw the lines
     * @param tuples a size 2 list of [number, number] tuples with the start [x,y] at idx 0 and end[x,y] at tuples.length - 1
     */
    drawPath = (ctx: any, tuples: [number, number][]) => {
        // Find the starting point first.
        let start: [number, number] = tuples[0];

        // If the start is valid (i.e tuples != empty), draw
        if (start !== undefined) {
            // Draws a circle on start/end point
            ctx.beginPath();
            if (this.props.options.hogWild) {
                ctx.fillStyle = 'hsl('+ Math.floor(Math.random() * 361) + ',100%,50%)';
            } else {
                ctx.fillStyle = "yellow";
            }
            ctx.arc(start[0], start[1], 25, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            if (this.props.options.hogWild) {
                ctx.fillStyle = 'hsl('+ Math.floor(Math.random() * 361) + ',100%,50%)';
            } else {
                ctx.fillStyle = "yellow";
            }
            ctx.arc(tuples[tuples.length - 1][0],tuples[tuples.length - 1][1],25, 0, 2 * Math.PI);
            ctx.fill();

            // Draws the paths between start and end

            let i: number;
            for (i = 0; i < tuples.length - 1; i++) {
                ctx.beginPath();
                ctx.lineWidth = 15;
                ctx.moveTo(tuples[i][0], tuples[i][1]);
                if (this.props.options.rainbow) {
                    ctx.strokeStyle = 'hsl('+ 360*(i / (tuples.length - 1)) + ',100%,50%)';
                } else if (this.props.options.hogWild) {
                    ctx.strokeStyle = 'hsl('+ Math.floor(Math.random() * 361) + ',100%,50%)';
                } else {
                    ctx.strokeStyle = "red";
                }
                ctx.lineTo(tuples[i + 1][0], tuples[i + 1][1]);
                ctx.stroke();
            }
        }

        if (this.pageReset) {
            this.pageReset = false;
            this.setState({directionPage: 0});
        } else {
            this.pageReset = true;
        }
    };

    /**
     * Changes the page of directions based on increment value
     *
     * @param change the increment value (negative for decrement)
     */
    changePage = (change: number) => {
        let currPage: number = this.state.directionPage;
        currPage += change;
        this.setState({
            directionPage: currPage
        });
        this.pageReset = false;
    }


    calcWaypoints = (vertices: [number, number][]) =>{
        let waypoints: [number, number][] = [];
        for(let i = 1;i < vertices.length; i++){
            let pt0 = vertices[i-1];
            let pt1 = vertices[i];
            let dx = pt1[0] - pt0[0];
            let dy = pt1[1] - pt0[1];
            let sep = 10;
            if (dx < 50 && dy < 50) {
                sep = 3;
            }
            for(let j = 0; j < sep; j++){
                let x = pt0[0] + dx * j/sep;
                let y = pt0[1] + dy * j/sep;
                waypoints.push([x, y]);
            }
        }
        return waypoints;
    }

    animateLine = (ctx: any, tuples: [number, number][]) => {
        let start: [number, number] = tuples[0];
        ctx.beginPath();
        if (this.props.options.hogWild) {
            ctx.fillStyle = 'hsl('+ Math.floor(Math.random() * 361) + ',100%,50%)';
        } else {
            ctx.fillStyle = "yellow";
        }
        ctx.arc(start[0], start[1], 25, 0, 2 * Math.PI);
        ctx.fill();
        ctx.arc(tuples[tuples.length - 1][0],tuples[tuples.length - 1][1],25, 0, 2 * Math.PI);
        ctx.fill();
        let pointRender = tuples.slice(0, Math.max((this.state.directionPage + 1) * 10, 0));
        let pts = this.calcWaypoints(pointRender);
        let t = 1;
        this.animate(ctx, t, pts);

        if (this.pageReset) {
            this.pageReset = false;
            this.setState({directionPage: 0});
        } else {
            this.pageReset = true;
        }
    }

    animate = (ctx: any, t: number, points: [number, number][]) => {
        if(t < points.length-1){
            requestAnimationFrame(() => this.animate(ctx, t, points));
        }
        // draw a line segment from the last waypoint
        // to the current waypoint
        ctx.beginPath();
        if (this.props.options.rainbow) {
            ctx.strokeStyle = 'hsl('+ 360*(t / (points.length - 1)) + ',100%,50%)';
        } else if (this.props.options.hogWild) {
            ctx.strokeStyle = 'hsl('+ Math.floor(Math.random() * 361) + ',100%,50%)';
        } else {
            ctx.strokeStyle = "red";
        }
        ctx.moveTo(points[t-1][0],points[t-1][1]);
        ctx.lineTo(points[t][0],points[t][1]);
        ctx.stroke();
        // increment "t" to get the next waypoint
        t++;
    }

    /**
     * Handles a click on the map by getting the scaled down x, y coordinate of the click and converting it to
     * actual x,y coordinates and then getting the short name of the point that is ~40px radius near the click site
     *
     * @param event: Mouse Click Event
     */
    handleClick = (event: any) => {
        let canvas = this.canvas.current;       // Gets the current version of the canvas
        if (canvas !== null) {
            // First few parts of code courtesy of stackoverflow
            // @see https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element by patriques
            const rect = canvas.getBoundingClientRect();        // Gets the bounding rectangle
            const x = event.clientX - rect.left;                // Gets the x coordinate of the click position relative to the bounds
            const y = event.clientY - rect.top;                 // Gets the y coordinate of the click position relative to the bounds

            // Gets the scaled width (and height) of the scaled down canvas size
            let cs     = getComputedStyle(canvas);
            let width  = parseInt(cs.getPropertyValue('width'), 10);
            // let height = parseInt(cs.getPropertyValue('height'), 10);

            // Gets the scaling factor of the canvas with respect to the actual size and get the actualX and actualY coordinates
            let scaleFactor = canvas.width / width;
            let actualX = x * scaleFactor;
            let actualY = y * scaleFactor;

            // For each of the coordinates in validPoints (list of map of "main" building shortName -> its [x,y] tuple coordinates),
            // check for a match, if there is a match, get the list of CampusBuildings associated with that "main building"
            // @ts-ignore
            for (let [k, v] of validPoints) {
                // Checks to see if click is within 40px radius of a point
                //(might be flawed since it checks in order as opposed to closest distance)
                if (Math.abs(v[0] - actualX) <= 40 && Math.abs(v[1] - actualY) <= 40) {
                    // Gets the list of entrances tied to the main building
                    let buildingMatches: CampusBuilding[] = this.props.centralBuilding.get(k)!;
                    // If there are more than one entrance, pop-up the other entrances select box
                    if (buildingMatches.length !== 1) {
                        this.setState({
                           showModal: true
                        });
                        this.handleMultipleEntrances(buildingMatches);
                    } else {
                        // If there is only one entrance, send it over to PathFinder
                        let point: string = buildingMatches[0].shortName;
                        // Checks to see if it's a start or end based on the current pair fillings
                        if (this.currentClickedPair[0] === "") {
                            this.currentClickedPair[0] = point;
                            this.props.sendPath(point, "");
                        } else {
                            this.currentClickedPair[1] = point;
                        }
                    }
                }
            }

            // If both pairs are filled, send it over to pathFinder (it sends if either start/end fills, actually)
            if (this.currentClickedPair[0] !== "" && this.currentClickedPair[1] !== "") {
                this.props.sendPath(this.currentClickedPair[0], this.currentClickedPair[1]);
                this.currentClickedPair = ["", ""];
            }
        }
    }

    /**
     * Handles the case with multiple entrances by creating a list of <ToggleButtons> (i.e Radio Buttons)
     * with the corresponding shortName as its value to be shown to the Modal pop-up
     *
     * @param list list of possible entrances tied to the "main" building
     */
    handleMultipleEntrances = (list: CampusBuilding[]) => {
        this.entrancesList = [];              // Sets the current entranceList to be empty (clears out previous runs)
        assert(list.length > 0);        // Make sure the value of list is > 0 (it should be because the only time this is called is inside the above function)
        // Since setState is asynchronous, we want to make sure we call it ahead of time (saves a few ms probably?)
        // Sets the current chosen list to be the first possible entrance (default value for radio buttons)
        this.setState({
            entrance: list[0].shortName
        });
        this.selectedMainBuilding = list[0].longName.replace( /\s\(.*\)/, "");
        // For all possible entrances, create a RadioButton with a unique key and value set to be its shortName
        for (let i = 0; i < list.length; i++) {
            let sname: string = list[i].shortName;
            this.entrancesList.push(
                <ToggleButton key={i} value={sname} onChange={this.setEntranceOption}>{sname}</ToggleButton>
            );
            // NOTE: onChange function just sets the state of entrance to be whatever the user has picked.
        }
    }

    /**
     * Sets the current chosen entrance
     *
     * @param event
     */
    setEntranceOption = (event: any) => {
        this.setState({
            entrance: event.target.value
        });
    }

    /**
     * Sets the state of modal (i.e whether to show or not)
     *
     * @param show boolean determining whether to show
     */
    setShow = (show: boolean) => {
        this.setState({
            showModal: show
        });
    }

    /**
     * Confirms the user's selection of entrance by closing the modal and sending the start/end pair
     * Determines the start/end when point is clicked in the same way as a single-option handleClick
     */
    acceptEntrance = () => {
        this.setShow(false);
        let point: string = this.state.entrance;
        if (this.currentClickedPair[0] === "") {
            this.currentClickedPair[0] = point;
            this.props.sendPath(point, "");
        } else {
            this.currentClickedPair[1] = point;
        }

        if (this.currentClickedPair[0] !== "" && this.currentClickedPair[1] !== "") {
            this.props.sendPath(this.currentClickedPair[0], this.currentClickedPair[1]);
            this.currentClickedPair = ["", ""];
        }
    }

    render() {
        let directions: any[] = [];     // The list of directions that will be showed per page
        let infoBox: any[] = [];        // infoBox is the 'header' for the directions (i.e Path from ... and Total distance ...)
        let pages: any[][] = [];        // List of pages with list of directions (i.e page[idx, directionsList[]]
        let count: number = 0;          // current count of directions per page (used in partitioning directions to pages)

        if (this.props.points.length !== 0)  {      // If there exists a Path,
            // Check if the path is not found, in this case we use a special value of [-1, -1] in the props.points
            if (this.props.points[0][0] === -1 && this.props.points[0][1] === -1) {
                infoBox.push(<ListGroup.Item variant="warning" key={-1}>No Directions Found</ListGroup.Item>)
            } else {        // If there are valid directions/path, we add them to the directions
                // push the first item of directions to infoBox, the first item
                // is always guaranteed to be the Path from ... if points.length != 0
                infoBox.push(<ListGroup.Item variant="info" key={0}>{this.props.directions[0]}</ListGroup.Item>);
                let i;
                for (i = 1; i < this.props.directions.length - 1; i++) {
                    const str = this.props.directions[i];
                    directions.push(<ListGroup.Item key={i}>{str}</ListGroup.Item>);
                    count++;
                    // Our max directions per page is 10, so for every 10 directions, create a page with the corresponding directions list
                    if (count % 10 === 0) {
                        pages.push(directions);
                        directions = [];
                    }
                }
                // [i] will always be a valid index because the props.points.length is always > 2 or 0
                infoBox.push(<ListGroup.Item variant="dark" key={i}>{this.props.directions[i]}</ListGroup.Item>);
                // If there are still remaining items on the directions, add them in the last page
                // (i.e if directions is not a proper multiple of 10)
                if (directions.length > 0) {
                    pages.push(directions);
                }
            }
        }

        return (
            <>
            <Modal show={this.state.showModal} onHide={() => this.setShow(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Select Entrance</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <h5>{this.selectedMainBuilding}</h5>
                        <ToggleButtonGroup type="radio" name="options" className="button-center">
                            {this.entrancesList}
                        </ToggleButtonGroup>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.acceptEntrance}>
                        Accept
                    </Button>
                </Modal.Footer>
            </Modal>

            <Container fluid>
                <Row>
                    <Col xs={12} sm={12} md={12} lg={10} xl={10}>
                        <canvas ref={this.canvas} onClick={this.handleClick}/>
                    </Col>
                    <Col>
                        <br/>
                        <ListGroup>
                            {infoBox}
                        </ListGroup>
                        <br/>
                        {pages.length === 0 ? null :
                           (<>
                               <Pagination className="text-center">
                                   <Pagination.Prev onClick={this.state.directionPage > 0
                                                            ? () => this.changePage(-1)
                                                            : () => {this.pageReset = false;this.setState({directionPage: pages.length - 1})}}/>
                                   <Pagination.Next onClick={this.state.directionPage < pages.length - 1
                                                            ? () => this.changePage(+1)
                                                            : () => this.setState({directionPage: 0})}/>
                               </Pagination>
                               <ProgressBar now={Math.min(((this.state.directionPage + 1) * 10 / count) * 100, 100)}/>
                           </>)}
                        <ListGroup  variant="flush">
                            {pages[this.state.directionPage]}
                        </ListGroup>
                    </Col>
                </Row>
            </Container>
            </>
        );
    }
}

export default CampusMap;