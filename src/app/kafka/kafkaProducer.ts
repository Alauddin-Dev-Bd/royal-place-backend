import { kafka } from "./kafkaclient";

const producer = kafka.producer();

export const initProducer = async () => {
  await producer.connect();
  console.log("✅ Kafka Producer Connected");
};

export const sendMessage = async (topic: string, message: any) => {
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message), // ✅ correct
      },
    ],
  });
};
