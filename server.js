const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const session = require("express-session");
const methodOr = require("method-override");

const app = express();
const path = require("path");

//db collections
const Account = require("./models/accounts");
const Listing = require("./models/listings");

//mongoose connection
mongoose
  .connect("mongodb://localhost:27017/LCAdb")
  .then(() => {
    console.log("db is created");
  })
  .catch((err) => {
    consol.log(err);
  });

//middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(methodOr("_method"));

//passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Account.findById(id, (e, user) => {
    done(e, user);
  });
});

passport.use(
  new localStrategy((username, password, done) => {
    Account.findOne({ username: username }, (e, user) => {
      if (e) return done(e);
      if (!user) return done(null, false, { message: "Incorrect username!" });
      bcrypt.compare(password, user.password, (e, res) => {
        if (e) return done(err);
        if (res === false)
          return done(null, false, { message: "Incorrect password!" });
        return done(null, user);
      });
    });
  })
);

//functions/middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

function isLoggedOut(req, res, next) {
  if (!req.isAuthenticated()) return next();
  res.redirect("/");
}

function getDate() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date();
  let month = months[date.getMonth()];
  let year = date.getFullYear();
  return `${month} ${year}`;
}

//listening to port 3000
app.listen(3000, () => {
  console.log("connected");
});

//root
app.get("/", async (req, res) => {
  const listings = await Listing.find({});
  if (req.isAuthenticated()) {
    user = req.user;
  } else {
    user = "";
  }
  res.render("index", { user, listings });
});

//login
app.get("/login", isLoggedOut, (req, res) => {
  const response = {
    title: "login",
    error: req.query.error,
  };
  res.render("login", response);
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login?error=true",
  })
);

//register
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const hpw = await bcrypt.hash(password, 10);
    const newAcc = new Account({
      username: username,
      password: hpw,
    });
    newAcc.save();
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

//logout
app.delete("/logout", (req, res) => {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//add new listing
app.get("/new-listing", isLoggedIn, (req, res) => {
  res.render("new-listing");
});
app.post("/new-listing", isLoggedIn, (req, res) => {
  const listingObj = req.body;
  try {
    const newListing = new Listing({
      username: req.user.username,
      uid: req.user.id,
      locname: listingObj.locname,
      locadd: listingObj.location,
      desc: listingObj.description,
      maplink: listingObj.maplink,
      price: listingObj.price,
      mainimg: listingObj.mainpic,
      secimg: listingObj.secpic,
      thiimg: listingObj.thipic,
      comments: [],
    });
    newListing.save();
    res.redirect("/");
  } catch {
    res.redirect("*");
  }
});

//see post
app.get("/listing/:_id", async (req, res) => {
  const id = req.params;
  const listingpost = await Listing.findById(id);
  const comments = listingpost.comments;
  res.render("listing-post", { listingpost, comments });
});

//new comment
app.post("/listing/:_id/new-comment", isLoggedIn, async (req, res) => {
  const id = req.params;
  try {
    await Listing.findOneAndUpdate(
      {
        _id: id._id,
      },
      {
        $push: {
          comments: {
            username: req.user.username,
            uid: req.user.id,
            date: getDate(),
            comment: req.body.comment,
          },
        },
      }
    );
    res.redirect(`/listing/${id._id}`);
  } catch {
    res.redirect("*");
  }
});

//edit listing
app.get("/listing/:_id/edit-listing", isLoggedIn, async (req, res) => {
  const id = req.params;
  const listingpost = await Listing.findById(id);
  if (req.user.id === listingpost.uid) {
    res.render("edit-listing", { listingpost });
  } else {
    res.redirect("*");
  }
});
app.put("/listing/:_id/edit-listing", isLoggedIn, async (req, res) => {
  const id = req.params;
  try {
    await Listing.findOneAndUpdate(
      {
        _id: id._id,
      },
      {
        $set: {
          username: req.user.username,
          uid: req.user.id,
          locname: req.body.locname,
          locadd: req.body.location,
          desc: req.body.description,
          maplink: req.body.maplink,
          price: req.body.price,
          mainimg: req.body.mainpic,
          secimg: req.body.secpic,
          thiimg: req.body.thipic,
        },
      }
    );
    res.redirect(`/listing/${id._id}`);
  } catch {
    res.redirect("*");
  }
});

//delete listing
app.delete("/listing/:_id/remove-listing", isLoggedIn, async (req, res) => {
  const id = req.params;
  try {
    await Listing.findByIdAndDelete(id);
    res.redirect("/");
  } catch {
    res.redirect("*");
  }
});

//edit comment
app.get("/listing/:_id/edit-comment", isLoggedIn, async (req, res) => {
  const id = req.params;
  const listingpost = await Listing.findOne({
    comments: {
      $elemMatch: {
        _id: id._id,
      },
    },
  });
  let userCommentObj = {};
  listingpost.comments.forEach((comment) => {
    if (comment._id == id._id) {
      userCommentObj = comment;
    }
  });
  if (req.user.id === userCommentObj.uid) {
    res.render("edit-comment", { userCommentObj });
  } else {
    res.redirect("*");
  }
});
app.put("/listing/:_id/edit-comment", isLoggedIn, async (req, res) => {
  const id = req.params;
  try {
    const listingpost = await Listing.findOneAndUpdate(
      {
        comments: {
          $elemMatch: {
            _id: id._id,
          },
        },
      },
      {
        $set: {
          "comments.$.comment": req.body.comment,
          "comments.$.date": getDate(),
        },
      }
    );
    res.redirect(`/listing/${listingpost._id}`);
  } catch {
    res.redirect("*");
  }
});

//delete comment
app.delete("/listing/:_id/remove-comment", isLoggedIn, async (req, res) => {
  const id = req.params;
  try {
    const listingPost = await Listing.findOneAndUpdate(
      {
        comments: {
          $elemMatch: {
            _id: id._id,
          },
        },
      },
      {
        $pull: {
          comments: {
            _id: id._id,
          },
        },
      }
    );
    res.redirect(`/listing/${listingPost._id}`);
  } catch {
    res.redirect("*");
  }
});

//wildcard
app.get("*", (req, res) => {
  res.send("Error 404");
});
