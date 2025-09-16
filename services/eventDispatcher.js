import { Worker } from "worker_threads";
import path from "path";
import fs from "fs";
import models from "../models/index.js";

const dispatchEvent = async (eventData) => {
  return new Promise(async (resolve, reject) => {
    const workerPath = path.resolve(
      __dirname,
      "../workers/eventProcessor.worker.js"
    );

    if (!fs.existsSync(workerPath)) {
      console.error(`Worker file not found at: ${workerPath}`);
      try {
        await models.Log.create({
          level: "error",
          message: "Worker file not found",
          details: JSON.stringify({
            workerPath: workerPath,
            eventType: eventData.type || "unknown",
          }),
          userId: eventData.userId || null,
          timestamp: new Date().toISOString(),
        });
      } catch (logError) {
        console.error("Failed to log worker file not found error:", logError);
      }
      return reject(new Error(`Worker file not found at: ${workerPath}`));
    }

    const logEntry = {
      level: "info",
      message: `Event dispatched: ${eventData.type || "unknown"}`,
      details: JSON.stringify(eventData),
      userId: eventData.userId || null,
      timestamp: new Date().toISOString(),
    };

    try {
      await models.Log.create(logEntry);
    } catch (error) {
      console.error("Failed to log event:", error);
    }

    console.log(`Dispatching event to worker: ${JSON.stringify(eventData)}`);

    const worker = new Worker(workerPath, {
      workerData: eventData,
    });

    worker.on("message", (message) => {
      console.log(
        `Main thread received message from worker: ${JSON.stringify(message)}`
      );
      if (message.status === "success") {
        resolve(message.result);
      } else {
        models.Log.create({
          level: "error",
          message: "Worker processing failed",
          details: JSON.stringify({
            workerExitCode: message.code,
            workerError: message.error,
            eventType: eventData.type || "unknown",
          }),
          userId: eventData.userId || null,
          timestamp: new Date().toISOString(),
        }).catch((logError) =>
          console.error("Failed to log worker error:", logError)
        );
        reject(new Error(message.error || "Worker processing failed"));
      }
    });

    worker.on("error", (error) => {
      console.error("Worker encountered an error:", error);
      models.Log.create({
        level: "error",
        message: "Worker execution error",
        details: JSON.stringify({
          workerError: error.message,
          eventType: eventData.type || "unknown",
        }),
        userId: eventData.userId || null,
        timestamp: new Date().toISOString(),
      }).catch((logError) =>
        console.error("Failed to log worker execution error:", logError)
      );
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        const exitError = new Error(`Worker stopped with exit code ${code}`);
        console.error(exitError);
        models.Log.create({
          level: "error",
          message: "Worker exited with non-zero code",
          details: JSON.stringify({
            workerExitCode: code,
            eventType: eventData.type || "unknown",
          }),
          userId: eventData.userId || null,
          timestamp: new Date().toISOString(),
        }).catch((logError) =>
          console.error("Failed to log worker exit error:", logError)
        );
        reject(exitError);
      }
    });

    worker.postMessage(eventData);
  });
};

export default dispatchEvent;
