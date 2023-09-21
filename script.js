let userLatitude = 43.65107;
let userLongitude = -79.347015;

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      userLatitude = position.coords.latitude;
      userLongitude = position.coords.longitude;
      //   map.setCenter([userLongitude, userLatitude]);
      console.log(` User's Lat: ${userLatitude} User's Lng: ${userLongitude}`);
    },
    function (error) {
      console.error("Error occurred: ", error.message);
      alert("Unable to get location. Please enable location services.");
    }
  );
} else {
  console.error("Geolocation not supported.");
  alert("Your browser does not support geolocation.");
}

mapboxgl.accessToken =
  "pk.eyJ1Ijoid2hhdG5vd21hcCIsImEiOiJjbGw0Nnk1aTkwMXIxM2VwMGpiN3RmZ3Y5In0.O5vq93APpSPPQgPHc9VC6g";

const map = new mapboxgl.Map({
  container: "map",
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: "mapbox://styles/mapbox/dark-v10",
  center: [userLongitude, userLatitude], //Setting lat lng
  zoom: 11,
  projection: "globe", // starting projection
});

// TODO: Figure out how to show live pin
// Add geolocate control to the map.
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true,
  })
);

const popupContent = `
  <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 10px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);">
    <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Cantek Program</h3>
    <p style="color: #555; margin-top: 10px;">Happening right now!</p>
    <img src="/cantek-logo.png" alt="Event Image" style="margin-top: 10px; display: block; margin-left: auto; margin-right: auto; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);" width="150px">
    <p>Get Directions:</p>
    <div style="margin-top: 15px;">
      <button onclick="getUserLocationAndRedirect(redirectToWaze)" style="background-color: #1EAAF1; color: #fff; padding: 5px 15px; border: none; border-radius: 5px; margin-right: 5px; cursor: pointer;">Waze</button>
      <button onclick="getUserLocationAndRedirect(redirectToGoogle)" style="background-color: #4285F4; color: #fff; padding: 5px 15px; border: none; border-radius: 5px; margin-right: 5px; cursor: pointer;">Google Maps</button>
      <button onclick="getUserLocationAndRedirect(redirectToApple)" style="background-color: #B2B2B2; color: #fff; padding: 5px 15px; border: none; border-radius: 5px; cursor: pointer;">Apple Maps</button>
    </div>
  </div>
`;

const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

// Attach the popup to a marker or any other Mapbox GL JS object you want

// map.setCenter([]) // Center the map anytime the user loads it

// Adding the boundaries of toronto
map.on("load", () => {
  map.setFog({});
  map.addSource("earthquakes", {
    type: "geojson",
    data: "./data/powerOutage.geojson", // Replace with your data URL
  });
  map.addSource("gta-borough-boundaries", {
    type: "geojson",
    data: "data/gta-borough-boundaries.geojson",
  });

  map.addLayer({
    id: "gta-borough-boundaries-fill",
    type: "fill",
    source: "gta-borough-boundaries",
    paint: {
      "fill-color": "#633BA5",
      "fill-opacity": 0.1,
    },
  });

  //   Outlining the different areas in toronto
  map.addLayer({
    id: "gta-borough-boundaries-line",
    type: "line",
    source: "gta-borough-boundaries",
    paint: {
      "line-color": "white",
      "line-width": 1,
      "line-opacity": 0.5,
    },
  });

  map.addLayer(
    {
      id: "earthquakes-heat",
      type: "heatmap",
      source: "earthquakes",
      maxzoom: 9,
      paint: {
        // Increase the heatmap weight based on frequency and property magnitude
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          0,
          0,
          6,
          1,
        ],
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparancy color
        // to create a blur-like effect.
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(33,102,172,0)",
          0.2,
          "rgb(103,169,207)",
          0.4,
          "rgb(209,229,240)",
          0.6,
          "rgb(253,219,199)",
          0.8,
          "rgb(239,138,98)",
          1,
          "rgb(178,24,43)",
        ],
        // Adjust the heatmap radius by zoom level
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
        // Transition from heatmap to circle layer by zoom level
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
      },
    },
    "waterway-label"
  );

  map.addLayer(
    {
      id: "earthquakes-point",
      type: "circle",
      source: "earthquakes",
      minzoom: 7,
      paint: {
        // Size circle radius by earthquake magnitude and zoom level
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          ["interpolate", ["linear"], ["get", "mag"], 1, 1, 6, 4],
          16,
          ["interpolate", ["linear"], ["get", "mag"], 1, 5, 6, 50],
        ],
        // Color circle by earthquake magnitude
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          1,
          "rgba(33,102,172,0)",
          2,
          "rgb(103,169,207)",
          3,
          "rgb(209,229,240)",
          4,
          "rgb(253,219,199)",
          5,
          "rgb(239,138,98)",
          6,
          "rgb(178,24,43)",
        ],
        "circle-stroke-color": "white",
        "circle-stroke-width": 1,
        // Transition from heatmap to circle layer by zoom level
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 8, 1],
      },
    },
    "waterway-label"
  );
});

function getUserLocationAndRedirect(callback) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        let userLatitude = position.coords.latitude;
        let userLongitude = position.coords.longitude;

        // Event coordinates, which will be dynamically called from the database.
        let eventLatitude = "43.7053100335487";
        let eventLongitude = "-79.40371741661295";

        // Call the redirection function with the coordinates
        callback(eventLatitude, eventLongitude, userLatitude, userLongitude);
      },
      function (error) {
        console.error("Error occurred: ", error.message);
        alert("Unable to get location. Please enable location services.");
      }
    );
  } else {
    console.error("Geolocation not supported.");
    alert("Your browser does not support geolocation.");
  }
}

function redirectToGoogle(
  eventLatitude,
  eventLongitude,
  userLatitude,
  userLongitude
) {
  let googleMapsURL = `https://www.google.com/maps/dir/?api=1&origin=${userLatitude},${userLongitude}&destination=${eventLatitude},${eventLongitude}&travelmode=driving`;
  window.open(googleMapsURL, "_blank");
}

function redirectToApple(
  eventLatitude,
  eventLongitude,
  userLatitude,
  userLongitude
) {
  let appleMapsURL = `http://maps.apple.com/?saddr=${userLatitude},${userLongitude}&daddr=${eventLatitude},${eventLongitude}`;
  window.open(appleMapsURL, "_blank");
}

function redirectToWaze(
  eventLatitude,
  eventLongitude,
  userLatitude,
  userLongitude
) {
  let wazeURL = `https://waze.com/ul?ll=${eventLatitude},${eventLongitude}&navigate=yes&zoom=17&coords=${userLatitude},${userLongitude}`;
  window.open(wazeURL, "_blank");
}
