const AWS = require('aws-sdk');
var nodemailer = require('nodemailer');
var ses = new AWS.SES();

// in order to attatch the S3 file I have used nodemailer
exports.sendEmail = (form, s3File) => {
    
    return new Promise((resolve, reject) => {
        
        var mailOptions = {
            from: form.Metadata.from,
            subject: form.Metadata.subject,
            html: `<p>${form.Metadata.body}</p>`,
            to: form.Metadata.to,
            attachments: [
                {
                    filename: `${form.Metadata.filename}.${form.Metadata.filetype}`   ,
                    content: s3File.Body
                }
            ]
        };
        var transporter = nodemailer.createTransport({
            SES: ses
        });
        return transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                   reject(); 
                } 
               else {
                   resolve(true);
                }
               });
    })
    
} 