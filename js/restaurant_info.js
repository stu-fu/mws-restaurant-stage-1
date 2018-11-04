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
	const restaurantContainer = document.getElementById('restaurant-container');

	const addID = document.getElementById("review-form")
	addID.setAttribute('data-res-id', restaurant.id)

	const restaurantContainerContent = document.createElement('div');
	restaurantContainerContent.setAttribute('class', 'restaurant-content');

	const restaurantContainerInfo = document.createElement('div');
	restaurantContainerInfo.setAttribute('id', 'restaurant-info');

	const restaurantHeading = document.createElement('h1');
	restaurantHeading.setAttribute('id','restaurant-name');
	restaurantHeading.className = 'restaurant-name';
	restaurantHeading.innerHTML = restaurant.name;

	const restaurantStar = document.createElement('div')
	let favoriteChoice;
	if(restaurant.is_favorite == "true") {
		favoriteChoice = "favorite favorited";
	} else {
		favoriteChoice = "favorite";
	}
	restaurantStar.innerHTML = '<button class="' + favoriteChoice + '" onclick="favoriteItem(' + restaurant.id + ')" id="favorite-this-' + restaurant.id + '"><svg class="icon icon-star"><use xlink:href="#icon-star"></use><span>Favorite</span></svg></button>';

	const restaurantAddress = document.createElement('p');
	restaurantAddress.setAttribute('id','restaurant-address');
	restaurantAddress.className = 'restaurant-address';
	restaurantAddress.innerHTML = restaurant.address;

	const restaurantImageContainer = document.createElement('div');
	restaurantImageContainer.setAttribute('class', 'restaurant-image-container');
	const restaurantImage = document.createElement('img');
	restaurantImage.setAttribute('id','restaurant-img');
	restaurantImage.className = 'restaurant-img';
	restaurantImage.setAttribute('alt','Picture of ' + restaurant.name);

	const imgPath = DBHelper.imageUrlForRestaurant(restaurant);
	const minImg = imgPath.replace('img/', 'img/min/');
	const webpImg = minImg.replace('.jpg', '.webp');
	restaurantImage.setAttribute('srcset', webpImg + ' 300w,' + imgPath +  ' 600w');
	restaurantImage.setAttribute('sizes', '(max-width: 850px) 300px');
	restaurantImage.src = imgPath;

	const restaurantCuisine = document.createElement('p');
	restaurantCuisine.setAttribute('id','restaurant-cuisine');
	restaurantCuisine.className = 'restaurant-cuisine';
	restaurantCuisine.innerHTML = restaurant.cuisine_type;

	restaurantImageContainer.append(restaurantImage);
	restaurantImageContainer.append(restaurantCuisine);
	restaurantImageContainer.append(restaurantAddress);

	restaurantContainerContent.append(restaurantImageContainer);
	restaurantContainerContent.append(restaurantContainerInfo);

	restaurantContainer.append(restaurantHeading);
	restaurantContainer.append(restaurantStar);
	restaurantContainer.append(restaurantContainerContent);

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}

	// fill reviews
	fetchReviews();
	//fillRestaurantSchema();
}

favoriteItem = (restaurant) => {
	let restaurantId = restaurant.id;
	let thisbutton = document.getElementById('favorite-this-' + restaurant);
	if ( thisbutton.classList.contains('favorited') ) {
		thisbutton.classList.remove('favorited');
		fetch('http://localhost:1337/restaurants/' + restaurant + '/?is_favorite=false', {
			method: 'put'
		})
		.then(function(response) {
			return response.json();
		})
		.then(function(restaurants){})
		.catch(function(error){
			/*let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
			let open = indexedDB.open("Restaurants", 2);
			open.onsuccess = function(event) {
				var db = event.target.result;
				var changedFav = {
					id : restaurant.id,
					is_favorite : "false"
				};
				var updateFav = JSON.stringify(changedFav)
				db.transaction("ChangedFavs", "readwrite").objectStore("ChangedFavs").add(changedFav);
			}*/
		})

		let open = indexedDB.open("Restaurants", 2);
		open.onsuccess = function() {
			let db = open.result;
			const transaction = db.transaction('RestaurantStore', 'readwrite');
			const objectStore = transaction.objectStore('RestaurantStore');
			objectStore.openCursor().onsuccess = function(event) {
				const cursor = event.target.result;
				if (cursor) {
					if (cursor.value.restaurant_id === restaurantId) {
						const updateData = cursor.value;
						updateData.is_favorite = "false";
						const request = cursor.update(updateData);
						request.onsuccess = function() {
						  console.log('A better album year?');
						};
					};
					cursor.continue()
				} else {
					console.log('Entries displayed.');
				}
			};
		};
	} else {
		thisbutton.classList.add('favorited');
		fetch('http://localhost:1337/restaurants/' + restaurant + '/?is_favorite=true', {
			method: 'put'
		})
		.then(function(response) {
			return response.json();
		})
		.then(function(reviews){})
		.catch(function(error){
			/*let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
			let open = indexedDB.open("Restaurants", 2);
			open.onsuccess = function(event) {
				var db = event.target.result;
				var changedFav = {
					id : restaurant.id,
					is_favorite : "true"
				};
				var updateFav = JSON.stringify(changedFav)
				db.transaction("ChangedFavs", "readwrite").objectStore("ChangedFavs").add(changedFav);
			}*/
		})
		let open = indexedDB.open("Restaurants", 2);
		open.onsuccess = function() {
			let db = open.result;
			const transaction = db.transaction('RestaurantStore', 'readwrite');
			const objectStore = transaction.objectStore('RestaurantStore');
			objectStore.openCursor().onsuccess = function(event) {
				const cursor = event.target.result;
				if (cursor) {
					if (cursor.value.restaurant_id === restaurantId) {
						const updateData = cursor.value;
						updateData.is_favorite = "true";
						const request = cursor.update(updateData);
						request.onsuccess = function() {
						  console.log('A better album year?');
						};
					};
					cursor.continue();
				} else {
					console.log('Entries displayed.');
				}
			};
		};
	}
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

 */

/**
 * Create JSON-ld for entire restaurant

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
 */

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const restaurantContainer = document.getElementById('restaurant-info');
	const hoursTitle = document.createElement('h2');

	const restaurantHoursTable = document.createElement('table');
	restaurantHoursTable.setAttribute('id','restaurant-hours');

	hoursTitle.innerHTML = 'Hours';
	restaurantHoursTable.appendChild(hoursTitle);

	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		restaurantHoursTable.appendChild(row);
	}

	restaurantContainer.append(restaurantHoursTable);
}

