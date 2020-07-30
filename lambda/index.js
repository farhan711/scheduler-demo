const AWS = require('aws-sdk');
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
const Lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

const s3Util = require('./utils/s3')
const cloudWatchEvents = require('./utils/cloudWatchEvents')
const sqsUtil = require('./utils/sqs')
const emailUtil = require('./utils/email')

const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/XXXXXXXXX/sqs_queue';
const PROCESS_MESSAGE = 'process-message';

exports.handler = (event, context, callback) => {
    try {
        
        if(event.Records && event.Records[0].eventSource === 'aws:s3') {  // event triggered by S3 file
            getS3MetadaAndProcess(event, callback)
        } else if(event.orchestrator_consumer) { // event triggered by CloudWatch Scheduled event
            poll(context.functionName, callback);
        } else if(event.operation === PROCESS_MESSAGE) { // event triggered by 'orchestrator_consumer' --> calls workers to read SQS messages
            process(event, callback);
        }else if(event.details && event.details.scheduler) { // event triggered by CloudWatch event for scheduled emails
            sqsUtil.postMessages(event.details).then( res => callback(null, res))
        }
    } catch (err) {
        callback(err);
    }
};

// Poll function is called by the orchestrator to get messages. It will invoke one Lambda function for each received message
// Assuming SES_Limitation, I use VisibilityTimeout to ensure the consumer will be call each second (lambda timeout is in 10 seconds)
function poll(functionName, callback) {
    const params = {
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 1,
    };
    // batch request messages
    SQS.receiveMessage(params, (err, data) => {
        if (err) {
            return callback(err);
        }else if(data.Messages) {
            // for each message, reinvoke the function
            const promises = data.Messages.map((message) => invokePoller(functionName, message));
            // complete when all invocations have been made
            Promise.all(promises).then((datas) => {
                const result = `Messages received: ${data.Messages.length}`;
                callback(null, result);
            });
        }
    });
}

// invokes a lambda consumer
function invokePoller(functionName, message) {
    const payload = {
        operation: PROCESS_MESSAGE,
        message,
    };
    const params = {
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: Buffer.from(JSON.stringify(payload)),
    };
    return new Promise((resolve, reject) => {
        Lambda.invoke(params, (err, result) => (err ? reject(err) : resolve(result)));
    });
}

// Process get the message from SQS (where withtin s3 metada contains the email form) and send the email.
// It deletes the SQS messages at the end.
function process(event, callback) {
    
    var s3Message = JSON.parse(event.message.Body)
    
    // retrieves the file to attach in the email
    s3Util.retrieveS3file(s3Message).then(data => {
        const s3File = data
        
        //calls the function how send the email
        emailUtil.sendEmail(s3Message, s3File).then((result) => {
            callback(null, result);
            // delete message
            const params = {
                QueueUrl: QUEUE_URL,
                ReceiptHandle: event.message.ReceiptHandle,
            };
            SQS.deleteMessage(params, (err) => callback(err, s3Message));
        }); 
        
    });
}

// 1- gets the data from S3 metadata where is the frontend email form. 
// 2- Check if is a scheduled email or not
// 2.1- If it is, calls schedule to create a CloudWatch Event for the desired scheduled time
// 2.2- If not, will post SQS messages for each email destination (since frontend form can handle multiple emails) 
function getS3MetadaAndProcess(message, callback) {
    var s3Message = {}
    
    // creates an object with all the s3 metadata (bucket,key and frontend form)
    s3Util.getMetadata(message.Records[0].s3.bucket.name, message.Records[0].s3.object.key).then(data => {
       
       s3Message['bucket'] = message.Records[0].s3.bucket.name
       s3Message['key'] = message.Records[0].s3.object.key         
       s3Message['Metadata'] = data.Metadata
       
       if(s3Message.Metadata.schedule === "true") {
            cloudWatchEvents.schedule(s3Message).then( res => callback(null, res)) // calls function to schedule the email
       } else {
            sqsUtil.postMessages(s3Message).then( res => callback(null, res)) // calls function to add email forms to SQS messages
       }
    }).catch(err => {
        return callback(err)
    })
}

