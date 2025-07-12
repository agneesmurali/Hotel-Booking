import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import transporter from "../configs/nodemailer.js";
import stripe from "stripe";

// Function to Check if a Room is Available
const checkAvailability = async ({checkInDate,checkOutDate,room}) => {
    try{
        const bookings = await Booking.find({
            room,
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate },
        });
        const isAvailable=bookings.length === 0;
        return isAvailable;
    }catch(error){
       console.error(error.message);
    }

}

//API to check room availability
//POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
    try{
        const { checkInDate, checkOutDate, room } = req.body;
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        res.json({ success: true, isAvailable });
    }catch(error){
        res.json({ success: false, message: error.message });
    }
}
//API to create a booking
//POST /api/bookings/create 

export const createBooking = async (req, res) => {
    try{
        const { room, checkInDate, checkOutDate,  guests } = req.body;
        const user=req.user._id;
        //Before Booking Check Availability
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        
        if(!isAvailable) {
            return res.json({ success: false, message: "Room is not available for the selected dates" });
        }

       // Calculate total price based on room price and number of nights
        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;
        // Calculate number of nights
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff=checkOut.getTime() - checkIn.getTime();
        const nights= Math.ceil(timeDiff / (1000 * 3600 * 24));
        totalPrice *= nights;
        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            checkInDate,
            checkOutDate,
            totalPrice,
            guests:+guests,
        });
        const mailOptions={
            from:process.env.SENDER_EMAIL,
            to:req.user.email,
            subject:'Hotel Booking Details',
            html:`
            <h2>Your Booking Details </h2>
            <p>Dear ${req.user.username},</p>
            <p>Thank You For Your Booking!Here are your Details:</p>
            <ul>
                <li><strong>Booking ID:</strong>${booking._id}</li>
                <li><strong>Hotel Name:</strong>${roomData.hotel.name}</li>
                <li><strong>Location:</strong>${roomData.hotel.address}</li>
                <li><strong>Date:</strong>${booking.checkInDate.toDateString()}</li>
                <li><strong>Booking Amount:</strong>${process.env.CURRENCY || '₹'}${booking.totalPrice}/night</li>
            </ul>
            <p>We Look Forward to Welcoming you!</p>
            <p>If you need to make any changes,feel free to contact us.</p>
            `
        }
        await transporter.sendMail(mailOptions)

        res.json({ success: true, message: "Booking created successfully", booking });
    }catch(error){
        console.log(error);
        res.json({ success: false, message: "Failed to Create Booking" });
    }
};
//API to get all bookings of a user
//GET /api/bookings/user-bookings
export const getUserBookings = async (req, res) => {
    try{
        const user = req.user._id;
        const bookings = await Booking.find({ user })
            .populate("room hotel")
            .sort({ createdAt: -1 });
        
        res.json({ success: true, bookings });
    }catch(error){

        res.json({ success: false, message: "Failed to fetch bookings" });
    }
};

export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });

    if (!hotel) {
      return res.json({ success: false, message: "Hotel not found" });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    // ✅ Now include bookings in the response
    res.json({
      success: true,
      dashboardData: {
        bookings,        // <- this was missing
        totalBookings,
        totalRevenue
      }
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch booking" });
  }
};
export const stripePayment=async(req,res)=>{
    try{
        const {bookingId}=req.body;
        const booking=await Booking.findById(bookingId);
        const roomData=await Room.findById(booking.room).populate('hotel');
        const totalPrice=booking.totalPrice;
        const {origin}=req.headers;
        const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY);
        const line_items=[
            {
                price_data:{
                    currency:"inr",
                    product_data:{
                        name:roomData.hotel.name,
                    },
                    unit_amount:totalPrice*100
                },
                quantity:1,
            }
        ]
        //Create Checkout Session
        const session=await stripeInstance.checkout.sessions.create({
            line_items,
            mode:"payment",
            success_url:`${origin}/loader/my-booking` ,
            cancel_url: `${origin}/my-booking`,
            metadata:{
                bookingId,
            }
        })
        res.json({success:true,url:session.url})

    }catch (error){
        res.json({success:false,message:"Payment Failed"})

    }
}
