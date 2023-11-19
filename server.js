require('dotenv').config();
const mqtt = require('mqtt');
const fastify = require('fastify')({ logger: true });

const prismaClient = require('./prisma/client');

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
let byYear = [];

function calculateMedian(values) {
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);

  if (values.length % 2) {
    return values[half];
  }

  return (values[half - 1] + values[half]) / 2.0;
}

function calculateAndSave(placeId, values, saveFunction) {
  const medianTemperature = calculateMedian(values.map((x) => x.temperature));
  const medianHumidity = calculateMedian(values.map((x) => x.humidity));
  saveFunction(placeId, medianTemperature, medianHumidity);
}

async function saveToMinuteTable(placeId, temperature, humidity) {
  try {
    await prismaClient.byMinute.create({
      data: {
        placeId,
        temperature,
        humidity,
      },
    });
    console.log('Saved to minute table');
  } catch (error) {
    console.error(error);
  }
}

async function saveToHourTable(placeId, temperature, humidity) {
  try {
    await prismaClient.byHour.create({
      data: {
        placeId,
        temperature,
        humidity,
      },
    });
    console.log('Saved to hour table');
  } catch (error) {
    console.error(error);
  }
}

async function saveToDayTable(placeId, temperature, humidity) {
  try {
    await prismaClient.byDay.create({
      data: {
        placeId,
        temperature,
        humidity,
      },
    });
    console.log('Saved to day table');
  } catch (error) {
    console.error(error);
  }
}

async function saveToMonthTable(placeId, temperature, humidity) {
  try {
    await prismaClient.byMonth.create({
      data: {
        placeId,
        temperature,
        humidity,
      },
    });
    console.log('Saved to month table');
  } catch (error) {
    console.error(error);
  }
}

async function saveToYearTable(placeId, temperature, humidity) {
  try {
    await prismaClient.byYear.create({
      data: {
        placeId,
        temperature,
        humidity,
      },
    });
    console.log('Saved to year table');
  } catch (error) {
    console.error(error);
  }
}

// register a route
fastify.get('/', async (request, reply) => {
  const { placeId, type } = request.query;

  if (!placeId || !type) {
    const distinctPlaceId = await prismaClient.byMinute.findMany({
      distinct: ['placeId'],
    });
    distinctPlaceId.map(() => x.placeId);
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
  const message = JSON.parse(payload.toString());

  // Validation for MQTT messages
  if (!message.temperature || !message.humidity || !message.placeId) {
    console.error('Invalid message:', message);
    return;
  }

  process.stdout.write('.');

  const { temperature, humidity, placeId } = JSON.parse(payload.toString());

  temperatureValues.push(temperature);
  humidityValues.push(humidity);
  messageCount++;

  if (messageCount === 30) {
    process.stdout.write('\n' + new Date().toLocaleString() + ' ');
    console.log('30 messages received');
    calculateAndSave(placeId, temperatureValues, saveToMinuteTable);

    messageCount = 0;
    temperatureValues = [];
    humidityValues = [];
  }

  if (byMinute.length === 60) {
    process.stdout.write('\n' + new Date().toLocaleString() + ' ');
    console.log('60 minutes passed');
    calculateAndSave(placeId, byMinute, saveToHourTable);

    byMinute = [];
  }

  if (byHour.length === 24) {
    process.stdout.write('\n' + new Date().toLocaleString() + ' ');
    console.log('24 hours passed');
    calculateAndSave(placeId, byHour, saveToDayTable);

    byHour = [];
  }

  if (byDay.length === 30) {
    process.stdout.write('\n' + new Date().toLocaleString() + ' ');
    console.log('30 days passed');
    calculateAndSave(placeId, byDay, saveToMonthTable);

    byDay = [];
  }

  if (byMonth.length === 12) {
    process.stdout.write('\n' + new Date().toLocaleString() + ' ');
    console.log('12 months passed');
    calculateAndSave(placeId, byMonth, saveToYearTable);

    byMonth = [];
  }
});

// start the server
fastify.listen({ port: process.env.PORT || 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
