"use strict";

const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");

const cors = require("cors");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

/** this project needs a db !! **/

//mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.URLSHORTENERDATABASEURL);

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use("/public", express.static(process.cwd() + "/public"));

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }
});
const Url = mongoose.model("Url", urlSchema);

app.post("/api/shorturl/new", function(req, res) {
  let parsedUrl = url.parse(req.body.url);
  let lookupUrl = parsedUrl.host;
  dns.lookup(lookupUrl, function(err, address, family) {
    // console.log("addresses", address);
    // console.log("family", family);
    if (err || !address) {
      console.error("err", err);
      res.json({ error: "invalid URL" });
    } else {
      Url.count({}, function(err, count) {
        console.log("count", count);
        var shortUrl = "/api/shorturl/" + count;
        var urldata = new Url({
          original_url: req.body.url,
          short_url: shortUrl
        });
        urldata.save(function(err, urldata) {
          if (err) {
            console.log("something went wrong");
          } else {
            console.log("we just save the url to the database");
            res.json({
              original_url: req.body.url,
              short_url: shortUrl
            });
          }
        });
      });
    }
  });
});

app.get("/api/shorturl/:id", function(req, res) {
  Url.find({ short_url: `/api/shorturl/${req.params.id}` })
    .exec()
    .then(url => {
      if (!url) res.status(404).json({ url: "Url not found" });
      res.redirect(url[0].original_url);
    })
    .catch(err => console.log(err));
});

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
