// FILEPATH: /home/calypso/Projects/cweather/server.test.js
const {
  saveToMinuteTable,
  saveToHourTable,
  saveToDayTable,
  saveToMonthTable,
} = require('./server');
const prismaClient = require('./prisma/client');

jest.mock('./prisma/client', () => ({
  byMinute: {
    create: jest.fn(),
  },
  byHour: {
    create: jest.fn(),
  },
  byDay: {
    create: jest.fn(),
  },
  byMonth: {
    create: jest.fn(),
  },
}));

describe('saveToMinuteTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prismaClient.byMinute.create with correct arguments', async () => {
    await saveToMinuteTable('placeId', 'temperature', 'humidity');
    expect(prismaClient.byMinute.create).toHaveBeenCalledWith({
      data: {
        placeId: 'placeId',
        temperature: 'temperature',
        humidity: 'humidity',
      },
    });
  });

  it('logs "Saved to minute table" on successful creation', async () => {
    console.log = jest.fn();
    await saveToMinuteTable('placeId', 'temperature', 'humidity');
    expect(console.log).toHaveBeenCalledWith('Saved to minute table');
  });

  it('logs error on failed creation', async () => {
    console.error = jest.fn();
    prismaClient.byMinute.create.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    await saveToMinuteTable('placeId', 'temperature', 'humidity');
    expect(console.error).toHaveBeenCalledWith(new Error('Database error'));
  });
});

describe('saveToHourTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prismaClient.byHour.create with correct arguments', async () => {
    await saveToHourTable('placeId', 'temperature', 'humidity');
    expect(prismaClient.byHour.create).toHaveBeenCalledWith({
      data: {
        placeId: 'placeId',
        temperature: 'temperature',
        humidity: 'humidity',
      },
    });
  });

  it('logs "Saved to hour table" on successful creation', async () => {
    console.log = jest.fn();
    await saveToHourTable('placeId', 'temperature', 'humidity');
    expect(console.log).toHaveBeenCalledWith('Saved to hour table');
  });

  it('logs error on failed creation', async () => {
    console.error = jest.fn();
    prismaClient.byHour.create.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    await saveToHourTable('placeId', 'temperature', 'humidity');
    expect(console.error).toHaveBeenCalledWith(new Error('Database error'));
  });
});

describe('saveToDayTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prismaClient.byDay.create with correct arguments', async () => {
    await saveToDayTable('placeId', 'temperature', 'humidity');
    expect(prismaClient.byDay.create).toHaveBeenCalledWith({
      data: {
        placeId: 'placeId',
        temperature: 'temperature',
        humidity: 'humidity',
      },
    });
  });

  it('logs "Saved to day table" on successful creation', async () => {
    console.log = jest.fn();
    await saveToDayTable('placeId', 'temperature', 'humidity');
    expect(console.log).toHaveBeenCalledWith('Saved to day table');
  });

  it('logs error on failed creation', async () => {
    console.error = jest.fn();
    prismaClient.byDay.create.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    await saveToDayTable('placeId', 'temperature', 'humidity');
    expect(console.error).toHaveBeenCalledWith(new Error('Database error'));
  });
});

describe('saveToMonthTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prismaClient.byMonth.create with correct arguments', async () => {
    await saveToMonthTable('placeId', 'temperature', 'humidity');
    expect(prismaClient.byMonth.create).toHaveBeenCalledWith({
      data: {
        placeId: 'placeId',
        temperature: 'temperature',
        humidity: 'humidity',
      },
    });
  });

  it('logs "Saved to month table" on successful creation', async () => {
    console.log = jest.fn();
    await saveToMonthTable('placeId', 'temperature', 'humidity');
    expect(console.log).toHaveBeenCalledWith('Saved to month table');
  });

  it('logs error on failed creation', async () => {
    console.error = jest.fn();
    prismaClient.byMonth.create.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    await saveToMonthTable('placeId', 'temperature', 'humidity');
    expect(console.error).toHaveBeenCalledWith(new Error('Database error'));
  });
});
