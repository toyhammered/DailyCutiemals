'use strict';
var AlexaSkill = require('./AlexaSkill');
var sessionAttributes = {};

var APP_ID = "amzn1.echo-sdk-ams.app.dd8f6e8e-0aed-4178-91ca-ab7bf4f75ccf";
var sendgrid = require('sendgrid')(ENV['SENDGRID_API']);
var storage = require("./storage");

var DailyCutiemals = function() {
  console.log("DailyCutiemals initialized");
  AlexaSkill.call(this, APP_ID);
};

DailyCutiemals.prototype = Object.create(AlexaSkill.prototype);
DailyCutiemals.prototype.constructor = DailyCutiemals;

DailyCutiemals.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("DailyCutiemals onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};
DailyCutiemals.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("DailyCutiemals onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechText = "Welcome to Daily Cutiemals. Please say something like, send me a cute cat picture.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);

};
DailyCutiemals.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("DailyCutiemals onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};


DailyCutiemals.prototype.intentHandlers = {
  "AddEmailIntent": function(intent, session, response) {
    var speechText = "You have already registered an email, you may say delete my email, or send me a cute cat picture.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);
  },
  "DeleteEmailIntent": function(intent, session, response) {
    storage.deleteEmail(session, function(message) {
      response.tell(message);
    });
  },
  "VerifyEmailIntent": function(intent, session, response) {
    response.ask("Your email has already been verified", "You may say something like send me a cute cat picture");
  },
  "ResendEmailConfirmationIntent": function(intent, session, response) {
    response.ask("Your email has already been verified", "You may say something like send me a cute cat picture");
  },
  "AnimalIntent": function(intent, session, response) {
    getImage(intent.slots.Adjective.value, intent.slots.Animal.value, response, session);
  },
  "AMAZON.YesIntent": function(intent, session, response) {
    var speechText = "You may say send me a cute cat picture or delete my email.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);
  },
  "AMAZON.NoIntent": function(intent, session, response) {
    var speechText = "You may say send me a cute cat picture or delete my email.";
    var repromptText = speechText;
    response.ask(speechText, repromptText);
  },
  "AMAZON.HelpIntent": function(intent, session, response) {
    var speechText = "You may say send me a cute cat picture or delete my email.";
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
}

function getImage(adjective, animal, response, session) {

  // be able to use fetch/promises
  var promise = require('es6-promise').polyfill();
  var fetch = require('isomorphic-fetch');
  var API_KEY = ENV['FLICKR_API_ID']

  var query = (adjective + " " + animal).replace("undefined", "").replace(" ", "+");

  var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key="
            + API_KEY
            + "&text=" + query
            + "&content_type=1"
            + "&per_page=50"
            + "&extras=url_l"
            + "&format=json"
            + "&nojsoncallback=1";

  fetch(url).then(
    function(fetchResponse) {
      return fetchResponse.json();
  }).then(
    function(data) {
      console.log("Fetch Success");
      var size = data.photos.photo.length;

      if (size == 0) {
        var speechText = "I could not find any images. You should most likely change your query.";
        var repromptText = "You may say something like send me a cute cat picture";
        response.ask(speechText, repromptText);
      } else {
        sendEmail(findLink(data.photos.photo, size), query, response, session);
      }
  }).catch(
    function(errorMessage){
      console.log("Something went wrong!", "error: " + errorMessage);
      var speechText = "If you are hearing this message, something bad on my part most likely happened, or Flickr is overloaded right now. Please try again.";
      var repromptText = speechText;
      response.ask(speechText, repromptText);
  });

}


function findLink(data, amount) {
  var link_exists_counter = 0;

  while (link_exists_counter < 100) {
    link_exists_counter += 1
    var rand_num = Math.floor((Math.random() * amount));
    if (data[rand_num].hasOwnProperty('url_l')) {
      console.log("Link Returned:");
      console.log(data[rand_num].url_l);
      console.log("************");
      console.log(data[rand_num]);
      return data[rand_num].url_l;
    }
    console.log("url_l does not exist");
    console.log(data[rand_num]);
  }

  // if the query is unable to find a link
  var speechText = "I could not find any images. You should most likely change your query.";
  var repromptText = "You may say something like send me a cute cat picture";
  response.ask(speechText, repromptText);
}

function sendEmail(image, query, response, session) {
  // get the email for the database
  storage.getEmail(session, function(data) {
    // message format for sendgrid
    query = query.replace("+", " ");

    // NEED TO ADD UNSUBSCRIBE LINK TO MESSAGE
    var unsubscribe_url = "https://30j3zknmq5.execute-api.us-east-1.amazonaws.com/prod/unsubscribe/" + session.user.userId;
    var unsubscribe = '<br /><div><a href=' + unsubscribe_url + '>Unsubscribe</a></div>';
    console.log(unsubscribe);
    var message = {
      to: data.Email,
      from: 'dailycutiemals@drassiner.com',
      subject: 'Hopefully this ' + query + ' picture will cheer you up!',
      html: '<img src="' + image + '" >' + unsubscribe
    }

    // sending message
    sendgrid.send(message, function(err, json) {
      if (err) {
        console.error(err);
        var speechText = "There seems to be a problem with your email, you should say delete my email and try again.";
        var repromptText = speechText;
        response.ask(speechText, repromptText);
      }
      response.tell("Your picture will be arriving shortly!");
    });
  })
}

module.exports = DailyCutiemals;
