import { sql } from "../config/db.js";

export async function getTransactionbyUserId(req,res) {
    try {
        const { userId } = req.params;
        const transactions = await sql`
                SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
            `;
        res.status(200).json(transactions);


    } catch (err) {
        console.log("Error fetching transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function createTransaction(req, res) {

    try {
        const { title, amount, category, user_id } = req.body;
        if (!title || amount === undefined || !category || !user_id) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const transaction = await sql`
            INSERT INTO transactions (title, amount, category, user_id) 
            VALUES (${title}, ${amount}, ${category}, ${user_id})
            RETURNING *
        `;
        console.log("Transaction created:", transaction);
        res.status(201).json(transaction[0]);

    }
    catch (err) {
        console.log("Error creating the transaction:", err)
        res.status(500).json({ message: "Internal server error" });

    }

}

export async function deleteTransaction(req, res){
    try {
        const { id } = req.params;

        //both 55 and dda are string type but dda crashed when goes into SQL query , therefore
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }
        const result = await sql`
            DELETE FROM transactions where id = ${id} returning *
        `
        if (result.length === 0) {
            return res.status(404).json({ message: "transaction not found" })
        }

        res.status(200).json({ message: "transaction deleted successfully" })


    } catch (err) {
        console.log("Error deleting the transaction:", err)
        res.status(500).json({ message: "Internal server error" });

    }
}

export async function getSummaryByUserId (req, res) {
    try {
        const { userID } = req.params
        const balanceResult = await sql `
            SELECT coalesce(sum(amount),0) as balance from transactions where user_id = ${userID}
        `
        const incomeResult = await sql`
            select coalesce(SUM(amount),0) as income from transactions 
            where user_id = ${userID} and amount>0
        `
        const expenseResult = await sql`
            select coalesce(SUM(amount),0) as expense from transactions 
            where user_id = ${userID} and amount<0
        `

        res.status(200).json({
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expense: expenseResult[0].expense,

        })


    } catch (error) {
        console.log("Error getting the summary:", error)
        res.status(500).json({ message: "Internal server error" });
    }
}