import mongoose,{Schema} from "mongoose";

const CartSchema=new Schema({
     user:{
        type:mongoose.Types.ObjectId,
        ref:"User"
     },
     items:[
        {
            itemType: {
                type: String,
                enum: ["catalog", "ai_generated"],
                required: true,
                default: "catalog"
            },
            product:{
                type:mongoose.Types.ObjectId,
                ref:"Product"
            },
            design:{
                type:mongoose.Types.ObjectId,
                ref:"Design"
            },
            quantity:{
                type:Number,
                default:1
            },
            selectedOptions: {
                highResolutionExport: { type: Boolean, default: false },
                customPlacement: { type: Boolean, default: false },
                backgroundRemoval: { type: Boolean, default: false }
            },
            generatedImageSnapshot: {
                type: String,
                default: "",
            },
            priceSnapshot: {
                unitPrice: { type: Number, default: 0 },
                finalPrice: { type: Number, default: 0 },
                currency: { type: String, default: "INR" }
            }
        }
     ]

},{timestamps:true})
export const Cart = mongoose.model("Cart",CartSchema)
