# Lambda Function

This lambda function handles the sending of hundreds of emails when a file is sent to S3.

### Services used from AWS
 - S3 service: Stores the received file and creates and event triggering the Lambda function
 - Lambda: Handles the sending of emails 
 - SQS service: All the emails will be added to this queue in order to support scalability
 - SES service: sends the email. It has max sending number limitation per second 
 - CloudWatch events: triggers the email sending (lambda function) for scheduled emails and triggers the lambda every X seconds

### Workflow
1) User fills the email form from the frontend component. He can add multiple emails and attach a file.
2) Backend component receives the form. It prepares the sending adding the form fields to the metadata file.
3) S3 receives the file and triggers the lambda to handle it.
4) The lambda checks the event (s3 event): retrieves the form email from the s3 metadata and checks if it is a scheduled email
    4.A) NOT scheduled form email: adds a SQS message for each of the receivers from the email form. (Avoiding SES limitation)  
    4.B) 1) scheduled form email: adds a CloudWatch event for the scheduled time to send the email, adding into it the form email too. 
    4.B) 2) The CloudWatch event triggers the Lambda. Now is time to send the email so Lambda adds a SQS message for each of the receivers from the email form (attached in the CloudWatch event). (Avoiding SES limitation) 
5) CloudWatch event triggers every X seconds the Lambda function. Lambda checks this event and acts as orchestrator consumer. It get X number of SQS messages to be handled. (Avoiding SES limitation) 
6) For each one of the messages received from SQS queue, the Lambda function  invokes a Lambda function (another instance of the same Lambda function) that will handle only with one message.
7) The invoked Lambda function checks the event and knows that now it is a consumer. It get the SQS message attached in the event, where the form email is inside, and uses SES to send the email.
8) This consumer Lambda function deletes the message from the SQS.

Note: In each file has been added comments for better understanding.

### Installation
Create a `.zip` file from the `lambda` folder.
Create Lambda function and add the zipped folder using the console AWS in lambda section.
Create the rest of the services, configurations, roles and permissions to connect all of them.

### Improvements
Re-create the lambda project using `serverless Stack` in order to setup and deploy all the system in AWS. (I had not enough time to do it )