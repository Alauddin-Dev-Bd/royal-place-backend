import { kafka } from "./kafkaclient";
import { parseKafkaMessage } from "./messageParser";

export const createConsumer = async <T>(
  groupId: string,
  topic: string,
  handler: (data: T) => Promise<void>,
) => {
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`✅ Consumer connected → ${topic}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const data = parseKafkaMessage<T>(message.value);
      if (!data) return;

      await handler(data);
    },
  });
};
