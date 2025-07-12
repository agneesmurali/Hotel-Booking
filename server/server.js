import express from "express"
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import hotelRouter from "./routes/hotelRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/BookingRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
connectDB()
connectCloudinary();

const app=express()

app.use(cors()) //Enable Cross-Origin Resource Sharing
//API TO LISTEN TO STRIPE
app.post('/api/stripe',express.raw({type:"application/json"}),stripeWebhooks);




//Middleware
app.use(express.json())
app.use(clerkMiddleware())


//API TO LISTEN TO CLERK WEBHOOKS
app.use("/api/clerk",clerkWebhooks); 


app.get('/',(req,res)=>res.send("API is working"))
app.use ('/api/user',userRouter)
app.use ('/api/hotel',hotelRouter)
app.use ('/api/rooms',roomRouter)
app.use ('/api/bookings',bookingRouter)

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));


