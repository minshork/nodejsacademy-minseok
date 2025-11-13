import express from 'express'
import 'dotenv/config' // 환경변수 (비밀번호등) 사용
import mysql from 'mysql2/promise' // db연동 사용
import path from 'path' // 경로설정
import { fileURLToPath } from 'url' // 위치를 알려주는 함수

const app = express()
const __filename = fileURLToPath(import.meta.url)
// __filename => c:\node\test11\server.js
const __dirname = path.dirname(__filename)
// __dirname => c:\node\test11

// 미들웨어
app.use(express.urlencoded({extended : true}))
app.use(express.static('.'))

// db연결 설정
const pool = mysql.createPool({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME,
    user : process.env.DB_USER,
})

try{
    await pool.query('select 1')
    console.log('db연결 성공')
}catch (e){
    console.log('db연결실패', e.message)
}
const TABLE = process.env.TABLE;
app.get('/list', async (req,res) =>{
    try{
        const [ rows ] = await pool.query(
            `select id, name, age, gender, grade, score
             from \`${TABLE}\` order by id desc`
        )
        
        const rowsHtml = rows.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.age}</td>
                <td>${item.gender}</td>
                <td>${item.grade}</td>
                <td>${item.score}</td>
                <td>
                    <form action="/delete" method="post" style="display:inline">
                       <input type="hidden" name="from" value="list">
                       <input type="hidden" name="id" value="${item.id}">
                       <button class="danger" type="submit" >삭제</button>
                    </form>
                </td>
            </tr>
            `).join('')
            res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <link rel="stylesheet" href="./index.css" />
                    </head>
                    <body>
                        <div>
                            <table>
                            <thead>
                               <tr>
                                  <th>ID</th>
                                  <th>이름</th>
                                  <th>나이</th>
                                  <th>성별</th>
                                  <th>등급</th>
                                  <th>점수</th>
                                  <th>작업</th>
                               </tr>
                            </thead>
                            <tbody>
                              ${ rowsHtml || `<tr><td colspan="7">데이터가 없습니다</td></tr>` }
                            </tbody>
                            </table>
                        </div>
                    </body>
                </html>
                `)
    }catch (e){
        console.error(e)
        res.status(500).send('데이터 목록 로드 실패')
    }
})

app.post('/add', async (req, res)=>{
    try{
        const { name, age, gender, grade, score } = req.body
        if(!name || !name.trim() ) return res.redirect('/')
        const toNum = (a) => ( a === "" || a == null ? null : Number(a)  )
        await pool.execute(
            `insert into \`${TABLE}\` (name, age, gender, grade, score)  values (?, ?, ?, ?, ?)`, 
            [ name.trim(), toNum(age) , gender || null , grade || null, toNum(score)  ]
        )
        res.redirect('/')

    }catch (e){
        console.error(e)
        res.redirect('/') 
    }
})

app.post("/delete", async (req, res) =>{
    try{
        const id = Number(req.body.id)
        const from = req.body.from
        const kbs = from === 'list' ? '/list' : '/'

        if(!id) return res.redirect(kbs)
        
            await pool.execute(`
            delete from \`${TABLE}\` where id = ?` , [id])
            res.redirect(kbs)
    }catch (e) {
        console.error(e)
        res.redirect('/')
    }
})


const PORT = Number(process.env.PORT ?? 8080)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ 서버 실행: http://localhost:${PORT}`);
});
