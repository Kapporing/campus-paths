package pathfinder.textInterface;

import pathfinder.CampusMap;

/**
 * Pathfinder represents a complete application capable of responding to user prompts to provide
 * a variety of information about campus buildings and paths between them.
 */
public class Pathfinder {

    // This class does not represent an ADT.

    /**
     * The main entry point for this application. Initializes and launches the application.
     *
     * @param args The command-line arguments provided to the system.
     */
    public static void main(String[] args) {
        CampusMap map = new CampusMap();
        TextInterfaceView view = new TextInterfaceView();
        TextInterfaceController controller = new TextInterfaceController(map, view);
        //
        view.setInputHandler(controller);
        controller.launchApplication();
    }
}
