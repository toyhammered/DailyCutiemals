'use strict';
var AlexaSkill = require('./AlexaSkill');
var storage = require('./storage');

var APP_ID = "amzn1.echo-sdk-ams.app.dd8f6e8e-0aed-4178-91ca-ab7bf4f75ccf";

var AuthEmail = function () {
  console.log("AuthEmail initialized");
  AlexaSkill.call(this, APP_ID);
};

AuthEmail.prototype = Object.create(AlexaSkill.prototype);
AuthEmail.prototype.constructor = AuthEmail;

AuthEmail.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("AuthEmail onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

AuthEmail.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("AuthEmail onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    welcomeAuthEmailMessage(response, session);
};

AuthEmail.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("AuthEmail onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

AuthEmail.prototype.intentHandlers = {
  "AddEmailIntent": function(intent, session, response) {
    var speechText = "You have already added an email that now needs to be verified. If you added the wrong email you may ask Alexa to delete my email.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);
  },
  "DeleteEmailIntent": function(intent, session, response) {
    storage.deleteEmail(session, function(message) {
      response.tell(message);
    });
  },
  "VerifyEmailIntent": function(intent, session, response) {

    var auth_token = "";
    auth_token += intent.slots.ALetters.value;
    auth_token += intent.slots.BLetters.value;
    auth_token += intent.slots.CLetters.value;
    auth_token += intent.slots.DLetters.value;
    auth_token += intent.slots.ELetters.value;
    auth_token += intent.slots.FLetters.value;
    auth_token = auth_token.replace(/\./g,"");

    storage.getEmail(session, function(data) {
      if (data.AuthToken == auth_token.toLowerCase()) {
        storage.updateVerified(session, function(message) {
          response.tell(message);
        });
      } else {
        var speechText = "The authentication token you provided is invalid. Please try again";
        var repromptText = speechText;
        response.ask(speechText, repromptText);
      }
    });

  },
  "ResendEmailConfirmationIntent": function(intent, session, response) {
    storage.resendVerification(session, function(message) {
      response.tell(message);
    });
  },
  "AnimalIntent": function(intent, session, response) {
    var speechText = "You need to first verify your email before you can be sent cute animal pictures . Please say my token is and then spell out the authentication token that was sent to your email.";
    var repromptText = "Please say my token is and then spell out the authentication token that was sent to your email.";

    response.ask(speechText, repromptText);
  },
  "AMAZON.YesIntent": function(intent, session, response) {
    welcomeAuthEmailMessage(response, session);
  },
  "AMAZON.NoIntent": function(intent, session, response) {
    storage.resendVerification(session, function(message) {
      response.tell(message);
    });
  },
  "AMAZON.HelpIntent": function(intent, session, response) {
    var speechText = "When saying your authentication token, you must spell it out letter for letter.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);
  },
  "AMAZON.StopIntent": function(intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  },
  "AMAZON.CancelIntent": function(intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  }

};

function welcomeAuthEmailMessage(response, session) {
  var speechText = "Welcome to Daily Cutiemals. I am now going to help you authorize your email. Please say my token is and then spell out the authentication token that was sent to your email.";
  var repromptText = "If you did not get an email you may ask Alexa to resend email confirmation";

  response.ask(speechText, repromptText);
}

module.exports = AuthEmail;
