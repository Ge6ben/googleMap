
const HOVERED_CLASS_NAME = "tile-hover-hack"

/*
 * This demo illustrates the coordinate system used to display map tiles in the
 * API.
 *
 * Tiles in Google Maps are numbered from the same origin as that for
 * pixels. For Google's implementation of the Mercator projection, the origin
 * tile is always at the northwest corner of the map, with x values increasing
 * from west to east and y values increasing from north to south.
 *
 * Try panning and zooming the map to see how the coordinates change.
 */
class CoordMapType {
  tileSize;
  constructor(tileSize) {
    this.tileSize = tileSize;
  }
  getTile(coord, zoom, ownerDocument) {
    const div = ownerDocument.createElement("div");
		div.id = "block_" + coord.x + "_" + coord.y;
    div.innerHTML = String(coord);
    div.style.width = this.tileSize.width + "px";
    div.style.height = this.tileSize.height + "px";
    div.style.fontSize = "0";
    div.style.borderStyle = "solid";
    div.style.borderWidth = "1px";
    div.style.borderColor = "lightgrey";
    div.className = 'tile';
    return div;
  }
  releaseTile(tile) {}
}

// must be a factor of 2 (max 256) or swap8 breaks
const TILE_SIZE = 32; 

let map;

function initMap() {
  const chicago = new google.maps.LatLng( 44, 36);
  map = new google.maps.Map(document.getElementById("map"), {
    center: chicago,
    zoom: 4,
  });
  
  // Insert this overlay map type as the first overlay map type at
  // position 0. Note that all overlay map types appear on top of
  // their parent base map.
  map.overlayMapTypes.insertAt(
    0,
    new CoordMapType(new google.maps.Size(TILE_SIZE, TILE_SIZE))
  );
  


  map.addListener('click', function(e) {
     addMarker(e.latLng);
  });

  
  // https://developers.google.com/maps/documentation/javascript/examples/map-coordinates#maps_map_coordinates-javascript
  map.addListener('mousemove', (event) => {
  	const zoom = map.getZoom();
    // console.log('swap 8 on', TILE_SIZE, 'is', swap8(TILE_SIZE));
    const scale = swap8(TILE_SIZE) << zoom;
    const worldCoordinate = project(event.latLng);
    /* console.log('scale:', scale);
    console.log('world:', worldCoordinate.x, worldCoordinate.y); */
    // x = floor ( 5 * 8 ) / 28
    const x = Math.floor((worldCoordinate.x * scale) / TILE_SIZE);
    const y = Math.floor((worldCoordinate.y * scale) / TILE_SIZE);
    const tile = document.getElementById('block_' + x + '_' + y);
    // I have the block!
    if (previousTile == null) {
      newTileDetected(tile);
    } else if (previousTile !== tile) {
    	newTileDetected(tile);
    }
  });
  
  const locationButton = document.createElement("button");
  infoWindow = new google.maps.InfoWindow();

locationButton.textContent = "Pan to Current Location";
locationButton.classList.add("custom-map-control-button");
map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
locationButton.addEventListener("click", () => {
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        // Show Marker
        addMarker(pos);
        // Or Show a infoWindow
        // infoWindow.setPosition(pos);
        // infoWindow.setContent("Location found.");
        // infoWindow.open(map);
        map.setCenter(pos);
        map.setZoom(15)
      },
      () => {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
});
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
infoWindow.setPosition(pos);
infoWindow.setContent(
  browserHasGeolocation
    ? "Error: The Geolocation service failed."
    : "Error: Your browser doesn't support geolocation."
);
infoWindow.open(map);

}


// do all side-effects relating to new tile
// 1) de-activate any previous tile styling for active state
// 2) active tile styling for new tile
let previousTile;
const newTileDetected = (tile) => {
	if (tile == null) {
  	throw Error("New tile detected was null");
  }
	if (previousTile == null) {
  	previousTile = tile;
  } else {
  	previousTile.className = "";
  }
  tile.className = HOVERED_CLASS_NAME;
  previousTile = tile;
}

function swap8(val) {     
  return ((val & 0x1) << 8) | 
  	((val & 0x2) << 6) | 
    ((val & 0x4) << 4) |    
    ((val & 0x8) << 2) |
    ((val >> 2) & 0x8) |
    ((val >> 4) & 0x4) |
    ((val >> 6) & 0x2) | 
    ((val >> 8) & 0x1); 
}

// The mapping between latitude, longitude and pixels is defined by the web
// mercator projection.
const project = (latLng) => {
  let siny = Math.sin((latLng.lat() * Math.PI) / 180);

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);
  return new google.maps.Point(
    TILE_SIZE * (0.5 + latLng.lng() / 360),
    TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  );
}
  
let markersArray = []; 
    // define function to add marker at given lat & lng
    function addMarker(latLng) {
        setMapOnAll(null);
      markersArray.splice(0,   markersArray.length)
      
    let marker = new google.maps.Marker({
        map: map,
        position: latLng,
        draggable: true
    })

    markersArray.push(marker);}

     //store the marker object drawn on map in global array
     function setMapOnAll(map) {
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(map);
  }
}
