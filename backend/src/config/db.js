import{neon} from "@neondatabase/serverless";
import "dotenv/config";

//creating sql connection using db url

export const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS transactions(
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(11, 2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`
        console.log("DB initialised successfully");
    }
    catch (err) {
        console.log("DB initialised error: ", err);
        process.exit(1);
    }
}

