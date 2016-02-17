'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _flux = require('flux');

var _flux2 = _interopRequireDefault(_flux);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RADIUS = 200,
    READING_RADIUS = 10;

var dispatcher = new _flux2.default.Dispatcher();

L.mapbox.accessToken = 'pk.eyJ1IjoiamFja3liIiwiYSI6ImI0NDE5NjdmMWYzMjM5YzQyMzUxNzkyOGUwMzgzZmNjIn0.7-uee1Olm9EI4cT04c6gQw';

var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
	attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var markerIcon = L.icon({
	iconUrl: 'images/marker.png',
	iconSize: [32, 43],
	iconAnchor: [15, 43],
	shadowUrl: 'images/marker_shadow.png',
	shadowSize: [42, 52],
	shadowAnchor: [20, 48]
});

function toggleSidebar(state) {
	dispatcher.dispatch({ type: 'toggleSidebar', state: state });
}

function calculateAir(reading) {
	var temperaturePct = map(reading.temperature, 25, 34, 0, 100).toFixed(1);
	var humidityPct = map(reading.humidity, 50, 100, 0, 100).toFixed(1);
	var carbonMonoxidePct = map(reading.carbonMonoxide, 0, 1024, 0, 100).toFixed(1);
	var uvPct = map(reading.uv, 0, 15, 0, 100).toFixed(1);
	var particlesPct = map(reading.particles, 0, 2000, 0, 100).toFixed(1);
	return ((temperaturePct + humidityPct + carbonMonoxidePct + uvPct + particlesPct) * 0.2).toFixed();
}

function calculateColor(quality) {
	if (quality < 20) {
		return '#33AEDC';
	} else if (quality < 40) {
		return '#3CD1AF';
	} else if (quality < 60) {
		return '#FD6D4C';
	} else if (quality < 80) {
		return '#F05361';
	} else {
		return '#25243C';
	}
}

function closestReading(readings, latitude, longitude) {
	var minDistance = 9999999999;
	var minIndex = -1;

	for (var i in readings) {
		var d = distance(readings[i].latitude, readings[i].longitude, latitude, longitude);
		if (d < minDistance) {
			minDistance = d;
			minIndex = i;
		}
	}

	return readings[minIndex];
}

function radians(degrees) {
	return degrees * 180 / Math.PI;
}

function distance(lat1, lon1, lat2, lon2) {
	return Math.acos(Math.sin(radians(lat1)) * Math.sin(radians(lat2)) + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.cos(radians(lon1 - lon2))) * 6371 * 1000;
}

function map(value, min1, max1, min2, max2) {
	return (value - min1) / (max1 - min1) * (max2 - min2) - min2;
}

var App = function (_React$Component) {
	_inherits(App, _React$Component);

	function App() {
		_classCallCheck(this, App);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(App).apply(this, arguments));
	}

	_createClass(App, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement(
				'div',
				{ className: 'app flex column one' },
				_react2.default.createElement(Navbar, null),
				_react2.default.createElement(Map, null),
				_react2.default.createElement(Sidebar, null)
			);
		}
	}]);

	return App;
}(_react2.default.Component);

var Navbar = function (_React$Component2) {
	_inherits(Navbar, _React$Component2);

	function Navbar() {
		_classCallCheck(this, Navbar);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(Navbar).apply(this, arguments));
	}

	_createClass(Navbar, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement(
				'div',
				{ className: 'navbar flex row align-center justify-center' },
				_react2.default.createElement('img', { className: 'hamburger-icon flex', src: 'images/hamburger.png', onClick: toggleSidebar }),
				_react2.default.createElement(
					'div',
					{ className: 'sensenet-icon-container flex one' },
					_react2.default.createElement('img', { className: 'sensenet-icon', src: 'images/sensenet.png' })
				),
				_react2.default.createElement(
					'div',
					{ className: 'search flex' },
					_react2.default.createElement('input', { type: 'text', placeholder: 'Search SenseNet map' })
				)
			);
		}
	}]);

	return Navbar;
}(_react2.default.Component);

