export const parseKafkaMessage = <T>(value?: Buffer): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value.toString()) as T;
  } catch (error) {
    console.error("❌ Kafka message parse failed", error);
    return null;
  }
};
