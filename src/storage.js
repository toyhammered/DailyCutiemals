'use strict';

var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});
var sendgrid = require('sendgrid')(ENV['SENDGRID_API']);

var storage = (function() {
  var dynamodb = new AWS.DynamoDB.DocumentClient();

  function createAuthToken() {
    var all_letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var auth_token = "";
    for(var i=0; i < 6; i++) {
      var rand_number = Math.floor((Math.random() * 26));
      auth_token += all_letters[rand_number];
    }
    return auth_token;
  }

  // saving the email into the database
  return {
    save: function(email, session, error, success) {
      var auth_token = createAuthToken();
      var params = {
        TableName: 'CutimalsEmailTable',
        Item: {
          CustomerId: session.user.userId,
          Email: email,
          AuthToken: auth_token,
          Verified: false,
          Resend: 0,
          Unsubscribed: false
        }
      };
      dynamodb.put(params, function(err, data) {
        if (err) {
          error();
        } else {
          var message = {
            to: email,
            from: 'dailycutiemals@drassiner.com',
            subject: 'Authentication Code',
            html: 'Your authentication code is: ' + auth_token
          }
          // sending message
          sendgrid.send(message, function(err, json) {
            if (err) {
              console.error(err);
              var speechText = "There seems to be a problem with your email, you should say delete my email and try again.";
              var repromptText = speechText;
              error();
            } else {
              success();
            }
          });

        }
      });
    },
    // finding the email in the database
    getEmail: function(session, callback) {
      var params = {
        TableName: 'CutimalsEmailTable',
        Key: {
          CustomerId: session.user.userId
        }
      };
      dynamodb.get(params, function(err, data) {
        console.log("GET");
        if (Object.keys(data).length == 0) {
          // error finding email (doesn't exist)
          callback("no email");
        } else {
          // found email
          callback(data.Item);
        }
      });
    },
    // delete email so you can add change it (wil go back through setupEmail again)
    deleteEmail: function(session, callback) {
      var params = {
        TableName: 'CutimalsEmailTable',
        Key: {
          CustomerId: session.user.userId
        }
      };
      dynamodb.delete(params, function(err, data) {
        console.log("DELETE");
        if (err) {
          // email not registered or doesn't exist
          callback("Something seems to have gone wrong. You most likely dont have an email registered");
        } else {
          // found your email and deleted it
          callback("Your email has been deleted, you may now register a new email if you want.");
        }
      });
    },
    // if someone opts out of receiving emails (they are going to be clicking a link)
    updateSubscription: function(session, callback) {


    },
    // once someone has verified the code, it updates it to true.
    updateVerified: function(session, callback) {
      var params = {
        TableName: 'CutimalsEmailTable',
        Key: {
          CustomerId: session.user.userId
        },
        UpdateExpression: "set Verified = :t",
        ExpressionAttributeValues: {
          ":t": true
        },
        ReturnValues: "UPDATED_NEW"
      };
      dynamodb.update(params, function(err, data) {
        console.log("VERIFY EMAIL");
        if (err) {
          // email not registered or doesn't exist
          console.log(err, data);
          callback("Something seems to have gone wrong. You should most likely try again or contact the developer.");
        } else {
          // updated your email
          callback("Your email has been verified! You may now say something like Alexa, ask Daily Cutiemals to send me a cute cat picture.");
        }
      });
    },
    resendVerification: function (session, callback) {
      var params = {
        TableName: 'CutimalsEmailTable',
        Key: {
          CustomerId: session.user.userId
        }
      };
      dynamodb.get(params, function(err, data) {
        // will update database to add +1 to resend and check if it is over the limit.
        var message = {
          to: data.Email,
          from: 'dailycutiemals@drassiner.com',
          subject: 'Authentication Code',
          html: 'Your authentication code is: ' + data.AuthToken
        }
        // sending message
        sendgrid.send(message, function(err, json) {
          if (err) {
            callback("There was an error sending your message");
          } else {
            callback("I have resent your authentication code");
          }
        });
      });
    }

  };


})();

module.exports = storage;
