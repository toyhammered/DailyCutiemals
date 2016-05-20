'use strict';
var AlexaSkill = require('./AlexaSkill');
var storage = require('./storage');
var sessionAttributes = {};

var APP_ID = "amzn1.echo-sdk-ams.app.dd8f6e8e-0aed-4178-91ca-ab7bf4f75ccf";

var SetupEmail = function () {
  console.log("SetupEmail initialized");
  AlexaSkill.call(this, APP_ID);
};

SetupEmail.prototype = Object.create(AlexaSkill.prototype);
SetupEmail.prototype.constructor = SetupEmail;


SetupEmail.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("SetupEmail onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

SetupEmail.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("SetupEmail onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    welcomeSetupEmailMessage(response, session);
};

SetupEmail.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("SetupEmail onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

SetupEmail.prototype.intentHandlers = {
  "AddEmailIntent": function(intent, session, response) {
    var email = formatEmail(intent.slots.Email.value);
    var split_email = email.split("").join(" ").replace(/\./ig, "dot");

    var speechText = 'Is ' + split_email + ' the correct email?'
    var repromptText = speechText;

    // store email in session so its accessable for confirmation
    sessionAttributes.email = email;
    session.attributes = sessionAttributes;

    response.ask(speechText, repromptText);
  },
  "DeleteEmailIntent": function(intent, session, response) {
    var speechText = "You need to first create an email before you can delete it.";
    var repromptText = {
      speech: "<speak> Please say <break time = \"0.2s\" /> my email is <break time = \"0.2s\" /> followed by your email <speak>",
      type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechText, repromptText);
  },
  "VerifyEmailIntent": function(intent, session, response) {
    var speechText = "You need to first create an email before you can verify it.";
    var repromptText = {
      speech: "<speak> Please say <break time = \"0.2s\" /> my email is <break time = \"0.2s\" /> followed by your email <speak>",
      type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechText, repromptText);
  },
  "ResendEmailConfirmationIntent": function(intent, session, response) {
    var speechText = "You need to first create an email before you can verify it.";
    var repromptText = {
      speech: "<speak> Please say <break time = \"0.2s\" /> my email is <break time = \"0.2s\" /> followed by your email <speak>",
      type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechText, repromptText);
  },
  "AnimalIntent": function(intent, session, response) {
    var speechText = "You need to first create an email before you can have cute animal pictures sent to you!";
    var repromptText = {
      speech: "<speak> Please say <break time = \"0.2s\" /> my email is <break time = \"0.2s\" /> followed by your email <speak>",
      type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechText, repromptText);
  },
  "AMAZON.YesIntent": function(intent, session, response) {
    sessionAttributes = session.attributes;
    submitEmail(sessionAttributes.email, session, response);
  },
  "AMAZON.NoIntent": function(intent, session, response) {
    var speechOutput = {
      speech: "<speak> Okay, lets try again. Please say <break time = \"0.2s\" /> my email is <break time = \"0.2s\" /> followed by your email <speak>",
      type: AlexaSkill.speechOutputType.SSML
    }
    var repromptText = "You may spell out your email if I am not interpreting what you are saying correctly.";
    response.ask(speechOutput, repromptText);
  },
  "AMAZON.HelpIntent": function(intent, session, response) {
    var speechText = "When saying your email, you may spell it out or say each word. Emails will be formatted as so: fake at fake dot com";
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


function welcomeSetupEmailMessage(response, session) {
  // resets every time (for the case that the person says no);
  sessionAttributes = {};
  session.attributes = {};

  var speechOutput = {
    speech:  "<speak> Welcome to Daily Cutiemals. To add your email you will need to say <break time=\"0.2s\"/> my email is <break time = \"0.2s\"/> followed by your email. </speak>",
    type: AlexaSkill.speechOutputType.SSML
  }
  var repromptText = speechOutput;

  response.ask(speechOutput, repromptText);
}

function formatEmail(email) {
  // formatting email from fake at fake dot com -> fake@fake.com
  var output = (email
               .replace(/\b(at)\b/ig, "@")
               .replace(/\b(dot)\b/ig, ".")
               .replace(/\b(underscore)\b/ig, "_")
               .replace(/\b(hyphen|dash)\b/ig, "-")
               .replace(/ /ig, '')
               .toLowerCase());
  return output
}

function submitEmail(email, session, response) {
  // very simple regex, just want to make sure it is somewhat valid
  var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  console.log("Email Pre REGEX: " + email);

  var errorMessage = function() {
    var speechText = "There was a database error, please try again.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);
  }

  var successMessage = function() {
    response.tell("You have been sent a verification code. The next time you use Daily Cutiemals it will ask you to verify your email using that code.");
  }

  if (reg.test(email)) {
    storage.save(email, session, errorMessage, successMessage)
  } else {
    var speechText = email + " is an invalid email, please say my email is followed by your email";
    var repromptText = speechText;
    response.ask(speechText, repromptText);

    // reset session attributes to remove email
    session.attributes = {};
  };

}

module.exports = SetupEmail;
