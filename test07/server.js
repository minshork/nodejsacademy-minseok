import express from 'express'
import 'dotenv/config'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.urlencoded({ extended : true}))
app.use(express.static('.'))

const pool = mysql.createPool({
    host : process.env.DB_HOST,
    port : Number(process.env.PORT || 3306),
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME,
})

const TABLE = process.env.TABLE

try{
    await pool.query('select 1')
    console.log('db연결 성공')
}catch (e) {
    console.log('db연결실패', e.message)
}

app.get( '/', (req, res)=>{
    res.sendFile( path.join(__dirname, 'index.html'))
})

app.post('/add', async (req, res)=>{
    const { name, score } = req.body
    console.log(req.body);
    if (!name || !score) return res.status(400).send('이름 또는 성적 입력 필요')
        // 404 데이터가 없음, 400 입력안함(요청이 잘못됨), 500 db연결오류, 403 권한없음
    await pool.execute(`insert into \`${TABLE}\` (name, score) values (?, ?)`, [name, score])
    res.redirect('/list')
})

app.get('/list', async (req, res)=>{
   const [ rows ] = await pool.query(`select name, score from \`${TABLE}\` order by name desc`)
   const list = rows.map( item => `<li>${item.name}, ${item.score}</li>`).join('')
   res.send(`<h3>이름목록</h3><ul>${list}</ul><a href='/'>입력칸으로</a>`)
})

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () =>console.log('서버연결성공 http://localhost:8080'))