fetchReviews = (restaurant = self.restaurant) => {
	let restaurantReview;

	fetch('http://localhost:1337/reviews/?restaurant_id=' +  restaurant.id)
		.then(function(response) {
			return response.json();
		})
		.then(function(reviews){
			restaurantReview = reviews;

			let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
			let open = indexedDB.open("Restaurants", 2);
			open.onsuccess = function(event) {
				var db = event.target.result;
				reviews.forEach(function(review){
					db.transaction("AllReviews", "readwrite").objectStore("AllReviews").add(review);
				});
			}

			fillReviewsHTML(restaurantReview);
		})
		.catch(function(){
			let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
			let open = indexedDB.open("Restaurants", 2);
			open.onsuccess = function(event) {
				var db = event.target.result;
				var ar = db.transaction("AllReviews", "readwrite").objectStore("AllReviews");

				let request = ar.getAll();

				request.onsuccess = function(items) {
					finalRequest = items.target.result;
					fillReviewsHTML(finalRequest);
				}
			}
		})

}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
	const container = document.getElementById('reviews-container');

	console.log('reviews: ' + reviews);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}

	const ul = document.getElementById('reviews-list');
	while (ul.firstChild) {
		ul.removeChild(ul.firstChild);
	}
	reviews.forEach(reviews => {
		ul.appendChild(createReviewHTML(reviews));
	});

}

postReview = (isOffline, data) => {
	const reviewRating = document.getElementById("review-rating").value;
	const reviewName = document.getElementById("review-name").value;
	const reviewText = document.getElementById("review-message").value;
	const reviewForm = document.getElementById("review-form");
	const reviewID = reviewForm.getAttribute('data-res-id');
	let postOpts;

	if(isOffline) {
		postOpts = data;
	} else {
		postOpts = {
			"restaurant_id": Number(reviewID),
			"name": reviewName,
			"rating": Number(reviewRating),
			"comments": reviewText
		}
	}

	fetch('http://localhost:1337/reviews/', {
			method: 'post',
			body: JSON.stringify(postOpts)
		}).then(function(response) {
			return response.json();
		}).then(function() {
			fetchReviews();
			reviewForm.innerHTML = "Your review has been submitted!";
		}).catch(function() {
			console.log('errir');

			if(!isOffline) {
				console.log('new Review');
				let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
				let open = indexedDB.open("Restaurants", 2);
				open.onsuccess = function(event) {
					var db = event.target.result;
					var tx = db.transaction("OfflineReviews", "readwrite");
					var offlineReviews = tx.objectStore("OfflineReviews");
					var reviewObjectStore;
					offlineReviews.add(postOpts);
					tx.transaction.oncomplete = function() {
						reviewObjectStore = db.transaction("OfflineReviews", "readwrite").objectStore("OfflineReviews");
						reviewObjectStore.add(postOpts);
					}
				}
			}

			reviewForm.innerHTML = "Oh no! It appears you are offline. Don't worry, we've saved this review. Next time you come to the site we'll post it for you!";
		});;
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
	var finalDate = new Date(review.createdAt);
	date.innerHTML = finalDate.toLocaleDateString("en-US");
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
