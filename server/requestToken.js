var express = require("express");
var bodyParser = require("body-parser");
var request = require("sync-request");
var url = require("url");
var qs = require("qs");
var querystring = require("querystring");
var cons = require("consolidate");
var randomstring = require("randomstring");
var jose = require("jsrsasign");
var base64url = require("base64url");
var __ = require("underscore");
__.string = require("underscore.string");

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var options = {
  method: "POST",
  url: "https://zoom.us/oauth/token",
  qs: {
    grant_type: "authorization_code",
    //The code below is a sample authorization code. Replace it with your actual authorization code while making requests.
    code: "BBldegxGZ9_0p32jYXCSOCxJsV3lqXZdw",
    //The uri below is a sample redirect_uri. Replace it with your actual redirect_uri while making requests.
    redirect_uri: "http://localhost:9000/callback",
  },
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(
        querystring.escape("KFq1iYwHTFeJQEx1Aaa_dw") +
          ":" +
          querystring.escape("PhZxR6uBCIwCXF9FhpQ2KNR3DxxBTk6Q")
      ).toString("base64"),
  },
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});

var server = app.listen(9000, "localhost", function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("OAuth Client is listening at http://%s:%s", host, port);
});
