require('dotenv').config();
const mqtt = require('mqtt');
const fastify = require('fastify')({ logger: true });
const winston = require('winston');

const prismaClient = require('./prisma/client');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.json(),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: './logs/logfile.log' }),
  ],
});

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const client = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}`, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000,
});

let temperatureValues = [];
let humidityValues = [];

let messageCount = 0;
let byMinute = [];
let byHour = [];
let byDay = [];
let byMonth = [];

function calculateMedian(values) {
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);

  if (values.length % 2) {
    return values[half];
  }

  return (values[half - 1] + values[half]) / 2.0;
}

async function saveToTable(tableName, placeId, temperature, humidity) {
  try {
    await prismaClient[tableName].create({
      data: {
        placeId,
        temperature,
        humidity,
      },
    });
    logger.info(`Saved to ${tableName} table`);
  } catch (error) {
    logger.error(`Failed to save to ${tableName} table: ${error.message}`);
  }
}

// register a route
fastify.get('/', async (request, reply) => {
  const { placeId, type } = request.query;

  if (!placeId || !type) {
    const distinctPlaceId = await prismaClient.byMinute.findMany({
      distinct: ['placeId'],
    });
    distinctPlaceId.map((x) => x.placeId);
    return {
      message:
        'Calypso Weather Station API. Please provide placeId and type as query string.',
      version: '1.0.0',
      availablePlaceId: distinctPlaceId,
    };
  }

  if (
    typeof placeId !== 'string' ||
    !['minute', 'hour', 'day', 'month', 'year'].includes(type)
  ) {
    reply.status(400).send({ error: 'Invalid placeId or type' });
    return;
  }

  let tempData;
  let humidData;

  switch (type) {
    case 'minute':
      const byMinute = await prismaClient.byMinute.findMany({
        where: {
          placeId: placeId,
        },
      });
      tempData = calculateMedian(byMinute.map((x) => x.temperature));
      humidData = calculateMedian(byMinute.map((x) => x.humidity));
      break;
    case 'hour':
      const byHour = await prismaClient.byHour.findMany({
        where: {
          placeId: placeId,
        },
      });
      tempData = calculateMedian(byHour.map((x) => x.temperature));
      humidData = calculateMedian(byHour.map((x) => x.humidity));
      break;
    case 'day':
      const byDay = await prismaClient.byDay.findMany({
        where: {
          placeId: placeId,
        },
      });
      tempData = calculateMedian(byDay.map((x) => x.temperature));
      humidData = calculateMedian(byDay.map((x) => x.humidity));
      break;
    case 'month':
      const byMonth = await prismaClient.byMonth.findMany({
        where: {
          placeId: placeId,
        },
      });
      tempData = calculateMedian(byMonth.map((x) => x.temperature));
      humidData = calculateMedian(byMonth.map((x) => x.humidity));
      break;
    case 'year':
      const byYear = await prismaClient.byYear.findMany({
        where: {
          placeId: placeId,
        },
      });
      tempData = calculateMedian(byYear.map((x) => x.temperature));
      humidData = calculateMedian(byYear.map((x) => x.humidity));
      break;
    default:
      break;
  }

  return {
    placeId: placeId,
    temperature: tempData,
    humidity: humidData,
  };
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  client.subscribe([process.env.MQTT_TOPIC], () => {
    console.log(`Subscribe to topic '${process.env.MQTT_TOPIC}'`);
  });
});

client.on('error', (err) => {
  console.error('Error occurred:', err);
});

client.on('message', (topic, payload) => {
  try {
    const message = JSON.parse(payload.toString());

    // Validation for MQTT messages
    if (!message.placeId || !message.temperature || !message.humidity) {
      throw new Error('Invalid message format');
    }

    process.stdout.write('.');

    temperatureValues.push(message.temperature);
    humidityValues.push(message.humidity);
    messageCount++;

    if (messageCount === 30) {
      process.stdout.write('\n' + new Date().toLocaleString() + ' ');
      console.log('30 messages received');
      saveToTable(
        'byMinute',
        message.placeId,
        calculateMedian(temperatureValues),
        calculateMedian(humidityValues)
      );

      messageCount = 0;
      temperatureValues = [];
      humidityValues = [];
    }

    if (byMinute.length === 60) {
      process.stdout.write('\n' + new Date().toLocaleString() + ' ');
      console.log('60 minutes passed');
      saveToTable(
        'byHour',
        message.placeId,
        calculateMedian(temperatureValues),
        calculateMedian(humidityValues)
      );

      byMinute = [];
    }

    if (byHour.length === 24) {
      process.stdout.write('\n' + new Date().toLocaleString() + ' ');
      console.log('24 hours passed');
      saveToTable(
        'byDay',
        message.placeId,
        calculateMedian(temperatureValues),
        calculateMedian(humidityValues)
      );

      byHour = [];
    }

    if (byDay.length === 30) {
      process.stdout.write('\n' + new Date().toLocaleString() + ' ');
      console.log('30 days passed');
      saveToTable(
        'byMonth',
        message.placeId,
        calculateMedian(temperatureValues),
        calculateMedian(humidityValues)
      );

      byDay = [];
    }

    if (byMonth.length === 12) {
      process.stdout.write('\n' + new Date().toLocaleString() + ' ');
      console.log('12 months passed');
      saveToTable(
        'byYear',
        message.placeId,
        calculateMedian(temperatureValues),
        calculateMedian(humidityValues)
      );

      byMonth = [];
    }
  } catch (error) {
    logger.error(`Failed to process message: ${error.message}`);
  }
});

// start the server
fastify.listen(
  { port: process.env.PORT || 3000, host: '0.0.0.0' },
  (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  }
);
