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

  return {
    // saving the email into the database
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
          var unsubscribe_url = "https://30j3zknmq5.execute-api.us-east-1.amazonaws.com/prod/unsubscribe/" + session.user.userId;
          var html_body = '<div>Your authentication token is: ' + auth_token + '</div> <br /><div>----------------------------------------------</div><br /><p>Not sure why you got this email? <a href=' + unsubscribe_url + '>Unsubscribe</a></p>';
          var message = {
            to: email,
            from: 'dailycutiemals@drassiner.com',
            subject: 'Authentication Token',
            html: html_body
          };
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
    // once someone has verified the token, it updates it to true.
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
        ReturnValues: "NONE"
      };
      dynamodb.update(params, function(err, data) {
        console.log("VERIFY EMAIL");
        if (err) {
          // email not registered or doesn't exist
          console.log(err, data);
          callback("Something seems to have gone wrong. You should most likely try again or contact the developer.");
        } else {
          // updated your email
          callback("Your email has been verified! You may now ask Daily Cutiemals for a cute cat picture.");
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
        console.log("Resend Verification Start");
        console.log(data);
        console.log(data.Item.Email);
        console.log(data.Item.Resend);
        if (data.Item.Resend > 3) {
          callback("You are not allowed to spam verification emails.");
        } else {
          var unsubscribe_url = "https://30j3zknmq5.execute-api.us-east-1.amazonaws.com/prod/unsubscribe/" + data.Item.CustomerId;
          var html_body = '<div>Your authentication token is: ' + data.Item.AuthToken +
                          '</div><br /><div>----------------------------------------------</div><br /><p>Not sure why you got this email? <a href=' + unsubscribe_url + '>Unsubscribe</a></p>';
          var message = {
            to: data.Item.Email,
            from: 'dailycutiemals@drassiner.com',
            subject: 'Authentication Token',
            html: html_body
          };
          // sending message
          var resend_value = data.Item.Resend + 1;
          params = {
            TableName: 'CutimalsEmailTable',
            Key: {
              CustomerId: session.user.userId
            },
            UpdateExpression: "set Resend = :t",
            ExpressionAttributeValues: {
              ":t": resend_value
            },
            ReturnValues: "NONE"
          };
          dynamodb.update(params, function(err, data) {
            sendgrid.send(message, function(err1, json) {
              if (err1) {
                console.log(err1);
                callback("There was an error sending your message");
              } else {
                callback("I have resent your authentication token");
              }
            });
          });

        }

      });
    }

  };


})();

module.exports = storage;