var Sidebar = function (_React$Component3) {
	_inherits(Sidebar, _React$Component3);

	function Sidebar() {
		var _Object$getPrototypeO;

		var _temp, _this3, _ret;

		_classCallCheck(this, Sidebar);

		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return _ret = (_temp = (_this3 = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Sidebar)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this3), _this3.state = {
			active: false
		}, _temp), _possibleConstructorReturn(_this3, _ret);
	}

	_createClass(Sidebar, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement(
				'div',
				{ className: (0, _classnames2.default)('sidebar', this.state.active && 'sidebar--active') },
				_react2.default.createElement(
					'div',
					{ className: 'flex row justify-end' },
					_react2.default.createElement('img', { className: 'close-icon', src: 'images/close.png', onClick: toggleSidebar.bind(false) })
				),
				_react2.default.createElement(Stats, null)
			);
		}
	}, {
		key: 'componentDidMount',
		value: function componentDidMount() {
			var _this4 = this;

			this.listenerID = dispatcher.register(function (payload) {
				switch (payload.type) {
					case 'toggleSidebar':
						var active = _this4.state.active;
						if (typeof payload.state == 'boolean') {
							_this4.setState({ active: payload.state });
						} else {
							_this4.setState({ active: !active });
						}
						break;
				}
			});
		}
	}]);

	return Sidebar;
}(_react2.default.Component);

var Stats = function (_React$Component4) {
	_inherits(Stats, _React$Component4);

	function Stats() {
		var _Object$getPrototypeO2;

		var _temp2, _this5, _ret2;

		_classCallCheck(this, Stats);

		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		return _ret2 = (_temp2 = (_this5 = _possibleConstructorReturn(this, (_Object$getPrototypeO2 = Object.getPrototypeOf(Stats)).call.apply(_Object$getPrototypeO2, [this].concat(args))), _this5), _this5.state = {
			reading: null

		}, _temp2), _possibleConstructorReturn(_this5, _ret2);
	}

	_createClass(Stats, [{
		key: 'render',
		value: function render() {
			var reading = this.state.reading;
			if (reading) {
				var temperaturePct = map(reading.temperature, 25, 34, 0, 100);
				var humidityPct = map(reading.humidity, 50, 100, 0, 100);
				var carbonMonoxidePct = map(reading.carbon_monoxide, 0, 1024, 0, 100);
				var uvPct = map(reading.uv, 0, 15, 0, 100);
				var particlesPct = map(reading.particles, 0, 2000, 0, 100);
				var quality = ((temperaturePct + humidityPct + carbonMonoxidePct + uvPct + particlesPct) * 0.2).toFixed();
				return _react2.default.createElement(
					'div',
					{ className: 'stats flex column one' },
					_react2.default.createElement(
						'div',
						{ className: 'flex column one' },
						_react2.default.createElement(
							'div',
							{ className: 'flex row one align-center justify-center' },
							_react2.default.createElement('hr', { className: 'line flex one' }),
							_react2.default.createElement(
								'p',
								{ className: 'location-title' },
								'LOCATION'
							),
							_react2.default.createElement('hr', { className: 'line flex one' })
						),
						_react2.default.createElement(
							'div',
							{ className: 'flex row one align-center justify-center' },
							_react2.default.createElement(
								'h3',
								{ className: 'location' },
								'5 MAGAZINE ROAD'
							)
						)
					),
					_react2.default.createElement(
						'div',
						{ className: 'flex column two align-center justify-center' },
						_react2.default.createElement(
							'div',
							{ className: (0, _classnames2.default)('air-quality-container flex column align-center justify-center', this.qualityColor(quality)) },
							_react2.default.createElement(
								'h3',
								{ className: 'air-quality-status' },
								this.airQualityStatus(quality)
							),
							_react2.default.createElement(
								'h1',
								{ className: 'air-quality-score' },
								quality
							)
						),
						_react2.default.createElement(
							'h3',
							{ className: 'air-quality-label' },
							'AIR QUALITY'
						)
					),
					_react2.default.createElement(
						'div',
						{ className: 'sensors flex column three justify-center' },
						_react2.default.createElement(Sensor, { label: 'Temperature', percentage: temperaturePct, value: reading.temperature }),
						_react2.default.createElement(Sensor, { label: 'Humidity', percentage: humidityPct, value: reading.humidity }),
						_react2.default.createElement(Sensor, { label: 'Carbon Monoxide', percentage: carbonMonoxidePct, value: reading.carbon_monoxide }),
						_react2.default.createElement(Sensor, { label: 'UV', percentage: uvPct, value: reading.uv }),
						_react2.default.createElement(Sensor, { label: 'Particles', percentage: particlesPct, value: reading.particles })
					)
				);
			}
			return null;
		}
	}, {
		key: 'componentDidMount',
		/* FOR DEBUGGING PURPOSES
  reading: {
  	temperature: 26.6,
  	humidity: 49,
  	uv: 11.57,
  	particles: 0.62,
  	carbonMonoxide: 87,
  },
  */
		value: function componentDidMount() {
			var _this6 = this;

			this.listenerID = dispatcher.register(function (payload) {
				switch (payload.type) {
					case 'closestReading':
						var reading = payload.reading;
						_this6.setState({ reading: reading });

						/* TODO: reverse geocoding
      let lat = reading.latitude;
      let lon = reading.longitude;
      $.getJSON('nominatim.openstreetmap.org/reverse', { format: 'json', json_callback: '?', lat: lat, lon: lon }, (data) => {
      	alert(JSON.stringify(data));
      });
      */
						break;
				}
			});
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			dispatcher.unregister(this.listenerID);
		}
	}, {
		key: 'airQualityStatus',
		value: function airQualityStatus(quality) {
			if (quality < 20) {
				return 'VERY CLEAN';
			} else if (quality < 40) {
				return 'CLEAN';
			} else if (quality < 60) {
				return 'POLLUTED';
			} else if (quality < 80) {
				return 'HAZARDOUS';
			} else {
				return 'VERY HAZARDOUS';
			}
		}
	}, {
		key: 'qualityColor',
		value: function qualityColor(quality) {
			if (quality < 20) {
				return 'very-low';
			} else if (quality < 40) {
				return 'low';
			} else if (quality < 60) {
				return 'medium';
			} else if (quality < 80) {
				return 'high';
			} else {
				return 'very-high';
			}
		}
	}]);

	return Stats;
}(_react2.default.Component);

