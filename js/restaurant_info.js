let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
			return;
		}
		const id = getParameterByName('id');
		if (!id) { // no id found in URL
			error = 'No restaurant id in URL'
			callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant)
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img'
	image.setAttribute('alt','Picture of ' + restaurant.name);
	image.src = DBHelper.imageUrlForRestaurant(restaurant);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
	fillRestaurantSchema();
}


/**
 * Get review averages for Schema
 */
createReviewSchemaAverage = (review, reviewCount) => {
	let reviewsAverage = 0;

	review.forEach((review, index) => {
		reviewsAverage += review.rating;
	});

	const avg = reviewsAverage / reviewCount;

	return Math.round( avg * 10 ) / 10;;
}



/**
 * Create JSON-LD text for each review
 */
createReviewSchema = (review, reviewCount) => {
	const ul = document.getElementById('reviews-list');
	let reviewsItems = ``;

	review.forEach((review, index) => {
		let hasComma = ',';

		if(index == reviewCount - 1) {
			hasComma = '';
		}

		reviewsItems += `
			{
				"@type": "Review",
				"author": "${review.name}",
				"datePublished": "${review.date}",
				"reviewBody": "${review.comments}",
				"name": "${review.name}: ${review.rating} out of 5",
				"reviewRating": {
					"@type": "Rating",
					"bestRating": "5",
					"ratingValue": "${review.rating}",
					"worstRating": "1"
				}
			}${hasComma}
			`
	});

	return reviewsItems;
}


/**
 * Create JSON-ld for entire restaurant
 */
fillRestaurantSchema = (restaurant = self.restaurant) => {
	const container = document.getElementById('restaurant-container');
	const schemaScript = document.createElement('script');
	schemaScript.setAttribute('type','application/ld+json');

	const reviews = restaurant.reviews;
	const reviewCount = reviews.length;

	let reviewText = ``;
	let reviewSchemaItem = ``;

	if(reviews) {
		reviewText = `,
		"review": [
			${createReviewSchema(restaurant.reviews, reviewCount)}
		]
		`;
	}

	schemaScript.innerHTML = `{
		"@context": "http://schema.org",
		"@type": "Service",
		"aggregateRating": {
			"@type": "AggregateRating",
			"ratingValue": "${createReviewSchemaAverage(restaurant.reviews, reviewCount)}",
			"reviewCount": "${reviewCount}"
		},
		"description": "${restaurant.cuisine_type} in ${restaurant.neighborhood}",
		"name": "${restaurant.name}",
		"image": "${DBHelper.imageUrlForRestaurant(restaurant)}"${reviewText}
	}`;
	container.appendChild(schemaScript);
}


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	const hoursTitle = document.createElement('h2');

	hoursTitle.innerHTML = 'Hours';
	hours.appendChild(hoursTitle);

	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}

	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});

	container.appendChild(ul);
}


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');

	const header = document.createElement('div');
	header.className = 'rating-header';

	const name = document.createElement('h3');
	name.innerHTML = review.name;

	header.appendChild(name);

	const date = document.createElement('time');
	date.innerHTML = review.date;
	header.appendChild(date);

	li.appendChild(header);

	const rating = document.createElement('p');
	rating.className = `rating rating-${review.rating}`;
	rating.innerHTML = `Rating: ${review.rating} out of 5`;
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
