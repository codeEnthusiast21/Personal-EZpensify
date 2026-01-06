import { sql } from "../config/db.js";

export async function getTransactionbyUserId(req, res) {
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

// for personal expense management

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

export async function deleteTransaction(req, res) {
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

export async function getSummaryByUserId(req, res) {
    try {
        const { userID } = req.params
        const balanceResult = await sql`
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


// for group expenses
export async function getGroupBalances(req, res) {
  try {
    const { groupId } = req.params;
    const balances = await fetchGroupBalances(groupId);
    res.status(200).json(balances);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function getUserGroupBalance(req, res) {
    try {
        const { groupId, userId } = req.params;
        if (isNaN(parseInt(groupId))) {
            return res.status(400).json({ message: "Invalid group ID " });
        }
        const groupBalance = await sql`
                SELECT
                COALESCE(p.total_paid, 0) -
                COALESCE(s.total_share, 0) AS net_balance
                FROM
                (
                    SELECT SUM(amount) AS total_paid
                    FROM group_expenses
                    WHERE group_id = ${groupId} AND paid_by = ${userId}
                ) p
                FULL OUTER JOIN
                (
                    SELECT SUM(es.share_amount) AS total_share
                    FROM expense_splits es
                    JOIN group_expenses ge ON es.expense_id = ge.id
                    WHERE ge.group_id = ${groupId} AND es.user_id = ${userId}
                ) s
                ON TRUE;
        `
        res.status(200).json(groupBalance[0]);

    } catch (error) {
        console.log("Error getting Usergroup balances:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getTotalPaidByUser(req, res) {

    try {
        const { groupId, userId } = req.params;
        const balances = await sql`
    SELECT
  COALESCE(SUM(amount), 0) AS total_paid
FROM group_expenses
WHERE group_id = ${groupId}
  AND paid_by = ${userId};
    `
        res.status(200).json(balances[0]);

    } catch (error) {
        console.log("Error getting total paid by user because:", error);
        res.status(500).json({ message: "Internal server error" });

    }

}

export async function getTotalShareOfUser(req, res) {

    try {
        const { groupId, userId } = req.params;
        const result = await sql`
          SELECT
            COALESCE(SUM(es.share_amount), 0) AS total_share
          FROM expense_splits es
          JOIN group_expenses ge
            ON es.expense_id = ge.id
          WHERE ge.group_id = ${groupId}
          AND es.user_id = ${userId};
`
        res.status(200).json(result[0]);

    } catch (error) {
        console.log("Error getting total share of user because:", error);
        res.status(500).json({ message: "Internal server error" });


    }

}

export async function getGroupExpenseBreakdown(req, res) {

    try {
        const { groupId } = req.params;
        const result = await sql`
          SELECT
            ge.id AS expense_id,
            ge.title,
            ge.amount,
            ge.paid_by,
            es.user_id,
            es.share_amount
          FROM group_expenses ge
          JOIN expense_splits es
            ON ge.id = es.expense_id
          WHERE ge.group_id = ${groupId}
          ORDER BY ge.created_at DESC;
          `
        res.status(200).json(result);

    } catch (error) {
        console.log("Error getting group expense breakdown because:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}

export async function getSettlementCandidates(req, res) {
    try {
        const { groupId } = req.params;
        const result = await sql`
          SELECT
            user_id,
            net_balance
            FROM (
              SELECT
                COALESCE(p.user_id, s.user_id) AS user_id,
                COALESCE(p.total_paid, 0) -
                COALESCE(s.total_share, 0) AS net_balance
              FROM
                (
                  SELECT paid_by AS user_id, SUM(amount) AS total_paid
                  FROM group_expenses
                  WHERE group_id = ${groupId}
                  GROUP BY paid_by
                ) p
            FULL OUTER JOIN
              (
                SELECT es.user_id, SUM(es.share_amount) AS total_share
                FROM expense_splits es
                JOIN group_expenses ge ON es.expense_id = ge.id
                WHERE ge.group_id = ${groupId}
                GROUP BY es.user_id
              ) s
            ON p.user_id = s.user_id
            ) balances
          WHERE net_balance != 0
          ORDER BY net_balance DESC;
        `
        return res.status(200).json(result);

    } catch (error) {
        console.log("Error getting who has to pay to whom becuz:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}

export function calculateSettlementPlan(balances) {
  /*
    balances format:
    [
      { user_id: "A", net_balance: 1200 },
      { user_id: "B", net_balance: -500 },
      { user_id: "C", net_balance: -700 }
    ]
  */

  const creditors = [];
  const debtors = [];

  // Separate creditors and debtors
  for (const entry of balances) {
    const balance = Number(entry.net_balance);

    if (balance > 0) {
      creditors.push({
        userId: entry.user_id,
        amount: balance,
      });
    } else if (balance < 0) {
      debtors.push({
        userId: entry.user_id,
        amount: Math.abs(balance),
      });
    }
  }

  const settlements = [];
  let i = 0;
  let j = 0;

  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const payAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: payAmount,
    });

    debtor.amount -= payAmount;
    creditor.amount -= payAmount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}

export async function getSettlementPlan(req, res) {
  try {
    const { groupId } = req.params;

    const balances = await fetchGroupBalances(groupId);
    const settlementPlan = calculateSettlementPlan(balances);

    res.status(200).json(settlementPlan);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}



async function fetchGroupBalances(groupId) {
  return await sql`
    SELECT
      COALESCE(p.user_id, s.user_id) AS user_id,
      COALESCE(p.total_paid, 0) -
      COALESCE(s.total_share, 0) AS net_balance
    FROM
      (
        SELECT paid_by AS user_id, SUM(amount) AS total_paid
        FROM group_expenses
        WHERE group_id = ${groupId}
        GROUP BY paid_by
      ) p
    FULL OUTER JOIN
      (
        SELECT es.user_id, SUM(es.share_amount) AS total_share
        FROM expense_splits es
        JOIN group_expenses ge ON es.expense_id = ge.id
        WHERE ge.group_id = ${groupId}
        GROUP BY es.user_id
      ) s
    ON p.user_id = s.user_id;
  `;
}

export async function createGroupExpense(req, res) {
  const { groupId } = req.params;
  const { title, amount, paidBy, splits } = req.body;

  if (isNaN(parseInt(groupId))) {
    return res.status(400).json({ message: "Invalid group ID" });
  }

  if (!title || !amount || !paidBy || !Array.isArray(splits)) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  const totalSplit = splits.reduce((sum, s) => sum + Number(s.amount), 0);
  if (totalSplit !== Number(amount)) {
    return res.status(400).json({ message: "Split amounts do not match total amount" });
  }

  try {
    await sql`BEGIN`;

    const expenseResult = await sql`
      INSERT INTO group_expenses (group_id, title, amount, paid_by, created_by)
      VALUES (${groupId}, ${title}, ${amount}, ${paidBy}, ${paidBy})
      RETURNING id;
    `;

    const expenseId = expenseResult[0].id;

    for (const split of splits) {
      await sql`
        INSERT INTO expense_splits (expense_id, user_id, share_amount)
        VALUES (${expenseId}, ${split.userId}, ${split.amount});
      `;
    }

    await sql`COMMIT`;

    res.status(201).json({
      message: "Group expense created successfully",
      expenseId,
    });

  } catch (error) {
    await sql`ROLLBACK`;
    console.log("Error creating group expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function requestSettlement(req, res) {
  try {
    const { groupId } = req.params;
    const { fromUser, toUser, amount } = req.body;

    if (isNaN(parseInt(groupId))) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    if (!fromUser || !toUser || !amount || fromUser === toUser) {
      return res.status(400).json({ message: "Invalid settlement request data" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    // Prevent duplicate pending requests
    const existing = await sql`
      SELECT id FROM settlement_requests
      WHERE group_id = ${groupId}
        AND from_user = ${fromUser}
        AND to_user = ${toUser}
        AND status = 'pending'
    `;

    if (existing.length > 0) {
      return res.status(409).json({
        message: "A pending settlement request already exists"
      });
    }

    const result = await sql`
      INSERT INTO settlement_requests (group_id, from_user, to_user, amount)
      VALUES (${groupId}, ${fromUser}, ${toUser}, ${amount})
      RETURNING id;
    `;

    res.status(201).json({
      message: "Settlement request created",
      settlementId: result[0].id
    });

  } catch (error) {
    console.log("Error requesting settlement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPendingSettlements(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await sql`
      SELECT
        id,
        group_id,
        from_user,
        amount,
        created_at
      FROM settlement_requests
      WHERE to_user = ${userId}
        AND status = 'pending'
      ORDER BY created_at DESC;
    `;

    res.status(200).json(result);

  } catch (error) {
    console.log("Error fetching pending settlements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function confirmSettlement(req, res) {
  const { settlementId } = req.params;
  const { userId } = req.body; 

  if (isNaN(parseInt(settlementId))) {
    return res.status(400).json({ message: "Invalid settlement ID" });
  }

  try {
    await sql`BEGIN`;

    //Fetch settlement
    const settlement = await sql`
      SELECT * FROM settlement_requests
      WHERE id = ${settlementId}
        AND status = 'pending'
    `;

    if (settlement.length === 0) {
      await sql`ROLLBACK`;
      return res.status(404).json({ message: "Pending settlement not found" });
    }

    const s = settlement[0];

    //Verify receiver
    if (s.to_user !== userId) {
      await sql`ROLLBACK`;
      return res.status(403).json({ message: "Not authorized to confirm this settlement" });
    }

    //Mark settlement confirmed
    await sql`
      UPDATE settlement_requests
      SET status = 'confirmed', responded_at = CURRENT_TIMESTAMP
      WHERE id = ${settlementId}
    `;

    // Record settlement as group expense
    const expenseResult = await sql`
      INSERT INTO group_expenses (group_id, title, amount, paid_by, created_by)
      VALUES (${s.group_id}, 'Settlement', ${s.amount}, ${s.from_user}, ${s.from_user})
      RETURNING id;
    `;

    const expenseId = expenseResult[0].id;

    await sql`
      INSERT INTO expense_splits (expense_id, user_id, share_amount)
      VALUES (${expenseId}, ${s.to_user}, ${s.amount});
    `;

    await sql`COMMIT`;

    res.status(200).json({
      message: "Settlement confirmed and recorded",
      expenseId
    });

  } catch (error) {
    await sql`ROLLBACK`;
    console.log("Error confirming settlement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectSettlement(req, res) {
  const { settlementId } = req.params;
  const { userId } = req.body; 

  if (isNaN(parseInt(settlementId))) {
    return res.status(400).json({ message: "Invalid settlement ID" });
  }

  try {
    const settlement = await sql`
      SELECT * FROM settlement_requests
      WHERE id = ${settlementId}
        AND status = 'pending'
    `;

    if (settlement.length === 0) {
      return res.status(404).json({ message: "Pending settlement not found" });
    }

    if (settlement[0].to_user !== userId) {
      return res.status(403).json({ message: "Not authorized to reject this settlement" });
    }

    await sql`
      UPDATE settlement_requests
      SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
      WHERE id = ${settlementId}
    `;

    res.status(200).json({ message: "Settlement rejected" });

  } catch (error) {
    console.log("Error rejecting settlement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

