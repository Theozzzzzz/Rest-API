const mysql = require("mysql2/promise")
const bodyParser = require('body-parser');
const express = require('express');
const bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken")
const app = express();
const PORT = 3000;

app.use(express.static('public'))   
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))



async function getDBConnnection() {
    // Här skapas ett databaskopplings-objekt med inställningar för att ansluta till servern och databasen.
    return await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "users",
    })
  }

app.get('', async (req, res) => {
  res.send("./public")
})

app.get('/users', async function(req, res) {
  let connection = await getDBConnnection()
  let sql = `SELECT * from users EXCEPT password`   
  let [results] = await connection.execute(sql)
  //res.json() skickar resultat som JSON till klienten
  console.log(results)
  res.json(results)
});

app.get('/users/:id', async function(req, res) {
  if (req.params.id) {
    let connection = await getDBConnnection()
    let sql = `SELECT * FROM users WHERE id = ?`  
    let [results] = await connection.execute(sql, [req.params.id]);
    res.json(results)
  }else{
    res.status(203)
  }
});

app.post('/register', async function(req, res) {

    let db = await getDBConnnection();
    //req.body innehåller det postade datat
    let user = req.body
    if (req.body && req.body.username && req.body.password && req.body.email && req.body.name) {
      const { username, name, email, password } = req.body;
      //HASHA INNAN SKICKAS
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

       // Store the user object in the database
      let sql = `INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)`
      let [results] = await db.execute(sql, [
        username,
        name,
        email,
        hashPassword,
      ])
      console.log(results)
      user.id = results.insertId
      res.status(201)
      res.json(user)
    } else {

        res.sendStatus(422)
      }
   });

app.post("/login", async (req, res) => {
    // User login
  const { email, password } = req.body;
  let sql = `Select * FROM users where email = ? LIMIT 1`;
  let [results] = await db.execute(sql, [email])

  if (results.length === 0) {
    return res.status(401).json({ error: 'Ingen användare med denna Email' });
  }

  let user = results[0];
  const storedHashedPassword = user.password;

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
  
  if (isPasswordValid) {
    // TOKEN skickas
    let payload = {
      sub: user.id,
      name: user.username,
    }
    let token = jwt.sign(payload, THESECRET, {exppiresIn: "15m"})
    res.send(token)
    res.status(200).json({ message: 'Du är inne' });
  } else {
    res.status(401).json({ error: 'Fel lösenord' });
  }
});


app.put("/users/:id", async function (req, res) {
  if (req.body.name) {
    let sql = `UPDATE users
    SET name = ?, WHERE id = ?`

  let [results] = await connection.execute(sql, [
    req.body.name,
    req.params.id,
    
  ])
  }else{
    res.status(401).send("Du måste skriva in det namn du vill byta till")
  }
})

   

app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log('Server listening on PORT', PORT);
}); 




//  let result = await db.getGuestbook()
//res.render('indexs', { title: 'Guestbook', message: 'Posts:', result})