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
	device_id:       Sequelize.STRING,
	temperature:     Sequelize.FLOAT,
	humidity:        Sequelize.FLOAT,
	uv:              Sequelize.FLOAT,
	particles:       Sequelize.FLOAT,
	carbon_monoxide: Sequelize.FLOAT,
	latitude:        Sequelize.FLOAT,
	longitude:       Sequelize.FLOAT,
});

const READINGS_QUERY = 'SELECT * from (SELECT (acos(sin(radians(r.latitude)) * sin(radians(?)) + cos(radians(r.latitude)) * cos(radians(?)) * cos(radians(r.longitude - ?))) * 6371 * 1000) computedDistance, * FROM readings r)  AS tempQuery WHERE computedDistance < ? LIMIT 10';

sequelize.sync();

// Server stuff
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/readings', function(req, res) {
	try {
		let latitude = parseFloat(req.query.latitude);
		let longitude = parseFloat(req.query.longitude);
		let radius = parseFloat(req.query.radius);
		if (isNaN(radius)) {
			radius = 100;
		}

		if (!isNaN(latitude) && !isNaN(longitude)) {
			sequelize.sync().then(function() {
				sequelize.query(READINGS_QUERY, { replacements: [ latitude, latitude, longitude, radius ] })
					.then(function(readings) {
						res.send(JSON.stringify(readings[0]));
					}).catch(function(error) {
						console.log('error:', error);
					});
			});
		} else {
			sequelize.sync().then(function() {
				Reading.findAll().then(function(readings) {
					res.send(JSON.stringify(readings));
				});
			});
		}
	} catch(error) {
		console.error('error:', error);
		res.sendStatus(500);
	}
});

app.post('/reading', function(req, res) {
	let deviceID = req.body.deviceID;
	if (deviceID && deviceID.length != 10) {
		res.sendStatus(400);
		return;
	}

	let temperature = parseFloat(req.body.temperature);
	let humidity = parseFloat(req.body.humidity);
	let uv = parseFloat(req.body.uv);
	let particles = parseFloat(req.body.particles);
	let carbonMonoxide = parseFloat(req.body.carbonMonoxide);
	let latitude = parseFloat(req.body.latitude);
	let longitude = parseFloat(req.body.longitude);
	if (isNaN(temperature) &&
	    isNaN(humidity) &&
	    isNaN(uv) &&
	    isNaN(particles) &&
	    isNaN(carbonMonoxide) &&
	    isNaN(latitude) &&
	    isNaN(longitude))
	{
		res.sendStatus(400);
		return;
	}

	sequelize.sync().then(function() {
		return Reading.create({
			device_id:       req.body.deviceID,
			temperature:     req.body.temperature,
			humidity:        req.body.humidity,
			uv:              req.body.uv,
			particles:       req.body.particles,
			carbon_monoxide: req.body.carbonMonoxide,
			latitude:        req.body.latitude,
			longitude:       req.body.longitude,
		});
	}).then(function() {
		res.sendStatus(200);
	}).catch(function(error) {
		console.error('error:', error);
		res.sendStatus(500);
	});
});

app.listen(8080, function() {
	console.log('Serving at localhost:8080');
});
