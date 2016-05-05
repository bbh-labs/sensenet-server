'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import Flux from 'flux'
import $ from 'jquery'
import cx from 'classnames'

const RADIUS = 200,
      READING_RADIUS = 1,
      DEBUG = true;

let dispatcher = new Flux.Dispatcher();

L.mapbox.accessToken = 'pk.eyJ1IjoiamFja3liIiwiYSI6ImI0NDE5NjdmMWYzMjM5YzQyMzUxNzkyOGUwMzgzZmNjIn0.7-uee1Olm9EI4cT04c6gQw';

let mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
	attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
});

let markerIcon = L.icon({
	iconUrl: 'images/marker.png',
	iconSize: [32, 43],
	iconAnchor: [15, 43],
	shadowUrl: 'images/marker_shadow.png',
	shadowSize: [42, 52],
	shadowAnchor: [20, 48],
});

function toggleSidebar(state) {
	dispatcher.dispatch({ type: 'toggleSidebar', state: state });
}

function calculateQuality(reading) {
	let temperaturePct = parseFloat(map(reading.temperature, 25, 34, 0, 100).toFixed(1));
	let humidityPct = parseFloat(map(reading.humidity, 50, 100, 0, 100).toFixed(1));
	let carbonMonoxidePct = parseFloat(map(reading.carbon_monoxide, 0, 1024, 0, 100).toFixed(1));
	let uvPct = parseFloat(map(reading.uv, 0, 15, 0, 100).toFixed(1));
	let particlesPct = parseFloat(map(reading.particles, 0, 2000, 0, 100).toFixed(1));
	let quality = (temperaturePct + humidityPct + carbonMonoxidePct + uvPct + particlesPct) / 5;
	return quality;
}

