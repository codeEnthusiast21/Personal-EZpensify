import express from "express";
import dotenv from "dotenv";
import { initDb } from "./config/db.js";
import ratelimiter from "./middleware/rateLimiter.js";
import job from "./config/cron.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();
const app = express();
if(process.env.NODE_ENV !== "test") job.start();


app.use(ratelimiter);
app.use(express.json());
const PORT = process.env.PORT;


//not using prisma but writing raw sql queries
//mongodb vs postgres 




app.use("/api/transactions", transactionRoutes);
app.get("/", (req, res) => {
    res.send("EZpensify Backend is running");
})

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}); 