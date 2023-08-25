const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors")
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'Sankese08',
      database : 'postgres'
    }
});



const app = express();

app.use(bodyParser.json());
app.use(cors())


app.post("/signin", (req, res) => {
    const {email, name, password} = req.body;
    if (!email || !password){
        return res.status(400).json("incorrect form submission");
    }
    db.select("email", "hash").from("login")
        .where("email", "=", req.body.email)
        .then(data => {
            if (data.length === 0) {
                res.status(400).json("wrong credentials");
            } else {
                const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
                if (isValid) {
                    db.select("*").from('users')
                        .where("email", "=", req.body.email)
                        .then(user => {
                            if (user.length === 0) {
                                res.status(400).json("unable to get user");
                            } else {
                                res.json(user[0]);
                            }
                        })
                        .catch(err => res.status(500).json("error fetching user"));
                } else {
                    res.status(400).json("wrong credentials");
                }
            }
        })
        .catch(err => res.status(500).json("error fetching credentials"));
});



app.post("/register", (req, res) => {
    const {email, name, password} = req.body;
    if (!email || !name || !password){
        return res.status(400).json("incorrect form submission");
    }
    const hash = bcrypt.hashSync(password);
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into("login")
            .returning("email")
            .then(loginEmail => {
                return trx("users")
                    .returning("*")
                    .insert({
                        
                        email: loginEmail[0].email, 
                        name: name,
                        joined: new Date()
                    }).then(user => {
                        res.json(user[0])
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
       
    
})

app.get("/profile/:id", (req, res) => {
    const { id } = req.params;
    db.select('*').from("users").where({id})
        .then(user => {
        console.log(user)
        if (user.length) {
            res.json(user[0])
        }else {
            res.status(400).json("Not found")
        }
    }).catch(err => res.status(400).json("error getting user"))
})

app.put("/image", (req, res) => {
    const { id } = req.body;
   db('users').where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json("unable to get entries"))
    
})

app.listen("https://myapp-0oja.onrender.com", () => {
    console.log("app is running on port 3000");
})

