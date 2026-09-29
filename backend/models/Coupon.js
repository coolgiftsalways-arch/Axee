import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    minOrderAmount: {
      type: Number,
      default: 3000,
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    firstOrderOnly: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.pre("validate", function normalizeCoupon(next) {
  if (this.code) {
    this.code = String(this.code).trim().toUpperCase();
  }

  if (this.discountType === "percentage" && Number(this.discountValue) > 100) {
    this.invalidate(
      "discountValue",
      "Percentage discount cannot be more than 100%.",
    );
  }

  next();
});

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default Coupon;
