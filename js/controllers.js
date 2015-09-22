angular.module('starter.controllers', ['tommy.GoogleMaps'])

.controller('DashCtrl', function($scope, $rootScope, googleDirections, $cordovaContacts, $cordovaEmailComposer, $cordovaSms, $window) {
	//https://developers.google.com/maps/documentation/javascript/reference#encoding
	$scope.result1 = "122/140 Cao Lỗ, phường 4, Quận 8, Hồ Chí Minh, Vietnam";
	$scope.result2 = "343 Phạm Ngũ Lão, Quận 1, Hồ Chí Minh, Vietnam";
	$scope.Calulate = function(origin, destination){
		if(origin.length > 0 && destination.length > 0){
			var args = {
			    origin: origin,
			    destination: destination,
			    travelMode: 'driving',
			    unitSystem: 'metric'
			  }
			googleDirections.getDirections(args).then(function(directions) {
				$scope.distance = directions.routes[0].legs[0].distance.text;
				$scope.duration = directions.routes[0].legs[0].duration.text;
				console.log(directions);
				var arr = [];
				_.map(google.maps.geometry.encoding.decodePath(directions.routes[0].overview_polyline), function(pos) {
					arr.push({lat: pos.lat(), lng: pos.lng()});
					if($rootScope.map){
						$rootScope.map.addPolyline({
						  'points': arr,
						  'color' : "red",
						  'width': 5,
						  'geodesic': true
						}, function(polyline) {});
					}
				});
				//console.log(arr);
			});
		}
	}
	$scope.Routes = function(origin, destination){
		if(origin.length > 0 && destination.length > 0){
			plugin.google.maps.external.launchNavigation({
			  "from": origin.geometry.location.toString,
			  "to": destination.geometry.location.toString
			});
		}
	}
	$scope.getContact = function(){
		$cordovaContacts.pickContact().then(function (contactPicked) {
      		console.log(contactPicked);
      		//{"id":-1,"rawId":null,"displayName":null,"name":{"givenName":"A","formatted":"A Hieu Ky Su","middleName":null,"familyName":"Hieu Ky Su","honorificPrefix":null,"honorificSuffix":null},"nickname":null,"phoneNumbers":[{"type":"mobile","value":"01698893397","id":0,"pref":false}],"emails":null,"addresses":null,"ims":null,"organizations":null,"birthday":null,"note":null,"photos":null,"categories":null,"urls":null}
      		var options = {
	            android: {
	                intent: 'INTENT'  // send SMS with the native android SMS messaging
	            }
	        };
	        if(contactPicked && contactPicked.phoneNumbers){
	        	$cordovaSms.send(contactPicked.phoneNumbers[0].value, 'SMS content', options)
		      .then(function() {
		        // Success! SMS was sent
		        alert('send sms success');
		      }, function(error) {
		        // An error occurred
		      });
		  }
    	});
	}
	$scope.sendMail = function(){
		$cordovaEmailComposer.isAvailable().then(function() {
		   // is available
		   var email = {
		    to: 'quang.nnd.hcmus@gmail.com',
		    cc: '',
		    bcc: [],
		    attachments: [
		      
		    ],
		    subject: 'Cordova Icons',
		    body: 'How are you? Nice greetings from Leipzig',
		    isHtml: true
		  };

		 $cordovaEmailComposer.open(email).then(null, function () {
		   // user cancelled email
		 });
		 }, function () {
		   // not available
		   console.log('mail not ready');
		 });
		// $cordovaSms.send('phonenumber', 'SMS content', options)
		//       .then(function() {
		//         // Success! SMS was sent
		//       }, function(error) {
		//         // An error occurred
		//       });

		// });
	}
  // var source = "122/140 Cao Lỗ, phường 4, Quận 8, Hồ Chí Minh, Vietnam";
  // var destination = "343 Phạm Ngũ Lão, Quận 1, Hồ Chí Minh, Vietnam";
  // googleDirections.getDistance(source, destination).then(function(result){
  //   console.log(result);
  // });
})

