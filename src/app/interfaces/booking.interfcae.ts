import { Types } from "mongoose";

export enum BookingStatus {
  Pending   = "PENDING",    // booking created, payment not done
  Confirmed = "CONFIRMED",  // payment success
  Cancelled = "CANCELLED",  // user/admin cancelled
  Expired   = "EXPIRED",    // payment timeout
}


export interface IBookingRooms {
  roomId: Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  price: number;
}

export interface IBooking {
  _id: string;
  userId: Types.ObjectId;
  rooms: IBookingRooms[];
  totalAmount: number;

  postcode: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  bookingStatus: BookingStatus;
  transactionId?: string;
  refundable: boolean; // <-- refundable flag
  refundPercentage: number; // <-- how much to refund if canceled
}