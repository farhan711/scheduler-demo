const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// gets the metadata from s3 file
exports.getMetadata = (Bucket, Key) => {
    
    const params = {
        Bucket,
        Key
    } 
    return new Promise((resolve, reject) => {
        s3.headObject(params, (err, result) => (err ? reject(err) : resolve(result)));
        
    });
} 

// gets the s3 file 
exports.retrieveS3file = (s3Message) => {
    const params = {
        Bucket:  s3Message.bucket ,
        Key: s3Message.key
    } 
    return new Promise((resolve, reject) => {
        s3.getObject(params, (err, result) => (err ? reject(err) : resolve(result)));
        
    });
}  