.controller('ChatsCtrl', function($scope, $rootScope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

 //  $scope.chats = Chats.all();
 //  $scope.remove = function(chat) {
	// Chats.remove(chat);
 //  };
 $scope.$on('$ionicView.enter', function(e) {
		var onNativeMapReady = function(){
			if($rootScope.pin_icon === undefined || $rootScope.car_icon === undefined){
				$rootScope.pin_icon = global.getLocalIcon({name: "pin.png"});
				$rootScope.car_icon = global.getLocalIcon({name: "car.png"});
			}
			$rootScope.map.addMarker({
				'position': CURRENT_LOCATION,
				'icon': $rootScope.pin_icon
			}, function(marker) {
				marker.addEventListener(plugin.google.maps.event.MARKER_DRAG_END, function(marker) {
					marker.getPosition(function(latLng) {
						draggPosition = latLng;
						marker.setTitle(latLng.toUrlValue());
						marker.showInfoWindow();
					});
				});
			});
			for(var i = 1; i < 5; i++){
				$rootScope.map.addMarker({
				  'position': new plugin.google.maps.LatLng(CURRENT_LOCATION.lat + (i  / 1000), CURRENT_LOCATION.lng + (i / 1000)),
				  'title': 'Test ' + i,
				  'icon': $rootScope.car_icon
				});
			}
		};
		navigator.geolocation.getCurrentPosition(function(position){
			CURRENT_LOCATION = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			var div = document.getElementById("map_canvas_2");
			if(div){
				var mapHeight = window.innerHeight - 105;
				div.style.height = mapHeight + 'px';
				setTimeout(function(){
					if(window.plugin){
						// Initialize the map view
						if($rootScope.map === undefined){
							MY_MAP_DEFAULT_OPTION['camera'] = {
								'latLng': CURRENT_LOCATION,
								'tilt': 30,
							    'zoom': 15,
							    'bearing': 50
							};
							MY_MAP_DEFAULT_OPTION['mapType'] = plugin.google.maps.MapTypeId.ROADMAP;
							$rootScope.map = plugin.google.maps.Map.getMap(div, MY_MAP_DEFAULT_OPTION);
							$rootScope.map.addEventListener(plugin.google.maps.event.MAP_READY, onNativeMapReady);
						}
						else{
							$rootScope.map.setDiv(div);
						}
					}
				}, 10);
		  	}
		},
		function(){
			console.log("get current location failed");
		});
  	});
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $rootScope) {
	$scope.$on('$ionicView.enter', function(e) {
		var onNativeMapReady = function(){
			if($rootScope.pin_icon === undefined || $rootScope.car_icon === undefined){
				$rootScope.pin_icon = global.getLocalIcon({name: "pin.png"});
				$rootScope.car_icon = global.getLocalIcon({name: "car.png"});
			}
			$rootScope.map.addMarker({
				'position': CURRENT_LOCATION,
				'icon': $rootScope.pin_icon
			}, function(marker) {
				marker.addEventListener(plugin.google.maps.event.MARKER_DRAG_END, function(marker) {
					marker.getPosition(function(latLng) {
						draggPosition = latLng;
						marker.setTitle(latLng.toUrlValue());
						marker.showInfoWindow();
					});
				});
			});
			for(var i = 1; i < 5; i++){
				$rootScope.map.addMarker({
				  'position': new plugin.google.maps.LatLng(CURRENT_LOCATION.lat + (i  / 1000), CURRENT_LOCATION.lng + (i / 1000)),
				  'title': 'Test ' + i,
				  'icon': $rootScope.car_icon
				});
			}
		};
		navigator.geolocation.getCurrentPosition(function(position){
			CURRENT_LOCATION = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			var div = document.getElementById("map_canvas");
			if(div){
				var mapHeight = window.innerHeight - 355;
				div.style.height = mapHeight + 'px';
				setTimeout(function(){
					if(window.plugin){
						// Initialize the map view
						if($rootScope.map === undefined){
							MY_MAP_DEFAULT_OPTION['camera'] = {
								'latLng': CURRENT_LOCATION,
								'tilt': 30,
							    'zoom': 15,
							    'bearing': 50
							};
							MY_MAP_DEFAULT_OPTION['mapType'] = plugin.google.maps.MapTypeId.ROADMAP;
							$rootScope.map = plugin.google.maps.Map.getMap(div, MY_MAP_DEFAULT_OPTION);
							$rootScope.map.addEventListener(plugin.google.maps.event.MAP_READY, onNativeMapReady);
						}
						else{
							$rootScope.map.setDiv(div);
						}
					}
				}, 10);
		  	}
		},
		function(){
			console.log("get current location failed");
		});
  	});
	$scope.ExportImage = function(){
		if($rootScope.map !== undefined){
			$rootScope.map.toDataURL(function(imageData) {
		  		var image = document.getElementById("snapshot");
		  		image.src = imageData;
			});
		}
	}
});
















