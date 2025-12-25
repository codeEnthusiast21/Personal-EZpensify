import express from 'express';
import { getTransactionbyUserId, createTransaction, deleteTransaction, getSummaryByUserId } from '../controllers/transactionControllers.js';

const router = express.Router();

router.get("/summary/:userID", getSummaryByUserId);

router.get("/:userId", getTransactionbyUserId);

router.post("/", createTransaction);  // POST must be here

router.delete("/:id", deleteTransaction);

export default router;