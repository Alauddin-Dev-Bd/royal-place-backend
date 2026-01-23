import mongoose from "mongoose";

import { differenceInDays } from "date-fns";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { BookingStatus, IBooking } from "../interfaces/booking.interfcae";
import { AppError } from "../error/appError";
import { PaymentStatus } from "../interfaces/payment.interfaces";
import PaymentModel from "../mongoSchema/payment.schema";
import BookingModel from "../mongoSchema/booking.schema";
import { envVariable } from "../config";
import RoomModel from "../mongoSchema/room.schema";


dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface RoomBooking {
  roomId: string;
  price: number;
  checkInDate: string;
  checkOutDate: string;
}

const calculateTotalAmount = (rooms: RoomBooking[]): number => {
  let totalAmount = 0;

  rooms.forEach((room) => {
    const nights = differenceInDays(
      new Date(room.checkOutDate),
      new Date(room.checkInDate),
    );

    if (nights <= 0) {
      throw new Error(
        `Invalid check-in/check-out dates for room ${room.roomId}`,
      );
    }

    if (typeof room.price !== "number") {
      throw new Error(`Invalid price for room ${room.roomId}`);
    }

    totalAmount += room.price * nights;
  });

  return totalAmount;
};

// ===================================== Generate TranId ==========================================
function generateTransactionId() {
  return "TXN" + Date.now() + Math.floor(Math.random() * 1000);
}

// Utility: get all dates between two dates inclusive
function getDateRangeArray(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let currDate = dayjs(startDate);
  const lastDate = dayjs(endDate);
  while (currDate.isSameOrBefore(lastDate)) {
    dates.push(currDate.format("YYYY-MM-DD"));
    currDate = currDate.add(1, "day");
  }
  return dates;
}

// ========================================== Booking Initialization ==================================
// const bookingInitialization = async (bookingData: IBooking) => {
//   const { userId, rooms, name, email, city, address, phone } = bookingData;

//   const roomIds = rooms.map((r) => r.roomId);

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 1. Check Availability: Rooms overlapping with requested dates
//     const existingBookings = await BookingModel.find({
//       "rooms.roomId": { $in: roomIds },
//       $or: rooms.map((r) => ({
//         $or: [
//           {
//             "rooms.checkInDate": {
//               $lt: new Date(r.checkOutDate),
//               $gte: new Date(r.checkInDate),
//             },
//           },
//           {
//             "rooms.checkOutDate": {
//               $gt: new Date(r.checkInDate),
//               $lte: new Date(r.checkOutDate),
//             },
//           },
//           {
//             "rooms.checkInDate": { $lte: new Date(r.checkInDate) },
//             "rooms.checkOutDate": { $gte: new Date(r.checkOutDate) },
//           },
//         ],
//       })),
//       bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.Pending] }, // check both booked & pending
//     }).session(session);

//     if (existingBookings.length > 0) {
//       throw new AppError(
//         "One or more rooms are already booked in this period",
//         409
//       );
//     }

//     // 2. Room Detail Validation
//     const roomDetails = await RoomModel.find({ _id: { $in: roomIds } }).session(
//       session
//     );
//     if (roomDetails.length !== roomIds.length) {
//       throw new AppError("Some rooms not found", 404);
//     }

//     // 3. Calculate Total Amount (based on nights)
//     let totalAmount = 0;
//     for (const room of rooms) {
//       const nights = differenceInDays(
//         new Date(room.checkOutDate),
//         new Date(room.checkInDate)
//       );
//       if (nights <= 0) {
//         throw new AppError(
//           `Invalid check-in/check-out dates for room ${room.roomId}`,
//           400
//         );
//       }
//       if (typeof room.price !== "number") {
//         throw new AppError(`Invalid price for room ${room.roomId}`, 400);
//       }
//       totalAmount += room.price * nights;
//     }

//     // 4. Generate Transaction ID
//     const transactionId = generateTransactionId();

