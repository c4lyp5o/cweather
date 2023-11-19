var amqp = require('amqplib/callback_api');

amqp.connect(
  `amqp://${process.env.MQTT_SERVER}`,
  function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      let counter = 0;
      setInterval(() => {
        let message = `Sending message no. ${counter++}`;
        channel.assertExchange('mqtt_exchange', 'direct', {
          durable: false,
        });
        channel.publish(
          'mqtt_exchange',
          'mqtt_routing_key',
          Buffer.from(message)
        );
        console.log(`Message sent: ${message}`);
      }, 2000);
    });
  }
);
