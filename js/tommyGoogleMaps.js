'use strict';
angular.module( "tommy.GoogleMaps", []);
angular.module("tommy.GoogleMaps").value('googleMaps', google.maps);
angular.module("tommy.GoogleMaps")
  .provider('googleDirections', function() {

    var defaults = {
        unitSystem: null,
        durationInTraffic: false,
        waypoints: [],
        optimizeWaypoints: false,
        provideRouteAlternatives: false,
        avoidHighways: false,
        avoidTolls: false
    };

    this.$get = function($rootScope, $q, googleMaps, $window) {
        var _travelModes = [];
        _travelModes['driving'] = googleMaps.TravelMode.DRIVING;
        _travelModes['bicycling'] = googleMaps.TravelMode.BICYCLING;
        _travelModes['transit'] = googleMaps.TravelMode.TRANSIT;
        _travelModes['walking'] = googleMaps.TravelMode.WALKING;
        var _unitSystems = [];
        _unitSystems['metric'] = googleMaps.UnitSystem.METRIC;
        _unitSystems['imperial'] = googleMaps.UnitSystem.IMPERIAL;

        function exec(args) {
            var req = angular.copy(defaults, {});
            angular.extend(req, args);
            var deferred = $q.defer();
            var elem, service;

            function callback(results, status) {
                if (status == googleMaps.DirectionsStatus.OK || status == googleMaps.DirectionsStatus.ZERO_RESULTS) {
                    $rootScope.$apply(function() {
                        return deferred.resolve(results);
                    });
                } else {
                    $rootScope.$apply(function() {
                        return deferred.reject(status);
                    });
                }
            }
            if (req.map) {
                elem = req.map;
            } else if (req.elem) {
                elem = req.elem;
            } else {
                elem = $window.document.createElement('div');
            }
            service = new googleMaps.DirectionsService();
            service['route'](req, callback);
            return deferred.promise;
        }

        return {
            getDirections: function(args) {
                var _args = angular.copy(args);
                _args.travelMode = _travelModes[args.travelMode] || googleMaps.TravelMode.DRIVING;
                _args.unitSystem = _unitSystems[args.unitSystem] || googleMaps.UnitSystem.METRIC;
                return exec(_args);
            },
            getDistance: function(source, destination){
              var deferred = $q.defer();
              var service = new google.maps.DistanceMatrixService();
              service.getDistanceMatrix({
                  origins: [source],
                  destinations: [destination],
                  travelMode: google.maps.TravelMode.DRIVING,
                  unitSystem: google.maps.UnitSystem.METRIC,
                  avoidHighways: false,
                  avoidTolls: false
              }, function (response, status) {
                  if (status == google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status != "ZERO_RESULTS") {
                      var distance = response.rows[0].elements[0].distance.text;
                      var duration = response.rows[0].elements[0].duration.text;
                      $rootScope.$apply(function() {
                        return deferred.resolve({
                          distance: distance,
                          duration: duration
                        });
                      });
                  } else {
                      $rootScope.$apply(function() {
                        return deferred.reject(status);
                      });
                  }
              });
              return deferred.promise;
            }
        };
    };

    this.$get.$inject = ['$rootScope', '$q', 'googleMaps', '$window'];

})
  .directive('disableTap', function($timeout) {
    return {
      link: function() {
        $timeout(function() {
          // Find google places div
          _.findIndex(angular.element(document.querySelectorAll('.pac-container')), function(container) {
            // disable ionic data tab
            container.setAttribute('data-tap-disabled', 'true');
            // leave input field if google-address-entry is selected
            container.onclick = function() {
              _.findIndex(angular.element(document.querySelectorAll("[disable-tap]")), function(item){
                item.blur();
              });
            };
          });
        },500);
      }
    };
  })
  .directive('tommyAddressAutocomplete', function() {
    /**
     * A directive for adding google places autocomplete to a text box
     * google places autocomplete info: https://developers.google.com/maps/documentation/javascript/places
     *
     * Usage:
     *
     * <input type="text"  tommy-address-autocomplete ng-model="autocomplete" options="options" details="details" />
     *
     * + ng-model - autocomplete textbox value
     *
     * + details - more detailed autocomplete result, includes address parts, latlng, etc. (Optional)
     *
     * + options - configuration for the autocomplete (Optional)
     *
     *       + types: type,        String, values can be 'geocode', 'establishment', '(regions)', or '(cities)'
     *       + bounds: bounds,     Google maps LatLngBounds Object, biases results to bounds, but may return results outside these bounds
     *       + country: country    String, ISO 3166-1 Alpha-2 compatible country code. examples; 'ca', 'us', 'gb'
     *       + watchEnter:         Boolean, true; on Enter select top autocomplete result. false(default); enter ends autocomplete
     *
     * example:
     *
     *    options = {
     *        types: '(cities)',
     *        country: 'ca'
     *    }
    **/
    return {
      require: 'ngModel',
      scope: {
        ngModel: '=',
        options: '=?',
        details: '=?'
      },

      link: function(scope, element, attrs, controller) {

        //options for autocomplete
        var opts
        var watchEnter = false
        //convert options provided to opts
        var initOpts = function() {

          opts = {}
          if (scope.options) {

            if (scope.options.watchEnter !== true) {
              watchEnter = false
            } else {
              watchEnter = true
            }

            if (scope.options.types) {
              opts.types = []
              opts.types.push(scope.options.types)
              scope.gPlace.setTypes(opts.types)
            } else {
              scope.gPlace.setTypes([])
            }

            if (scope.options.bounds) {
              opts.bounds = scope.options.bounds
              scope.gPlace.setBounds(opts.bounds)
            } else {
              scope.gPlace.setBounds(null)
            }

            if (scope.options.country) {
              opts.componentRestrictions = {
                country: scope.options.country
              }
              scope.gPlace.setComponentRestrictions(opts.componentRestrictions)
            } else {
              scope.gPlace.setComponentRestrictions(null)
            }
          }
        }

        if (scope.gPlace == undefined) {
          scope.gPlace = new google.maps.places.Autocomplete(element[0], {});
        }
        google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
          var result = scope.gPlace.getPlace();
          if (result !== undefined) {
            if (result.address_components !== undefined) {

              scope.$apply(function() {

                scope.details = result;

                controller.$setViewValue(element.val());
              });
            }
            else {
              if (watchEnter) {
                getPlace(result)
              }
            }
          }
        })

        //function to get retrieve the autocompletes first result using the AutocompleteService 
        var getPlace = function(result) {
          var autocompleteService = new google.maps.places.AutocompleteService();
          if (result.name.length > 0){
            autocompleteService.getPlacePredictions(
              {
                input: result.name,
                offset: result.name.length
              },
              function listentoresult(list, status) {
                if(list == null || list.length == 0) {

                  scope.$apply(function() {
                    scope.details = null;
                  });

                } else {
                  var placesService = new google.maps.places.PlacesService(element[0]);
                  placesService.getDetails(
                    {'reference': list[0].reference},
                    function detailsresult(detailsResult, placesServiceStatus) {

                      if (placesServiceStatus == google.maps.GeocoderStatus.OK) {
                        scope.$apply(function() {

                          controller.$setViewValue(detailsResult.formatted_address);
                          element.val(detailsResult.formatted_address);

                          scope.details = detailsResult;

                          //on focusout the value reverts, need to set it again.
                          var watchFocusOut = element.on('focusout', function(event) {
                            element.val(detailsResult.formatted_address);
                            element.unbind('focusout')
                          })

                        });
                      }
                    }
                  );
                }
              });
          }
        }

        controller.$render = function () {
          var location = controller.$viewValue;
          element.val(location);
        };

        //watch options provided to directive
        scope.watchOptions = function () {
          return scope.options
        };
        scope.$watch(scope.watchOptions, function () {
          initOpts()
        }, true);

      }
    };
  });