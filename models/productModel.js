const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
    },
    category: {
      type: String,
    },
    stock: {
      type: Number,
      required: [true, "Please add a stock"],
    },
    // images: [
    //   {
    //     url: {
    //       type: String,
    //       required: true,
    //     },
    //     alt: {
    //       type: String,
    //       default: ''
    //     }
    //   }
    // ],
    thumbnail: {
      type: String,
      dafault: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
