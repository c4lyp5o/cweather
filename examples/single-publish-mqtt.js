var mqtt = require('mqtt');
var client = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}`, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

client.on('connect', function () {
  let counter = 0;
  setInterval(() => {
    let message = `Sending message no. ${counter++}`;
    const res = client.publish('mqtt_exchange', message);
    console.log(`Message sent: ${message}. Status: ${res}`);
  }, 2000);
});
