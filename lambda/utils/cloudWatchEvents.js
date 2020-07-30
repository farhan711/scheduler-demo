const AWS = require('aws-sdk');
const cwevents = new AWS.CloudWatchEvents({apiVersion: '2015-10-07'});

exports.schedule = (s3Message)  => {
  
  return new Promise((resolve, reject) => {
    
    const ruleName = s3Message.Metadata.filename + new Date().getTime()
    const cronJobExpression = getCronjobFromDate((s3Message.Metadata.scheduledtime))
    
    var params = {
      Name: ruleName,
      RoleArn: 'arn:aws:iam::XXXXXXXXX:role/cloudmatch_event_invoke_lambdas',
      ScheduleExpression: cronJobExpression,
      State: 'ENABLED'
    };
    
    // creating a new CloudWatch Rule. Adding specific time using cronJobExpression            
    cwevents.putRule(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        
        const ruleARN = data.RuleArn
        
        params = {
              Rule: ruleName,
              Targets: [
                {
                  Arn: 'arn:aws:lambda:us-east-1:XXXXXXXXX:function:lambda_s3_email',
                  Id: 'lambda_s3_email',
                }
              ]
            };
            
        // adding the Lambda function to be targeted     
        cwevents.putTargets(params, function(err, data) {
              if (err) {
                reject(err);
              } else {
                
                s3Message['scheduler'] = true
                
                params = {
                      Entries: [
                        {
                          Detail: JSON.stringify(s3Message),
                          DetailType: 'appRequestSubmitted',
                          Resources: [
                            ruleARN,
                          ],
                          Source: 'com.company.app'
                        }
                      ]
                    };
                
                //  adding the s3 metadata object to be retreived later by the lambda.   
                cwevents.putEvents(params, function(err, data) {
                      if (err) {
                        reject(err);
                      } else {
                        resolve(data);
                      }
                });
              }
            });
            
      }
    });
  })
    
}

// gets the scheduledTime from frontend and convert it in cronJobExpression
function getCronjobFromDate(dateString) {
    var date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.getUTCMonth() + 1
    const year = date.getUTCFullYear()
    const hour = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
  return  'cron(' + minutes + ' ' + hour + ' ' + day + ' ' + month + ' ? ' + year + ')' 
}