var Sensor = function (_React$Component5) {
	_inherits(Sensor, _React$Component5);

	function Sensor() {
		var _Object$getPrototypeO3;

		var _temp3, _this7, _ret3;

		_classCallCheck(this, Sensor);

		for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
			args[_key3] = arguments[_key3];
		}

		return _ret3 = (_temp3 = (_this7 = _possibleConstructorReturn(this, (_Object$getPrototypeO3 = Object.getPrototypeOf(Sensor)).call.apply(_Object$getPrototypeO3, [this].concat(args))), _this7), _this7.barLabel = function () {
			var percentage = _this7.props.percentage;
			if (percentage < 20) {
				return 'very-low';
			} else if (percentage < 40) {
				return 'low';
			} else if (percentage < 60) {
				return 'medium';
			} else if (percentage < 80) {
				return 'high';
			} else {
				return 'very-high';
			}
		}, _temp3), _possibleConstructorReturn(_this7, _ret3);
	}

	_createClass(Sensor, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement(
				'div',
				{ className: 'sensor flex row' },
				_react2.default.createElement(
					'h3',
					{ className: 'sensor-label flex' },
					this.props.label
				),
				_react2.default.createElement(
					'div',
					{ className: 'flex one' },
					_react2.default.createElement('span', { className: (0, _classnames2.default)('sensor-bar', this.barLabel()), style: { width: this.props.percentage + '%' } }),
					_react2.default.createElement(
						'span',
						{ className: 'sensor-value flex' },
						this.props.value.toFixed(1)
					)
				)
			);
		}
	}]);

	return Sensor;
}(_react2.default.Component);

