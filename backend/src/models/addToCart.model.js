import mongoose,{Schema} from "mongoose";

const CartSchema=new Schema({
     user:{
        type:mongoose.Types.ObjectId,
        ref:"User"
     },
     items:[
        {
            product:{
                type:mongoose.Types.ObjectId,
                ref:"Product"
            },
            quantity:{
                type:Number,
                default:1
            }
        }
     ]

},{timestamps:true})
export const Cart = mongoose.model("Cart",CartSchema)