//     // 5. Save Booking
//     const [createdBooking] = await BookingModel.create(
//       [
//         {
//           userId,
//           rooms: rooms.map((r) => ({
//             roomId: r.roomId,
//             checkInDate: r.checkInDate,
//             checkOutDate: r.checkOutDate,
//           })),
//           totalAmount,
//           bookingStatus: BookingStatus.Pending,
//           name,
//           email,
//           address,
//           city,
//           phone,
//           transactionId,
//         },
//       ],
//       { session }
//     );

//     // 6. Initiate Payment
//     const paymentResult = await initiatePayment({
//       amount: createdBooking.totalAmount,
//       transactionId: createdBooking.transactionId as string,
//       name,
//       email,
//       phone,
//       address,
//       city,
//     });

//     if (!paymentResult?.payment_url) {
//       throw new AppError("Payment initiation failed", 500);
//     }

//     // 7. Save Payment
//     const paymentData = {
//       userId,
//       bookingId: createdBooking._id,
//       amount: createdBooking.totalAmount,
//       paymentMethod: "aamarpay",
//       status: PaymentStatus.Pending,
//       transactionId: createdBooking.transactionId,
//     };

//     await PaymentModel.create([paymentData], { session });

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       payment_url: paymentResult.payment_url,
//       transactionId,
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

// ======================================= Get Booked Dates For Room =================================
const getBookedDatesForRoomByRoomId = async (roomId: string) => {
  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    throw new AppError("Invalid or missing Room ID", 400);
  }

  const today = dayjs().startOf("day");

  const bookings = await BookingModel.find({
    bookingStatus: { $in: [BookingStatus.Confirmed, BookingStatus.Pending] },
    "rooms.roomId": new mongoose.Types.ObjectId(roomId),
  }).select("rooms -_id");

  const detailBookedDates: { checkInDate: string; checkOutDate: string }[] = [];
  const bookedDatesSet = new Set<string>();

  for (const booking of bookings) {
    for (const room of booking.rooms) {
      if (
        room.roomId.toString() === roomId &&
        dayjs(room.checkOutDate).isSameOrAfter(today)
      ) {
        detailBookedDates.push({
          checkInDate: dayjs(room.checkInDate).format("YYYY-MM-DD"),
          checkOutDate: dayjs(room.checkOutDate).format("YYYY-MM-DD"),
        });

        const datesInRange = getDateRangeArray(
          dayjs(room.checkInDate).format("YYYY-MM-DD"),
          dayjs(room.checkOutDate).format("YYYY-MM-DD"),
        );
        datesInRange.forEach((date) => bookedDatesSet.add(date));
      }
    }
  }

  return {
    detailBookedDates,
    bookedDates: Array.from(bookedDatesSet).sort(),
  };
};

// ======================================= Get Booked rooms By User ID =================================
const getBookedRoomsByUserId = async (userId: string) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid or missing User ID", 400);
  }

  const bookings = await BookingModel.find({ userId })
    .populate("rooms.roomId")
    .sort({ createdAt: -1 });

  return bookings;
};

// const getBookedRoomsByUserId = async (userId: string) => {
//   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//     throw new AppError("Invalid or missing User ID", 400);
//   }

//   // Find bookings and populate rooms.roomId
//   const bookings = await BookingModel.find({ userId })
//     .populate("rooms.roomId")
//     .sort({ createdAt: -1 });

//   if (!bookings.length) {
//     return {
//       guestName: null,
//       detailBookedDates: [],
//     };
//   }

//   const guestName = bookings[0].name;

//   const detailBookedDates: {
//     _id: string;
//     title: string;
//     amount: number;
//     nights: number;
//     checkInDate: string;
//     checkOutDate: string;
//     bookingStatus: string;
//   }[] = [];

//   for (const booking of bookings) {
//     for (const room of booking.rooms) {
//       if (room.checkInDate && room.checkOutDate) {
//         const roomId = room.roomId;
//         const title = isRoomPopulated(roomId)
//           ? roomId.title
//           : "Untitled Room";

//         detailBookedDates.push({
//           _id: booking._id.toString(),
//           title,
//           nights: dayjs(room.checkOutDate).diff(dayjs(room.checkInDate), "day"),
//           amount: booking.totalAmount,
//           checkInDate: dayjs(room.checkInDate).format("YYYY-MM-DD"),
//           checkOutDate: dayjs(room.checkOutDate).format("YYYY-MM-DD"),
//           bookingStatus: booking.bookingStatus,
//         });

