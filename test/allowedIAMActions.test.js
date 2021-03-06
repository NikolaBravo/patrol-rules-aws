var test = require('tape');

var code = require('../allowedIAMActions/function.js');
var fn = code.fn;

test('allowedIAMActions rule', (t) => {

  var event = {
    'detail': {
      'userIdentity': {
        'userName': 'bob'
      },
      'requestParameters': {
        'roleArn': 'arn:aws:iam::12345678901:role/Administrator-123456',
        'roleSessionName': 'bob'
      }
    }
  };

  var docMixed = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudtrail:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'iam:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'ec2:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'iam:PutUserPolicy'
        ]
      },
    ]
  };


  event.detail.requestParameters.policyDocument = JSON.stringify(docMixed);

  process.env.allowedActions = 'iam:PassRole';
  process.env.restrictedServices = 'iam, cloudtrail';

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on multiple disallowed matches');
    t.equal(message.summary, 'Disallowed actions cloudtrail:* iam:* iam:PutUserPolicy used in policy',
      'Alarms on multiple disallowed matches');
  });

  var docAllowedRestricted = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'iam:PassRole'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'iam:PutUserPolicy'
        ]
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docAllowedRestricted);

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on multiple disallowed matches');
    t.equal(message.summary, 'Disallowed actions iam:PutUserPolicy used in policy',
      'Alarms on multiple disallowed matches');
  });

  var docAllowed = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'iam:PassRole'
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docAllowed);

  fn(event, {}, (err, _message) => {
    t.error(err, 'does not error');
    t.equal(undefined, undefined, 'No alarm on allowed action');
  });

  event = {
    'detail': {
      errorCode: 'AccessDenied',
      errorMessage: 'This is the error message'
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'No error when calling allowedIAMActions');
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

  var docNonArray = {
    Statement: {
      Effect: 'Allow',
      Action: [
        'iam:PutUserPolicy'
      ]
    }
  };

  event = {
    'detail': {
      'userIdentity': {
        'userName': 'bob'
      },
      'requestParameters': {
        'roleArn': 'arn:aws:iam::12345678901:role/Administrator-123456',
        'roleSessionName': 'bob'
      }
    }
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docNonArray);

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on single non-array disallowed match');
    t.equal(message.summary, 'Disallowed actions iam:PutUserPolicy used in policy',
      'Alarms on single non-array disallowed match');
  });

  t.end();
});
