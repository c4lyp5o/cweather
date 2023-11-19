const mqtt = require('mqtt');
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

const topic = '/weather_station/periodical';

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const client = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}`, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000,
});

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  client.on('connect', () => {
    console.log('Connected');

    client.subscribe([topic], () => {
      console.log(`Subscribe to topic '${topic}'`);
      client.publish(
        topic,
        'nodejs mqtt test',
        { qos: 0, retain: false },
        (error) => {
          if (error) {
            console.error(error);
          }
        }
      );
    });

    let counter = 0;
    setInterval(() => {
      let message = `Sending message no. ${counter++}`;
      client.publish(topic, message, function (err) {
        if (err) {
          console.error('MQTT Publish Error: ', err);
        }
      });
      console.log(`Message sent: ${message}.`);
    }, 2000);
  });

  client.on('message', (topic, payload) => {
    console.log('Received Message:', topic, payload.toString());
  });
}
