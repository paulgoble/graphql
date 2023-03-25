const mongoose = require("mongoose")
const startServer = require("./server")

mongoose.set("strictQuery", false)

require("dotenv").config()

const MONGODB_URI = process.env.MONGODB_URI

if (process.env.NODE_ENV === "development") {
  console.log("connecting to", MONGODB_URI)
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB")
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message)
  })

startServer(process.env.PORT)
