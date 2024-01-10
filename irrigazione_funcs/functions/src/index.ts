import * as functions from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";



exports.nodePubSub = functions.pubsub.onMessagePublished(
  "projects/irrigazione-iot/topics/dataflow-pubsub",
  (event) => {
    try {
      const received = event.data.message.json;
      const sensor = received.SensorType;
      const ch1 = received.value1;
      const ch2 = received.value2;
      const time = event.data.message.publishTime;
      // const topic = event.data.message;
      logger.info(
        `The following message was received ${sensor} - IN = ${ch1} - OUT = ${ch2} at ${time}`
      );
    } catch (error) {
      logger.error("Encountered an error");
    }
  }
);
