import express from 'express';
import { getTransactionbyUserId, createTransaction, deleteTransaction, getSummaryByUserId, getSettlementPlan, createGroupExpense, requestSettlement, getPendingSettlements, confirmSettlement, rejectSettlement, getSentSettlements } from '../controllers/transactionControllers.js';

const router = express.Router();

router.get("/transactions/summary/:userID", getSummaryByUserId);

router.get("/transactions/:userId", getTransactionbyUserId);

router.post("/transactions/", createTransaction);

router.delete("/transactions/:id", deleteTransaction);

router.get("/groups/:groupId/settlements", getSettlementPlan);

router.post("/groups/:groupId/expenses", createGroupExpense);

router.post("/groups/:groupId/settlements/request", requestSettlement);

router.get("/settlements/pending/:userId", getPendingSettlements);

router.post("/settlements/:settlementId/confirm", confirmSettlement);

router.post("/settlements/:settlementId/reject", rejectSettlement);

router.get("/settlements/sent/:userId", getSentSettlements);




export default router;