var Map = function (_React$Component6) {
	_inherits(Map, _React$Component6);

	function Map() {
		var _Object$getPrototypeO4;

		var _temp4, _this8, _ret4;

		_classCallCheck(this, Map);

		for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
			args[_key4] = arguments[_key4];
		}

		return _ret4 = (_temp4 = (_this8 = _possibleConstructorReturn(this, (_Object$getPrototypeO4 = Object.getPrototypeOf(Map)).call.apply(_Object$getPrototypeO4, [this].concat(args))), _this8), _this8.state = {
			readings: []
		}, _this8.fetchReadings = function (latitude, longitude) {
			if (isNaN(latitude) == true || isNaN(longitude) == true) {
				return;
			}

			_jquery2.default.ajax({
				url: '/readings',
				method: 'GET',
				data: {
					latitude: latitude,
					longitude: longitude,
					radius: RADIUS
				},
				dataType: 'json'
			}).done(function (readings) {
				if (!_this8.map) {
					return;
				}

				if (_this8.readingCircles) {
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = _this8.readingCircles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var c = _step.value;

							_this8.map.removeLayer(c);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}
				}

				_this8.readingCircles = readings.map(function (reading) {
					var air = calculateAir(reading);
					var color = calculateColor(air.quality);

					var c = L.circle([reading.latitude, reading.longitude], READING_RADIUS, {
						color: color,
						fillColor: color,
						fillOpacity: 0.5
					});
					c.addTo(_this8.map);

					return c;
				});

				var closest = closestReading(readings, latitude, longitude);
				dispatcher.dispatch({
					type: 'closestReading',
					reading: closest
				});
			});
		}, _this8.initializeMap = function () {
			navigator.geolocation.watchPosition(function (position) {
				var latitude = position.coords.latitude;
				var longitude = position.coords.longitude;
				_this8.updateMap(latitude, longitude);
				_this8.fetchReadings(latitude, longitude);
			}, function (error) {
				alert('error: ' + error);
			}, {
				enableHighAccuracy: true,
				timeout: 30000,
				maximumAge: 30000
			});
		}, _this8.updateMap = function (latitude, longitude) {
			if (_this8.marker && _this8.circle) {
				_this8.marker.setLatLng(L.latLng(latitude, longitude));
				_this8.circle.setLatLng(L.latLng(latitude, longitude));
			} else {
				var _mapboxTiles = L.mapbox.styleLayer('mapbox://styles/jackyb/cijmshu7s00mdbolxqpd5f5pz');
				_this8.map = L.map('map').addLayer(_mapboxTiles).setView([latitude, longitude], 15);
				_this8.circle = L.circle([latitude, longitude], RADIUS, {
					color: 'black',
					fillColor: '#000',
					fillOpacity: 0.5
				});
				_this8.circle.addTo(_this8.map);
				_this8.marker = L.marker([latitude, longitude], { icon: markerIcon });
				_this8.marker.addTo(_this8.map);
			}
		}, _this8.updateStats = function (latitude, longitude) {
			//this.testPostReading(latitude, longitude);
			//this.fetchReadings(latitude, longitude);
		}, _temp4), _possibleConstructorReturn(_this8, _ret4);
	}

	_createClass(Map, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement('div', { id: 'map', className: 'flex one' });
		}
	}, {
		key: 'componentDidMount',
		value: function componentDidMount() {
			this.initializeMap();
		}
	}, {
		key: 'testPostReading',


		// FOR DEBUGGING PURPOSE ONLY
		value: function testPostReading(latitude, longitude) {
			_jquery2.default.ajax({
				url: '/reading',
				method: 'POST',
				data: {
					deviceID: '7xGJ2sT1eF',
					temperature: 35.2 + Math.random(),
					humidity: 22.7 + Math.random(),
					uv: 11.81 + Math.random(),
					particles: 0.62 + Math.random(),
					carbonMonoxide: 62 + Math.random(),
					latitude: latitude,
					longitude: longitude
				}
			});
		}
	}]);

	return Map;
}(_react2.default.Component);

_reactDom2.default.render(_react2.default.createElement(App, null), document.getElementById('root'));