# IonicDemoTestUserCar
test ionic and ngCordova

## step 1: add <b>$cordovaSms</b> to your controller, like this:

```javascript
angular.module('starter.controllers', ['tommy.GoogleMaps'])

.controller('DashCtrl', function($scope, $rootScope, googleDirections, $cordovaContacts, $cordovaEmailComposer, $cordovaSms, $window) {

```
## step 2: get contact phone number and send sms to that number

```javascript
$scope.getContact = function(){
		$cordovaContacts.pickContact().then(function (contactPicked) {
      		console.log(contactPicked);// you can see all values of result in console log
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
```
