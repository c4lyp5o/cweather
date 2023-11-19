const amqp = require('amqplib/callback_api');
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
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
          channel.assertExchange('mqtt_exchange', 'topic', {
            durable: true,
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
}
