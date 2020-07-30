var AWS = require('aws-sdk');
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/XXXXXXXXX/sqs_queue';


exports.postMessages = (s3Message) => {
    // send SQS message for each email recipient separately
     return new Promise((resolve, reject) => {
        JSON.parse(s3Message.Metadata.to).map(recipient => {
            
            s3Message.Metadata.to = [recipient]
            
            var params = {
              DelaySeconds: 1,
              // add in the MessageBody all the necesary information to send individual emails
              MessageBody: JSON.stringify(s3Message),
              QueueUrl: QUEUE_URL
            };
            
            sqs.sendMessage(params, function(err, data) {
              if (err) {
                reject(err);
              } else {
                resolve(data)
              }
            });
        })
     })
}