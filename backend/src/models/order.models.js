
import mongoose, {Schema} from "mongoose";
const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,ref:'User',
        required:true
    },
     items:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,ref:'Product',
            required:true
        },
        name:{
            type:String,
            required:true},
        price:{
            type:Number,
            required:true
        },
        quantity:{
            type:Number,
            required:true,
            default:1
        }
    }],
    address:{
        fullAddress:{type:String,required:true},
        city:{type:String,required:true},
        state:{type:String,required:true},  
    },
    pricing:{
        itemsTotal:{type:Number,required:true},
        tax:{type:Number,required:true},
        shippingCharges:{type:Number,required:true},
        discount:{type:Number,required:true},
        totalAmount:{type:Number,required:true},
    },
    status:{
        type:String,
        enum:["Created","PAID","Processing","Shipped","Delivered","Cancelled","Failed"],
        default:"Created"
    }
},{timestamps:true});
export const Order=mongoose.model("Order",orderSchema);