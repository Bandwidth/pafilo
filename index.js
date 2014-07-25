"use strict";
let request = require("superagent");
let url     = require("url");

const MAILGUN_API  = "https://api.mailgun.net/v2/";
const MAILGUN_USER = "api";


module.exports.register = function*(plugin){
  plugin.expose("type", "mail");
  plugin.expose("description",  require("./package.json").description);
  plugin.expose("parameters",{
    credentials: [
      { name : "apiKey", required : true }
    ]
  });
  plugin.expose("provision", function* (parameters) {
    let domains;
    let response;

    domains  = request.get(url.resolve(MAILGUN_API, "domains")).auth(MAILGUN_USER, parameters.credentials.apiKey);
    response = yield function(callback){domains.end(function(r){
      callback(null, r);
    })};

    if (response.statusCode === 200) {
      let domain = response.body.items[0];

      if (!domain) {
        throw new Error("No domains available.");
      }

      return {
        login: domain.smtp_login,
        password: domain.smtp_password,
        domain: domain.name
      };
    }
    // Invalid API key.
    else if (response.statusCode === 407) {
      throw new Error("Unauthorized.");
    }
    else {
      throw new Error("Unexpected API error.");
    }
  });
};

module.exports.register.attributes = {
  pkg: require("./package.json")
};


