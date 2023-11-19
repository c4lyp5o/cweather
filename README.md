# Weather Station Data Aggregator

This Node.js application subscribes to an MQTT broker and aggregates weather data from multiple weather stations. The data is then saved to a database.

## Features

- Subscribes to an MQTT broker to receive weather data in real-time.
- Aggregates the data by minute, hour, day, month, and year.
- Calculates the median temperature and humidity for each time period.
- Saves the aggregated data to a database.

## Setup

1. Clone the repository: `git clone <repository-url>`.
2. Install the dependencies: `npm install`.
3. Set the environment variables: `MQTT_SERVER`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TOPIC` and `PORT`.
4. Start the server: `npm start`.

## Environment Variables

- `MQTT_SERVER`: The URL of the MQTT broker to subscribe to.
- `MQTT_USERNAME`: The username to use when connecting to the MQTT broker.
- `MQTT_PASSWORD`: The password to use when connecting to the MQTT broker.
- `MQTT_TOPIC`: The MQTT topic to subscribe to.
- `PORT`: The port to run the server on. Defaults to 3000 if not set.

## Usage

Send a GET request to the root endpoint (`/`) with the `placeId` and `type` query parameters to retrieve the aggregated weather data for a specific place and time period.

Example: `GET /?placeId=dengkil&type=hour`

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
