'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'

class App extends React.Component {
	render() {
		return (
			<div className='readings'>
				There are { this.state.readings.length } readings
			</div>
		)
	}
	state = {
		readings: [],
	};
	componentDidMount() {
		this.fetchReadings();
	}
	fetchReadings = () => {
		$.ajax({
			url: '/readings',
			method: 'GET',
			dataType: 'json',
		}).done((readings) => {
			this.setState({ readings: readings });
		});
	};
}

ReactDOM.render(<App />, document.getElementById('root'));
