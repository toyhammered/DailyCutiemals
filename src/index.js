/* Examples:
 * Dialog model:
 *  User: "Alexa, open Daily Cutiemals"
 *  Alexa: "For new users, Alexa will require you to speak email"
 *  User: "fake at fake dot com"
 *  Alexa: "Confirmation that (fake at fake dot com) is correct?"
 *  User: "Yes"
 *  Alexa: "I have added (fake at fake dot com) to the database"
 *
 * One-shot model:
 *  User: "Alexa, ask Daily Cutiemals to send me a cute cat picture"
 *  Alexa: "I have just sent you an email with a cute cat picture"
 *

 */

'use strict';
var storage = require("./storage");

exports.handler = function(event, context) {

  storage.getEmail(event.session, function(data) {
    if (data == "no email") {
      // Email does not exist
      var SetupEmail = require('./setupEmail');
      var setupEmail = new SetupEmail();
      setupEmail.execute(event, context);
    } else if (data.Unsubscribed === true) {
      // Unsubscribed from Emails
      var UnsubscribedEmail = require('./unsubscribedEmail');
      var unsubscribedEmail = new UnsubscribedEmail();
      unsubscribedEmail.execute(event, context);
    } else if (data.Verified === false) {
      // Need to Authorize Email
      var AuthEmail = require('./authEmail');
      var authEmail = new AuthEmail();
      authEmail.execute(event, context);
    } else {
      // Email Exists
      var DailyCutiemals = require('./dailyCutiemals');
      var dailyCutiemals = new DailyCutiemals();
      dailyCutiemals.execute(event, context);
    };
  });

};