function calculateColor(quality) {
	//console.log(quality);
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
	let minDistance = 9999999999;
	let minIndex = -1;

	for (let i in readings) {
		let d = distance(readings[i].latitude, readings[i].longitude, latitude, longitude);
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

class App extends React.Component {
	render() {
		return (
			<div className='app flex column one'>
				<Navbar />
				<Map />
				<Sidebar />
			</div>
		)
	}
}

class Navbar extends React.Component {
	render() {
		return (
			<div className='navbar flex row align-center justify-center'>
				<img className='hamburger-icon flex' src='images/hamburger.png' onClick={toggleSidebar} />
				<div className='sensenet-icon-container flex one'>
					<img className='sensenet-icon' src='images/sensenet.png' />
				</div>
				<div className='search flex'>
					<input type='text' placeholder='Search SenseNet map' />
				</div>
			</div>
		)
	}
}

class Sidebar extends React.Component {
	render() {
		return (
			<div className={cx('sidebar', this.state.active && 'sidebar--active')}>
				<div className='flex row justify-end'>
					<img className='close-icon' src='images/close.png' onClick={toggleSidebar.bind(false)} />
				</div>
				<Stats />
			</div>
		)
	}
	state = {
		active: false,
	};
	componentDidMount() {
		this.listenerID = dispatcher.register((payload) => {
			switch (payload.type) {
			case 'toggleSidebar':
				let active = this.state.active;
				if (typeof(payload.state) == 'boolean') {
					this.setState({ active: payload.state });
				} else {
					this.setState({ active: !active });
				}
				break;
			}
		});
	}
}

class Stats extends React.Component {
	render() {
		let reading = this.state.reading;
		if (reading) {
			let temperaturePct = map(reading.temperature, 25, 40, 0, 100);
			let humidityPct = map(reading.humidity, 50, 100, 0, 100);
			let carbonMonoxidePct = map(reading.carbon_monoxide, 0, 1024, 0, 100);
			let uvPct = map(reading.uv, 0, 15, 0, 100);
			let particlesPct = map(reading.particles, 0, 8000, 0, 100);
			let quality = ((temperaturePct + humidityPct + carbonMonoxidePct + uvPct + particlesPct) * 0.2).toFixed();
			return (
				<div className='stats flex column one'>
					<div className='flex column one'>
						<div className='flex row one align-center justify-center'>
							<hr className='line flex one' /><p className='location-title'>LOCATION</p><hr className='line flex one' />
						</div>
						<div className='flex row one align-center justify-center'>
							<h3 className='location'>5 MAGAZINE ROAD</h3>
						</div>
					</div>
					<div className='flex column two align-center justify-center'>
						<div className={cx('air-quality-container flex column align-center justify-center', this.qualityColor(quality))}>
							<h3 className='air-quality-status'>{ this.airQualityStatus(quality) }</h3>
							<h1 className='air-quality-score'>{ quality }</h1>
						</div>
						<h3 className='air-quality-label'>AIR QUALITY</h3>
					</div>
					<div className='sensors flex column three justify-center'>
						<Sensor label='Temperature' percentage={temperaturePct} value={reading.temperature} />
						<Sensor label='Humidity' percentage={humidityPct} value={reading.humidity} />
						<Sensor label='Carbon Monoxide' percentage={carbonMonoxidePct} value={reading.carbon_monoxide} />
						<Sensor label='UV' percentage={uvPct} value={reading.uv} />
						<Sensor label='Particles' percentage={particlesPct} value={reading.particles} />
					</div>
				</div>
			)
		}
		return null;
	}
	state = {
		reading: null,

		/* FOR DEBUGGING PURPOSES
		reading: {
			temperature: 26.6,
			humidity: 49,
			uv: 11.57,
			particles: 0.62,
			carbonMonoxide: 87,
		},
		*/
	};
	componentDidMount() {
		this.listenerID = dispatcher.register((payload) => {
			switch (payload.type) {
			case 'closestReading':
				let reading = payload.reading;
				this.setState({ reading: reading });

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
	componentWillUnmount() {
		dispatcher.unregister(this.listenerID);
	}
	airQualityStatus(quality) {
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
	qualityColor(quality) {
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
}

class Sensor extends React.Component {
	render() {
		return (
			<div className='sensor flex row'>
				<h3 className='sensor-label flex'>{ this.props.label }</h3>
				<div className='flex one'>
					<span className={cx('sensor-bar', this.barLabel())} style={{ width: this.props.percentage + '%' }} />
					<span className='sensor-value flex'>{ this.props.value.toFixed(1) }</span>
				</div>
			</div>
		)
	}
	barLabel = () => {
		let percentage = this.props.percentage;
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
	};
}

class Map extends React.Component {
	render() {
		return (
			<div id='map' className='flex one'>
			</div>
		)
	}
	state = {
		readings: [],
	};
	componentDidMount() {
		this.initializeMap();
	}
	fetchReadings = (latitude, longitude) => {
		if (isNaN(latitude) == true || isNaN(longitude) == true) {
			return;
		}

		$.ajax({
			url: '/readings',
			method: 'GET',
			data: {
				latitude: latitude,
				longitude: longitude,
				radius: RADIUS,
			},
			dataType: 'json',
		}).done((readings) => {
			if (!this.map) {
				return;
			}

			if (this.readingCircles) {
				for (let i in this.readingCircles) {
					this.map.removeLayer(this.readingCircles[i]);
				}
			}

			this.readingCircles = readings.map((reading) => {
				let quality = calculateQuality(reading);
				let color = calculateColor(quality);

				let c = L.circle([reading.latitude, reading.longitude], READING_RADIUS, {
					color: color,
					fillColor: color,
					fillOpacity: 0.5,
				});
				c.addTo(this.map);

				return c;
			});

			let closest = closestReading(readings, latitude, longitude);
			dispatcher.dispatch({
				type: 'closestReading',
				reading: closest,
			});
		});
	};
	initializeMap = () => {
		navigator.geolocation.watchPosition(
			(position) => {
				let latitude = position.coords.latitude;
				let longitude = position.coords.longitude;
				this.updateMap(latitude, longitude);
				this.fetchReadings(latitude, longitude);
			}, function(error) {
				alert('error: ' + error);
			}, {
				enableHighAccuracy: true,
				timeout: 30000,
				maximumAge: 30000,
			}
		);
	};
	updateMap = (latitude, longitude) => {
		if (this.marker && this.circle) {
			this.marker.setLatLng(L.latLng(latitude, longitude));
			this.circle.setLatLng(L.latLng(latitude, longitude));
		} else {
			let mapboxTiles = L.mapbox.styleLayer('mapbox://styles/jackyb/cijmshu7s00mdbolxqpd5f5pz');
			this.map = L.map('map')
				.addLayer(mapboxTiles)
				.setView([latitude, longitude], 15);
            if (DEBUG) {
                this.map.on('click', this.postDummyData);
            }

			this.circle = L.circle([latitude, longitude], RADIUS, {
				color: 'black',
				fillColor: '#000',
				fillOpacity: 0.5,
			});
			this.circle.addTo(this.map);
			this.marker = L.marker([latitude, longitude], {icon: markerIcon});
			this.marker.addTo(this.map);
		}
	};
	updateStats = (latitude, longitude) => {
		//this.testPostReading(latitude, longitude);
		//this.fetchReadings(latitude, longitude);
	};

	// FOR DEBUGGING PURPOSE ONLY
    postDummyData(event) {
		$.ajax({
			url: 'http://sensenet.bbh-labs.com.sg/reading',
			method: 'POST',
			data: {
				deviceID: '7xGJ2sT1eF',
				temperature: 31.2 + (Math.random() - 0.5) * 1,
				humidity: 40.7 + (Math.random() - 0.5) * 1,
				uv: 3.11 + (Math.random() - 0.5) * 1,
				particles: 1500 + (Math.random() - 0.5) * 500,
				carbonMonoxide: 137 + Math.random() * 100,
				latitude: event.latlng.lat,
				longitude: event.latlng.lng,
			}
		});
    };
	testPostReading(latitude, longitude) {
		$.ajax({
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
				longitude: longitude,
			}
		});
	};
}

ReactDOM.render(<App />, document.getElementById('root'));
