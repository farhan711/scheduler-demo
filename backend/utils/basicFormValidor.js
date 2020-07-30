// basic form validation before sending to S3
exports.basicValidation = (formBody) => {

    var valid = true
    var testEmail =    /^[ ]*([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})[ ]*$/i;

    if ( !formBody || !formBody.to || !Array.isArray(formBody.to)
        || !formBody.subject || formBody.subject.length === 0 
        || !formBody.body || formBody.body.length === 0 
        || !formBody.fileName || formBody.fileName.length === 0
        || !formBody.fileType || formBody.fileType.length === 0
        || (formBody.schedule && !formBody.scheduledTime)
        || (formBody.schedule && isNaN(formBody.scheduledTime) && typeof Date.parse(formBody.scheduledTime) != 'number') )  {
            
            valid = false
    } 
    
    for(var i=0; i<formBody.to.length; i++) {
      if(!testEmail.test(formBody.to[i])) {
        valid = false
      }
    }
    return valid
}