//       }
//     }
//   }

//   return {
//     guestName,
//     detailBookedDates,
//   };
// };

// ======================================= Filter Bookings ============================================
const filterBookings = async (queryParams: any) => {
  const {
    searchTerm,

    status,
    page = 1,
    limit = 10,
  } = queryParams;

  const skip = (Number(page) - 1) * Number(limit);

  const filters: any = {};

  if (status) {
    const statusArr = status.split(",").map((s: string) => s.trim());
    filters.bookingStatus = { $in: statusArr };
  }

  // We don't have 'checkOutDate' at root in schema, it is inside rooms array, so this filter might not work directly.
  // You may want to filter bookings by date range inside rooms — that requires more complex aggregation.
  // Here just a basic filter on bookingStatus and skip/limit.

  if (searchTerm) {
    filters.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const data = await BookingModel.find(filters)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 })
    .populate("rooms.roomId")
    .populate("userId");

  const total = await BookingModel.countDocuments(filters);

  return {
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
    data,
  };
};

// ========================================= Cancel Booking ============================================
const cancelBookingService = async (bookingId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await BookingModel.findOne({ _id: bookingId }).session(
      session,
    );

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return {
        success: false,
        statusCode: 404,
        message: "Booking not found",
      };
    }

    if (booking.bookingStatus !== BookingStatus.Confirmed) {
      await session.abortTransaction();
      session.endSession();
      return {
        success: false,
        statusCode: 400,
        message: `Booking status is '${booking.bookingStatus}', so cannot cancel.`,
      };
    }

    // Cancel Booking
    booking.bookingStatus = BookingStatus.Cancelled;
    await booking.save({ session });

    // Update Payment status to "cancelled"
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: booking.transactionId },
      { status: "claimRefund" },
      { new: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      booking,
      payment,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const bookingInitialization = async (bookingData: IBooking) => {
  const { userId, rooms, name, email, city, address, phone, postcode } =
    bookingData;

  // 1️⃣ Prepare rooms
  const roomsForCalculation: RoomBooking[] = rooms.map((room) => ({
    roomId: room.roomId.toString(),
    price: room.price,
    checkInDate: new Date(room.checkInDate).toISOString().split("T")[0],
    checkOutDate: new Date(room.checkOutDate).toISOString().split("T")[0],
  }));

  // 2️⃣ Check availability for each room
  const conflictedRooms: string[] = [];

  for (const room of roomsForCalculation) {
    const overlappingBooking = await BookingModel.findOne({
      "rooms.roomId": room.roomId,
      $or: [
        {
          "rooms.checkInDate": { $lte: room.checkOutDate },
          "rooms.checkOutDate": { $gte: room.checkInDate },
        },
      ],
      bookingStatus: { $in: [BookingStatus.Confirmed] },
    });

    if (overlappingBooking) {
      // 🔹 fetch room title
      const roomData = await RoomModel.findById(room.roomId);
      conflictedRooms.push(roomData?.title || room.roomId);
    }
  }

  if (conflictedRooms.length > 0) {
    throw new AppError(
      `The following rooms are already booked for the selected dates: ${conflictedRooms.join(
        ", ",
      )}`,
      400,
    );
  }

  // 3️⃣ Calculate total amount
  const totalAmount = calculateTotalAmount(roomsForCalculation);

  // 4️⃣ Generate Transaction ID
  const transactionId = "TXN" + Date.now() + Math.floor(Math.random() * 1000);

  // 5️⃣ Save Booking in DB as Pending
  const booking = await BookingModel.create({
    userId,
    rooms,
    totalAmount,
    transactionId,
    bookingStatus: BookingStatus.Pending,
    name,
    email,
    city,
    address,
    phone,
    postcode,
  });


  return { bookingId: booking._id, transactionId };
};

// ======================== Export Services =============================
export const bookingServices = {
  bookingInitialization,
  getBookedDatesForRoomByRoomId,
  cancelBookingService,
  filterBookings,
  getBookedRoomsByUserId,
};
