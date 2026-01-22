import { createConsumer } from "../kafka/kafkaConsumer";

interface BookingCreatedEvent {
  event: "BOOKING_CREATED";
  bookingId: string;
  userId: string;
  transactionId: string;
  totalAmount: number;
}

export const startNotificationConsumer = async () => {
  await createConsumer<BookingCreatedEvent>(
    "notification-service-group",
    "booking-events",
    async (data) => {
      if (data.event !== "BOOKING_CREATED") return;

      console.log(
        `📧 Notify user ${data.userId} about booking ${data.bookingId} (TXN: ${data.transactionId})`
      );

      // 🔔 Future:
      // await sendEmail(...)
      // await sendSMS(...)
      // await pushNotification(...)
    }
  );
};
