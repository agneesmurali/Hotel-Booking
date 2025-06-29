import mongoose from "mongoose";
const connectDB=async()=>{
    try{
        mongoose.connection.on('connected',()=>console.log("Database Connected"));
        await mongoose.connect(`${process.env.MONGOBD_URI}/HOTEL BOOKING`)
    } catch(error){
            console.log(error.message);
    }
}
export default connectDB;