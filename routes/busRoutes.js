const express = require("express");
const router = express.Router();
const busSimulationService = require("../services/busSimulationService");

// GET /api/bus/live
router.get("/live", async (req, res) => {
  try {
    const liveLocations = await busSimulationService.getLiveBusLocations();
    res.status(200).json(liveLocations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch live bus locations" });
  }
});

// GET /api/bus/route
router.get("/route", (req, res) => {
  try {
    const routeCoords = busSimulationService.getBusRoute();
    res.status(200).json(routeCoords);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bus route" });
  }
});

// GET /api/bus/stops
router.get("/stops", (req, res) => {
  try {
    const stops = busSimulationService.getBusStops();
    res.status(200).json(stops);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bus stops" });
  }
});

module.exports = router;
