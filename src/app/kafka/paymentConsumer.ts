
import PaymentModel from "../mongoSchema/payment.schema";
import { PaymentStatus } from "../interfaces/payment.interfaces";
import { KAFKA_TOPICS } from "../kafka/topics";
import { createConsumer } from "./kafkaConsumer";

export const startPaymentConsumer = async () => {
 await createConsumer<{
  event: string;
  bookingId: string;
  userId: string;
  totalAmount: number;
  transactionId: string;
}>(
  "payment-service-group",
  "booking-events",
  async (data) => {
    if (data.event !== "BOOKING_CREATED") return;

    await PaymentModel.findOneAndUpdate(
      { transactionId: data.transactionId },
      {
        bookingId: data.bookingId,
        userId: data.userId,
        amount: data.totalAmount,
        status: PaymentStatus.PENDING,
      },
      { upsert: true }
    );
  }
);

};
