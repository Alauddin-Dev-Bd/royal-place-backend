import sanitize from "mongo-sanitize";
import dotenv from "dotenv";
import SSLCommerzPayment from "sslcommerz-lts";

import PaymentModel from "../mongoSchema/payment.schema";
import BookingModel from "../mongoSchema/booking.schema";
import { AppError } from "../error/appError";
import { PaymentStatus } from "../interfaces/payment.interfaces";

dotenv.config();
const store_id = process.env.SSL_STORE_ID;
const store_passwd = process.env.SSL_STORE_PASS;
const is_live = false; //true for live, false for sandbox

// ====================================================
// 🔹 Init Payment (SSLCommerz)
// ====================================================
const calculateNights = (checkIn: string, checkOut: string): number => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return Math.max(1, Math.round(diffDays));
};

const paymentInit = async (bookingId: string, userId: string) => {
  // 🛡 Sanitize input
  bookingId = sanitize(bookingId);
  userId = sanitize(userId);

  // 🔍 Find booking
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  const room = booking.rooms[0];

  const nights = calculateNights(room.checkInDate as any, room.checkOutDate as any);

  // ❌ Prevent duplicate PAID payment (CORRECT PLACE)
  const paidPayment = await PaymentModel.findOne({
    bookingId: booking._id,
    status: "PAID",
  });

  if (paidPayment) {
    throw new AppError("Payment already completed", 400);
  }

  // 🧾 SSLCommerz Payload
  const paymentData = {
    // 💰 Transaction
    total_amount: booking.totalAmount,
    currency: "BDT",
    tran_id: booking.transactionId,

    // 🔁 Redirect URLs
    success_url: `${process.env.BASE_URL}/api/v1/payments/success?tran_id=${booking.transactionId}`,
    fail_url: `${process.env.BASE_URL}/api/v1/payments/fail`,
    cancel_url: `${process.env.BASE_URL}/api/v1/payments/cancel`,
    ipn_url: `${process.env.BASE_URL}/api/v1/payments/ipn`,

    // 📦 Product
    // product_name: "Hotel Room Booking",
    product_category: "Hotel",
    product_profile: "travel-vertical",

    // // 🏨 Travel Vertical (Required)
    hotel_name: "Royal Palace",
    length_of_stay: `${nights} nights`,
    check_in_time: "12:00 PM",
    hotel_city: booking.city,
    // 👤 Customer
    cus_name: booking.name,
    cus_email: booking.email,
    cus_phone: booking.phone,
    cus_city: booking.city,
    cus_country: "Bangladesh",

    // 🚚 Shipping
    shipping_method: "NO",

    // 🧩 Reference values
    value_a: booking._id.toString(),
    value_b: userId.toString(),
  };

  // 🔐 SSLCommerz Init
  const sslcz = new SSLCommerzPayment(store_id!, store_passwd!, false);
  console.log({
    is_live,
    store_id,
  });
  // console.log(sslcz)

  const response = await sslcz.init(paymentData);
  console.log(response);

  if (!response?.GatewayPageURL) {
    throw new AppError("SSLCommerz initialization failed", 500);
  }

  // 🧾 Create / Update payment record (idempotent)
  await PaymentModel.findOneAndUpdate(
    { transactionId: booking.transactionId },
    {
      bookingId: booking._id,
      userId,
      amount: booking.totalAmount,
      status: PaymentStatus.PENDING,
    },
    { upsert: true, new: true },
  );

  // 🚀 Return gateway URL
  return {
    transactionId: booking.transactionId,
    paymentUrl: response.GatewayPageURL,
  };
};

// ====================================================
// 🔹 IPN Handler (FINAL AUTHORITY)
// ====================================================
const handleIPN = async (ipnData: any) => {
  const tranId = sanitize(ipnData.tran_id);
  const status = ipnData.status;

  if (!tranId) {
    throw new AppError("Invalid IPN payload", 400);
  }

  if (status === "VALID") {
    await BookingModel.findOneAndUpdate(
      { transactionId: tranId },
      { paymentStatus: "PAID" },
    );

    await PaymentModel.findOneAndUpdate(
      { transactionId: tranId },
      {
        status: "SUCCESS",
        ipnData,
      },
    );
  }

  if (status === "FAILED") {
    await BookingModel.findOneAndUpdate(
      { transactionId: tranId },
      { paymentStatus: "FAILED" },
    );

    await PaymentModel.findOneAndUpdate(
      { transactionId: tranId },
      {
        status: "FAILED",
        ipnData,
      },
    );
  }

  return true;
};

// ====================================================
// 🔹 Get Payments (Admin)
// ====================================================
const getPayments = async (options: any) => {
  const query: any = {};

  if (options?.status) {
    query.status = sanitize(options.status);
  }

  if (options?.userId) {
    query.userId = sanitize(options.userId);
  }

  const payments = await PaymentModel.find(query)
    .populate("bookingId")
    .sort({ createdAt: -1 });

  return payments;
};

// ====================================================
// 🔹 Get Payments by User
// ====================================================
const getPaymentsByUserId = async (userId: string) => {
  userId = sanitize(userId);

  const payments = await PaymentModel.find({ userId })
    .populate("bookingId")
    .sort({ createdAt: -1 });

  return payments;
};

// ====================================================
// 🔹 Export Service
// ====================================================
export const paymentServices = {
  paymentInit,
  handleIPN,
  getPayments,
  getPaymentsByUserId,
};
