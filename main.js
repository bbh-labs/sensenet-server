'use strict';

// Database stuff
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
	'sensenet', // Database
	'postgres', // Username
	'Lion@123', // Password
	{
		host: 'bbh-labs.com.sg',
		dialect: 'postgres',
		logging: false,
	}
);

const Reading = sequelize.define('reading', {
	device_id: Sequelize.STRING,
	temperature: Sequelize.FLOAT,
	humidity: Sequelize.FLOAT,
	uv: Sequelize.FLOAT,
	particles: Sequelize.FLOAT,
	carbon_monoxide: Sequelize.FLOAT,
	latitude: Sequelize.FLOAT,
	longitude: Sequelize.FLOAT,
});

sequelize.sync();

// Server stuff
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/readings', function(req, res) {
	try {
		sequelize.sync().then(function() {
			Reading.findAll().then(function(readings) {
				res.send(JSON.stringify(readings));
			});
		});
	} catch(error) {
		res.sendStatus(500);
	}
});

app.post('/reading', function(req, res) {
	try {
		let reading = JSON.parse(req.body.reading);

		let deviceID = reading.deviceID;
		if (deviceID && deviceID.length != 10) {
			res.sendStatus(400);
			return;
		}

		if (typeof(reading.temperature) != 'number' ||
		    typeof(reading.humidity) != 'number' ||
			typeof(reading.uv) != 'number' ||
			typeof(reading.particles) != 'number' ||
			typeof(reading.carbonMonoxide) != 'number')
		{
			res.sendStatus(400);
			return;
		}

		let coordinates = reading.coordinates;
		if (typeof(coordinates.latitude)  != 'number' ||
		    typeof(coordinates.longitude) != 'number') {
			res.sendStatus(400);
			return;
		}

		sequelize.sync().then(function() {
			return Reading.create({
				device_id: reading.deviceID,
				temperature: reading.temperature,
				humidity: reading.humidity,
				uv: reading.uv,
				particles: reading.particles,
				carbon_monoxide: reading.carbonMonoxide,
				latitude: coordinates.latitude,
				longitude: coordinates.longitude,
			});
		}).then(function() {
			res.sendStatus(200);
		});
	} catch(error) {
		console.error(error);
		res.sendStatus(400);
	}
});

app.listen(8080, function() {
	console.log('Serving at localhost:8080');
});
