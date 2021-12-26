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

app.engine("html", cons.underscore);
app.set("view engine", "html");
app.set("views", "files/client");

// authorization server information
var authServer = {
  authorizationEndpoint: "https://zoom.us/oauth/authorize",
  tokenEndpoint: "https://zoom.us/oauth/",
};

// client information
// https://zoom.us/oauth/authorize?response_type=code&client_id=KFq1iYwHTFeJQEx1Aaa_dw&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fcallback

var client = {
  client_id: "KFq1iYwHTFeJQEx1Aaa_dw",
  client_secret: "WD2mwUfJQkWMcStDm7K7X5oT2SN7lX5k",
  redirect_uris: ["http://localhost:9000/callback"],
};

var carvedRockGymApi = "http://localhost:9002/gymStats";

var state = null;

var access_token = null;
var refresh_token = null;
var scope = null;

app.get("/", function (req, res) {
  res.render("index", {
    access_token: access_token,
    refresh_token: refresh_token,
    scope: scope,
  });
});

app.get("/authorize", function (req, res) {
  var authorizeUrl =
    "https://zoom.us/oauth/authorize?response_type=code&client_id=KFq1iYwHTFeJQEx1Aaa_dw&redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fcallback";

  console.log("redirect", authorizeUrl);
  res.redirect(authorizeUrl);
});

app.get("/callback", function (req, res) {
  if (req.query.error) {
    // it's an error response, act accordingly
    res.render("error", { error: req.query.error });
    return;
  }


  var code = req.query.code;

  var form_data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: client.redirect_uris[0],
  });
  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(
        querystring.escape(client.client_id) +
          ":" +
          querystring.escape(client.client_secret)
      ).toString("base64"),
  };

  var tokRes = request("POST", authServer.tokenEndpoint, {
    body: form_data,
    headers: headers,
  });

  console.log("Requesting access token for code %s", code);

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());

    access_token = body.access_token;
    console.log("Got access token: %s", access_token);
    if (body.refresh_token) {
      refresh_token = body.refresh_token;
      console.log("Got refresh token: %s", refresh_token);
    }

    if (body.access_token) {
      console.log("Got access token: %s", body.access_token);

      // check the access token
      var pubKey = jose.KEYUTIL.getKey(rsaKey);
      var signatureValid = jose.jws.JWS.verify(body.access_token, pubKey, [
        "RS256",
      ]);
      if (signatureValid) {
        console.log("Signature validated.");
        var tokenParts = body.access_token.split(".");
        var payload = JSON.parse(base64url.decode(tokenParts[1]));
        console.log("Payload", payload);
        if (payload.iss == "http://localhost:9003/") {
          console.log("issuer OK");
          // TODO: this is incorrect. Fix the video and the code
          if (
            (Array.isArray(payload.aud) &&
              _.contains(payload.aud, "http://localhost:9002/")) ||
            payload.aud == "http://localhost:9002/"
          ) {
            console.log("Audience OK");

            var now = Math.floor(Date.now() / 1000);

            if (payload.iat <= now) {
              console.log("issued-at OK");
              if (payload.exp >= now) {
                console.log("expiration OK");

                console.log("Token valid!");
              }
            }
          }
        }
      }
    }

    scope = body.scope;
    console.log("Got scope: %s", scope);

    res.render("index", {
      access_token: access_token,
      refresh_token: refresh_token,
      scope: scope,
    });
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

app.use("/", express.static("files/client"));

var server = app.listen(9000, "localhost", function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("OAuth Client is listening at http://%s:%s", host, port);
});
