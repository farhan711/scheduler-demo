var aws = require('aws-sdk');
require('dotenv').config(); 

var basicValidation = require('./../utils/basicFormValidor')
// Configure aws with accessKeyId, region and secretAccessKey
aws.config.update({
  region: process.env.region, 
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey
})

const S3_BUCKET = process.env.bucket

exports.sign_s3 = (req,res) => {
  const s3 = new aws.S3();  // Create a new instance of S3
  
  
  // validating the form
  if(basicValidation.basicValidation(req.body)) {
      // Set up the payload to send to the S3 api
      const fileName = req.body.fileName;
      const fileType = req.body.fileType;

      const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 50,
        ContentType: fileType,
        ACL: 'public-read',
        Metadata: {
          'from': process.env.from_email,
          'to': JSON.stringify(req.body.to),
          'subject': req.body.subject,
          'body': req.body.body,
          'schedule': JSON.stringify(req.body.schedule),
          'scheduledTime': req.body.scheduledTime,
          'fileName': fileName,
          'fileType': fileType
        }
      };
    // It is necessary to make a request to the S3 API to get a signed URL to upload the file
    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if(err){
          res.json({success: false, error: err})
        }
        
        const returnData = {
          signedRequest: data,
          url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
        };
        res.json({success:true, data:{returnData}});
      });
  
   } else {
      return res.status(400).send({
        message: 'You have errors in your form!'
    });
   }

}
