"use strict";
let plugin = require("..");
let nock = require("nock");
let Hapi = require("co-hapi");

const MAILGUN_API = "https://api.mailgun.net";

describe("The Mailgun service provider", function() {
  const API_KEY = "NOT_A_VALID_KEY";
  const TOKEN = (new Buffer("api:" + API_KEY)).toString("base64");

  function getDomains() {
    return nock(MAILGUN_API)
      .matchHeader("Authorization", "Basic " + TOKEN)
      .get("/v2/domains");
  }
  let server, mailgun;
  before(function*(){
    server = new Hapi.Server("localhost", 3001);
    yield server.pack.register(plugin);
    mailgun = server.plugins[require("../package.json").name];
    // This makes it so that any test case not explicitly expecting an HTTP
    // request will fail.
    nock.disableNetConnect();
  });


  after(function() {
    nock.enableNetConnect();
  });

  it("provides the 'mail' service type", function() {
    mailgun.should.have.property("type", "mail");
  });

  it("requires an API key", function() {
    mailgun.should.have.property("parameters");
    mailgun.parameters.should.have.property("credentials");
    mailgun.parameters.credentials.should.eql([{
      name: "apiKey",
      required: true
    }]);
  });

  describe("provisioning an instance", function() {
    describe("with a valid API key", function() {
      let instance;
      let request;

      before(function * () {
        request = getDomains().reply(200, {
          "total_count": 1,

          "items": [{
            "smtp_login": "tester@example.mailgun.org",
            "name": "example.mailgun.org",
            "smtp_password": "testy"
          }]
        });

        instance = yield mailgun.provision({
          credentials: {
            apiKey: API_KEY
          }
        });
      });

      after(function() {
        request.done();
      });

      it("returns an SMTP data", function() {
        instance.should.eql({
          login: "tester@example.mailgun.org",
          password: "testy",
          domain: "example.mailgun.org"
        });
      });
    });
    describe("with an invalid API key", function() {
      let failure;
      let request;

      before(function * () {
        // Mailgun seems to respond with 407 rather than 401 on failed auth
        // despite what the documentation claims.
        request = getDomains().reply(407);
        try {
          yield mailgun.provision({
            credentials: {
                apiKey: API_KEY
            }
          });
        }
        catch (error) {
          failure = error;
        }
      });

      after(function() {
        request.done();
      });

      it("fails", function() {
        failure.should.be.an.Error;
        failure.message.should.match(/unauthorized/i);
      });
    });

    describe("when no domains are available", function() {
      let failure;
      let request;

      before(function * () {
        request = getDomains().reply(200, {
          "total_count": 0,
          "items": []
        });

        try {
          yield mailgun.provision({
              credentials: {
                  apiKey: API_KEY
              }
          });
        }
        catch (error) {
            failure = error;
        }
      });

      after(function() {
        request.done();
      });

      it("fails", function() {
        failure.should.be.an.Error;
        failure.message.should.match(/no domains/i);
      });
    });

    describe("encountering an unexpected error", function() {
      let failure;
      let request;

      before(function * () {
        request = getDomains().reply(400);

        try {
          yield mailgun.provision({
            credentials: {
                apiKey: API_KEY
            }
          });
        }
        catch (error) {
          failure = error;
        }
      });

      after(function() {
        request.done();
      });

      it("fails", function() {
        failure.should.be.an.Error;
        failure.message.should.match(/unexpected api error/i);
      });
    });
  });
});
