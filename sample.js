// Function to generate a random number between min (inclusive) and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a random timestamp within a given range
function getRandomTimestamp(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Function to generate an array of JSON objects with random timestamps
function generateRandomJSONs(numJSONs, startTime, endTime) {
  const jsons = [];
  const timeInterval = 15 * 60 * 1000; // 15 minutes in milliseconds

  for (let i = 0; i < numJSONs; i++) {
    const randomExecutionTime = getRandomInt(1000, 25000); // Example random execution time
    const randomTimestamp = getRandomTimestamp(startTime, endTime);
    const formattedTimestamp = randomTimestamp.toISOString();

    const json = {
      Identifier: `ID-${i}`,
      ExecutionTime: randomExecutionTime,
      Timestamp: formattedTimestamp,
    };

    jsons.push(json);
  }

  return jsons;
}

// Calculate start and end time for the range (current time to 12 hours back)
const currentTime = new Date();
const twelveHoursAgo = new Date(currentTime.getTime() - 12 * 60 * 60 * 1000);

// Generate 30 JSONs with random timestamps within the range
const numJSONs = 100;
const jsons = generateRandomJSONs(numJSONs, twelveHoursAgo, currentTime);

// console.log(jsons);
