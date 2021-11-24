import React, {Component} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import CampusMap from './CampusMap';
import Pathfinder from "./Pathfinder";
import {Button, Modal} from "react-bootstrap";

export interface CampusBuilding {
    x: number;
    y: number;
    shortName: string;
    longName: string;
}

export interface Options {
    toAnimate: boolean;
    hogWild: boolean;
    rainbow: boolean;
}

interface AppState {
    pointTuples: [number, number][];        // Array of [x,y] coordinates to be drawn on the Map
    buildingsMap: Map<string, string>;         // Map of buildings [short name -> long name]
    directions: string[];
    buildings: CampusBuilding[];
    centralBuilding: Map<string, CampusBuilding[]>;
    clickedPaths: [string, string];
    connectionFailure: boolean;
    drawOptions: Options;
}

class App extends Component<{}, AppState> {

    constructor(props: any) {
        super(props);
        this.state = {
            pointTuples: [],
            buildingsMap: new Map(),
            directions: [],
            buildings: [],
            centralBuilding: new Map(),
            clickedPaths: ["", ""],
            connectionFailure: false,
            drawOptions: {
                hogWild: false,
                rainbow: false,
                toAnimate: false
            }
        };
        // We want to get a list of all the buildings
        // to pass down to the Pathfinder component so we can get the dropdown menu
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "http://ec2-35-86-242-182.us-west-2.compute.amazonaws.com:4567/buildings");
        xhr.onload = () => this.loadBuildings(xhr);
        xhr.onerror = this.showConnectionFailure;
        xhr.send(null);
    }

    showConnectionFailure = () => {
        this.setState({
            connectionFailure: true
        });
    }

    loadBuildings = (xhr: any) => {
        if (xhr.status !== 200) {
            alert(xhr.responseText);
        } else {
            let jsonObj = JSON.parse(xhr.responseText); // reponse has: map[sname,lname] buildingNames and set<campusbuilding> buildings
            let newMap = new Map<string, string>();
            let buildingsList: CampusBuilding[] = [];

            for (let key in jsonObj.buildingNames) {
                if (jsonObj.buildingNames.hasOwnProperty(key)) {
                    newMap.set(key, jsonObj.buildingNames[key]);
                }
            }
            for (let i = 0; i < jsonObj.buildings.length; i++) {
                const item = jsonObj.buildings[i] as CampusBuilding;
                buildingsList.push(item);
            }

            let map = this.parseBuildings(buildingsList);

            this.setState({
                buildingsMap: newMap,
                buildings: buildingsList,
                centralBuilding: map
            });
        }
    };

    parseBuildings = (list: CampusBuilding[]) => {
        let map = new Map<string, CampusBuilding[]>();
        for (let i = 0; i < list.length; i++) {
            let bld = list[i];
            let key = bld.shortName.substring(0, 3);
            if (map.has(key)) {
                if (map.get(key) !== undefined) {
                    let oldList: CampusBuilding[] = map.get(key)!;
                    oldList.push(bld);
                }
            } else {
                map.set(bld.shortName.substring(0, 3), [bld]);
            }
        }
        return map;
    }

    updatePointsList = (points: [number, number][]) => {
        this.setState({
            pointTuples: points
        });
        this.setState({clickedPaths: ["", ""]});
    }

    updateDirections = (dirs: string[]) => {
        this.setState({
           directions: dirs
        });
    }

    updateOptions = (opt: Options) => {
        this.setState({
            drawOptions: opt
        });
    }

    pointToPoint = (start: string, end: string) => {
        this.setState({
            clickedPaths: [start, end]
        });
    }

    render() {
        return (
            <div>
                <Modal show={this.state.connectionFailure} onHide={() => this.setState({connectionFailure: false})} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Connection Failure</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="text-center">
                            <p>
                                There's a problem trying to connect to the server. Try again.
                            </p>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => this.setState({connectionFailure: false})}>
                            OK
                        </Button>
                    </Modal.Footer>
                </Modal>

                <h1 className="text-center">Here's the beginning of your AMAZING CampusPaths GUI!</h1>
                <Pathfinder clickedPaths={this.state.clickedPaths}
                            buildingsMap={this.state.buildingsMap}
                            updatePoints={this.updatePointsList}
                            updateDirections={this.updateDirections}
                            updateOptions={this.updateOptions}/>

                <CampusMap sendPath={this.pointToPoint}
                           centralBuilding={this.state.centralBuilding}
                           buildings={this.state.buildings}
                           points={this.state.pointTuples}
                           directions={this.state.directions}
                           options={this.state.drawOptions}/>
            </div>
        );
    }

}

export default App;
