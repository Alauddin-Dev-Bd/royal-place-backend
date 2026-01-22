import mongoose from "mongoose";
import app from "./app";
import { envVariable } from "./app/config";
import { logger } from "./app/utils/logger";
import { initProducer } from "./app/kafka/kafkaProducer";
import { startPaymentConsumer } from "./app/kafka/paymentConsumer";
import { startNotificationConsumer } from "./app/kafka/notificationsCondumer";

async function server() {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(envVariable.MONGO_URI as string);
    logger.info("🛢 Database connected");

    // 2️⃣ Initialize Kafka producer
    await initProducer();

    // 3️⃣ Start Kafka consumers
    await startPaymentConsumer();
    await startNotificationConsumer();

    // 4️⃣ Start Express app
    app.listen(envVariable.PORT, () => {
      logger.info(`🚀 Hotel booking app listening on port ${envVariable.PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to connect to database or Kafka", error);
    process.exit(1);
  }
}

server();
