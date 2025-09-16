import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs'; // To check if worker file exists
// import Log from '../models/log'; // Removed incorrect import

// Function to dispatch an event to a worker thread
const dispatchEvent = (eventData) => {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(__dirname, '../workers/eventProcessor.worker.js');

    // Check if the worker file exists before attempting to create a worker
    if (!fs.existsSync(workerPath)) {
      console.error(`Worker file not found at: ${workerPath}`);
      return reject(new Error(`Worker file not found at: ${workerPath}`));
    }

    // Log the event before dispatching
    const logEntry = {
      level: 'info', // or 'debug', 'warn', 'error' based on eventData
      message: `Event dispatched: ${eventData.type || 'unknown'}`,
      details: JSON.stringify(eventData),
      // Assuming eventData might contain userId or similar for context
      userId: eventData.userId || null,
      timestamp: new Date().toISOString(),
    };

    // Attempt to log the event. If models.Log.create is async, this might need adjustment.
    // For now, assuming it's synchronous or fire-and-forget.
    try {
      // If models.Log.create is async, we'd need to make dispatchEvent async and await models.Log.create(logEntry);
      models.Log.create(logEntry);
    } catch (error) {
      console.error('Failed to log event:', error);
      // Decide if logging failure should reject the promise or be ignored.
      // For now, we'll log the error but still proceed with event dispatch.
    }

    console.log(`Dispatching event to worker: ${JSON.stringify(eventData)}`);

    const worker = new Worker(workerPath, {
      workerData: eventData // Pass initial data to the worker if needed
    });

    // Listen for messages from the worker
    worker.on('message', (message) => {
      console.log(`Main thread received message from worker: ${JSON.stringify(message)}`);
      if (message.status === 'success') {
        resolve(message.result);
      } else {
        reject(new Error(message.error || 'Worker processing failed'));
      }
    });

    // Handle errors during worker execution
    worker.on('error', (error) => {
      console.error('Worker encountered an error:', error);
      reject(error);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      if (code !== 0) {
        const exitError = new Error(`Worker stopped with exit code ${code}`);
        console.error(exitError);
        reject(exitError);
      }
    });

    // Send the event data to the worker
    worker.postMessage(eventData);
  });
};

export default dispatchEvent;
