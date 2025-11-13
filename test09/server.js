import express from "express";
import "dotenv/config";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));

app.use(express.static("."));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

const TABLE = process.env.TABLE;

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, "index.html"));
//     // ".."을 하면 "cd .."하는 것과 같은 의미
// });

try {
    await pool.query("select 1");
    console.log("db연결성공");
} catch (e) {
    console.log("db연결실패", e.message);
}
app.get("/list", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `select id, name, department, position, salary, 
            DATE_FORMAT(start_date, "%y-%m-%d")as start_date from 
            \`${TABLE}\`order by id desc`
        );
        const rowsHTML = rows
            .map(
                (item) => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.department}</td>
            <td>${item.position}</td>
            <td>${item.salary.toLocaleString()}</td>
            <td>${item.start_date}</td>
            <td>
                <form action="/delete" method="post">
                    <input type="hidden" name="from" value="list"/>
                    <input type="hidden" name="id" value="${item.id}"/>
                    <button class="delete" type="submit" style="background-color : red; color: white; border : none; border-radius: 5px;">
                        삭제
                    </button>
                </form>
            </td>
        </tr>
        `
            )
            .join("");
        res.send(
            `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <link rel="stylesheet" href="./index.css"/>
                </head>
                <body>
                    <div>
                        <table class="tableCon">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>이름</th>
                                    <th>부서</th>
                                    <th>직급</th>
                                    <th>급여</th>
                                    <th>입사년도</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    rowsHTML ||
                                    `<tr> <td colspan="7">데이터를 불러오지 못했습니다.</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                </body>
            </html>
            `,
            () => {}
        );
    } catch (error) {
        res.status(500).send("데이터 목록 로드 실패");
    }
});
app.post("/add", async (req, res) => {
    try {
        const { name, department, position, salary, start_date } = req.body;
        if (!name || !name.trim()) return res.redirect("/");

        const toNum = (a) => (a === "" || a === null ? null : Number(a));
        const toDate = (d) => (d === "" || d === null ? null : d);
        await pool.execute(
            `insert into \`${TABLE}\` (name, department, position, salary, start_date) values (?, ?, ?, ?, ?)`,
            [
                name.trim(),
                department.trim() || null,
                position.trim() || null,
                toNum(salary),
                toDate(start_date),
            ]
        );
        res.redirect("/");
    } catch (e) {
        console.error("로드실패");
        res.redirect("/");
    }
});

app.post("/delete", async (req, res) => {
    try {
        const id = Number(req.body.id);
        const from = req.body.from;
        const abc = from === "list" ? "/list" : "/";

        if (!id) return res.redirect(abc);
        await pool.execute(
            `
                delete from \`${TABLE}\` where id = ?
            `,
            [id]
        );
        res.redirect(abc);
    } catch (e) {
        console.error(e, "삭제 오류");
        res.redirect("/");
    }
});

const PORT = Number(process.env.PORT ?? 8080);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`${PORT}번에서 실행중 http:/localhost:${PORT}`);
});
