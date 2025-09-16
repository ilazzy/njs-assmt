const { parentPort, workerData } = require('worker_threads');

// Simulate a time-consuming task
const processEvent = async (eventData) => {
  console.log(`Worker received event: ${JSON.stringify(eventData)}`);
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 2000));
  const result = `Processed event: ${eventData.id}`;
  console.log(`Worker finished processing: ${result}`);
  return result;
};

// Listen for messages from the main thread
parentPort.on('message', async (eventData) => {
  try {
    const result = await processEvent(eventData);
    // Send the result back to the main thread
    parentPort.postMessage({ status: 'success', result });
  } catch (error) {
    console.error('Worker error:', error);
    // Send error back to the main thread
    parentPort.postMessage({ status: 'error', error: error.message });
  }
});
