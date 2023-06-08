//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("cookie-session")
const passport = require("passport")  
const passportLocalMongoose = require("passport-local-mongoose"); 



const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(session({
    cookie: {
        secure: true,
        maxAge:60000
    },
    secret: "my name is mustey",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session())


//mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});
const connectDB = (url) => {
    return mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
}

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
})   
 
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login")
    }
})

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect("/")
    });
})

app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
        console.log(err);
        res.redirect("/register")
    } else {
        passport.authenticate("local")(req, res, function() {
            res.redirect("/secrets")
        })
    }
  })
})

app.post("/submit", async (req, res) => {
    try {
        const posted = await User.create(req.body.name)
        res.status(201).json({posted})
        console.log(posted)
    } catch (error) {
        console.log(error);
    }
})

app.post("/login", (req, res) => {
    const user = new User(
        {
            username: req.body.username,
            password: req.body.password
        }
    )


    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })
        }
    })
})


// app.listen(3000, () => {
//     console.log("server start at port 3000");
// })

const port = process.env.PORT || 80;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, console.log(`server is listening to port ${port}.....`))
    } catch (err) {
        console.log(err)
    }
}

start()

