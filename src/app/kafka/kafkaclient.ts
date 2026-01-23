import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

export const kafka = new Kafka({
  clientId: "royal-place-app",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});
