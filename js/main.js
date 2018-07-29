let restaurants
var map
var markers = []
const restaurantApi = 'http://localhost:1337/restaurants';

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	fetchCusineAndNeighborhood();
	fetchRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchCusineAndNeighborhood = () => {
	fetch(restaurantApi)
		.then(function(response) {
			return response.json();
		}).then(function(myJson) {
			console.log(myJson);
			fillNeighborhoodsHTML(myJson);
			fillCuisinesHTML(myJson);
			openDb(myJson);
		});
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchRestaurants = (cuisine, neighborhood) => {
	fetch(restaurantApi)
		.then(function(response) {
			return response.json();
		}).then(function(myJson) {
			let restaurants = myJson;

			if (cuisine != 'all') { // filter by cuisine
				restaurants = restaurants.filter(r => r.cuisine_type == cuisine);
			}
			if (neighborhood != 'all') { // filter by neighborhood
				restaurants = restaurants.filter(r => r.neighborhood == neighborhood);
			}
			fillRestaurantsHTML(restaurants);
		});
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	let neighborhoodSet = new Set();

	for (let neighborhood in neighborhoods) {
		var obj = neighborhoods[neighborhood].neighborhood;
		neighborhoodSet.add(obj);
	}

	neighborhoodSet.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');
	let cusineSet = new Set();

	for (let cuisine in cuisines) {
		var obj = cuisines[cuisine].cuisine_type;
		cusineSet.add(obj);
	}

	cusineSet.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	resetRestaurants(restaurants);
	fetchRestaurants(cuisine, neighborhood);
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	const noResults = document.getElementById('no-results');

	ul.innerHTML = '';

	if(noResults) {
		ul.parentNode.removeChild(noResults);
	}

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');

	for (let restaurant in restaurants) {
		var obj = restaurants[restaurant];
		ul.append(createRestaurantHTML(obj));
	}

	if(restaurants.length === 0) {
		const p = document.createElement('p');
		p.setAttribute('id','no-results');
		const parent = ul.parentNode;

		p.innerHTML = "Sorry! There are no results for that combination.";
		parent.insertBefore(p, ul);
	}

	addMarkersToMap(restaurants);
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.setAttribute('alt','Picture of ' + restaurant.name);
	image.src = '/img/' + restaurant.photograph + '.jpg';
	li.append(image);

	const content = document.createElement('div');
	content.setAttribute('class', 'restaurant-summary');

	const name = document.createElement('h3');
	name.innerHTML = restaurant.name;
	content.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	content.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	content.append(address);


	const more = document.createElement('a');
	const moreText = `View Details <span class="visually-hidden">about ${restaurant.name}</span>`;
	more.innerHTML = moreText;
	more.href = DBHelper.urlForRestaurant(restaurant);

	content.append(more)

	li.append(content);

	return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url
		});
		self.markers.push(marker);
	});
}

openDb = (restaurants) => {
	const dbName = "RestaurantList";

	var request = indexedDB.open(dbName, 3);
	var customerObjectStore;

	request.onerror = function(event) {
	// Handle errors.
	};
	request.onupgradeneeded = function(event) {
	var db = event.target.result;
	var res = restaurants;
	console.log('res', res);

	// Create an objectStore to hold information about our customers. We're
	// going to use "ssn" as our key path because it's guaranteed to be
	// unique - or at least that's what I was told during the kickoff meeting.
	var objectStore = db.createObjectStore("restaurants", { keyPath: "id" });

	// Create an index to search customers by name. We may have duplicates
	// so we can't use a unique index.
	objectStore.createIndex("name", "name", { unique: false });


	// Use transaction oncomplete to make sure the objectStore creation is
	// finished before adding data into it.
	objectStore.transaction.oncomplete = function(event) {
		// Store values in the newly created objectStore.
		customerObjectStore = db.transaction("restaurants", "readwrite").objectStore("restaurants");
		restaurants.forEach(function(customer) {
		  customerObjectStore.add(customer);
		});
		console.log('res', res);

	};
	};
}
