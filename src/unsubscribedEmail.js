'use strict';
var AlexaSkill = require('./AlexaSkill');

var APP_ID = "amzn1.echo-sdk-ams.app.dd8f6e8e-0aed-4178-91ca-ab7bf4f75ccf";
var storage = require("./storage");

var UnsubscribedEmail = function () {
  console.log("UnsubscribedEmail initialized");
  AlexaSkill.call(this, APP_ID);
};

UnsubscribedEmail.prototype = Object.create(AlexaSkill.prototype);
UnsubscribedEmail.prototype.constructor = UnsubscribedEmail;


UnsubscribedEmail.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("UnsubscribedEmail onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

UnsubscribedEmail.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("UnsubscribedEmail onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    response.tell("You are currently unsubscribed. You will not be receiving any emails");
};

UnsubscribedEmail.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("UnsubscribedEmail onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

UnsubscribedEmail.prototype.intentHandlers = {
  "AddEmailIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "DeleteEmailIntent": function(intent, session, response) {
    // Need to delete email
    storage.deleteEmail(session, function(message) {
      response.tell(message);
    });
  },
  "VerifyEmailIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "ResendEmailConfirmationIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "AnimalIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "AMAZON.YesIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "AMAZON.NoIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "AMAZON.HelpIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "AMAZON.StopIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  },
  "AMAZON.CancelIntent": function(intent, session, response) {
    response.tell("You are currently unsubscribed. You will not be receiving any emails.");
  }
};

module.exports = UnsubscribedEmail;
