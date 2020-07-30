import React, { Component } from 'react';
import axios from 'axios';
import {Form, Button, Card, Alert, InputGroup} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'
import {generate} from 'shortid';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      sending: false, 
      schedule: false,
      scheduledTime: {date: new Date(), error: false},
      success : false,
      error: false,
      to: [{
        id: generate(), email: '', error: false
      }],
      subject: {text: "This is an Subject example, change me", error: false},
      body:{text:  "This is a body example, change me", error: false},
    }
    this.handleAddEmails = this.handleAddEmails.bind(this)
    this.handleEmail = this.handleEmail.bind(this)
    this.removeEmail = this.removeEmail.bind(this)
    this.handleScheduler = this.handleScheduler.bind(this)
    this.handleCheckbox = this.handleCheckbox.bind(this)
    this.formValidation = this.formValidation.bind(this)
    this.handleSubjectAndBody = this.handleSubjectAndBody.bind(this)
  }

  // Inputs handlers START 
  handleSubjectAndBody(name, text) {
    console.log(name, text)
    this.setState({
      [name]: {text: text, error: false}
    })
  }

  handleCheckbox(e) {
    this.setState({
      schedule: !this.state.schedule
    })
  }

  handleScheduler(e) {
    console.log(e)
    this.setState({
      scheduledTime: {date: e, error: false}
    })
  }

  removeEmail(index) {
    this.setState({
      to: (this.state.to.filter(element => element.id !== index))
    })
  }

  handleEmail(updatedValue, index) {
    let to = this.state.to
    var id = to.findIndex(x => x.id === index)
    to[id] = {id: index, email: updatedValue, error: false}

    this.setState({ to })
  }

  handleAddEmails () {
    this.setState({
      to: [
        ...this.state.to,
        {id: generate(), email: '', error: false}
      ]
    })
  }

  handleFileChange = (ev) => {
    if(ev.target.files && ev.target.files.length > 0) {
        this.setState({
          success: false, 
          fileName: ev.target.files[0].name.split('.')[0],
          fileType: ev.target.files[0].name.split('.')[1],
          file: ev.target.files[0],
          fileSize: ev.target.files[0].size
          });
    }
  }
  handleUpload = (ev) => {
    
    if(this.formValidation()) {
        
        this.setState({
          sending: true
        })
        
        axios.post("http://localhost:3001/sign_s3",{
          fileName : this.state.fileName,
          fileType : this.state.fileType,
          to: this.transformToArray(this.state.to),
          subject: this.state.subject.text,
          body:this.state.body.text,
          schedule: this.state.schedule,
          scheduledTime: this.state.scheduledTime.date
        })
        .then(response => {
          var returnData = response.data.data.returnData;
          var signedRequest = returnData.signedRequest;
          var url = returnData.url;
          this.setState({url: url})
          console.log("Recieved a signed request " + signedRequest);
    
          var options = {
            headers: {
              'Content-Type': this.state.fileType
            }
          };
          axios.put(signedRequest, this.state.file, options)
          .then(result => {
            console.log("Response from s3")
            this.setState({success: true, sending: false});
          })
          .catch(error => {
            alert("ERROR " + JSON.stringify(error));
            this.setState({sending: false})
          })
        })
        .catch(error => {
          alert(JSON.stringify(error));
          this.setState({sending: false})
        })
    }
    
  }
  // Input Handlers END

  // Utils
  transformToArray(array) {
    var newArray = []

    array.map(to => newArray.push(to.email))

    return newArray
  }
  

  // Validator
  formValidation () {
    var testEmail =    /^[ ]*([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})[ ]*$/i;
    var valid = true

    var to = this.state.to
    for(var i=0; i<to.length; i++) {
      if(!testEmail.test(to[i].email)) {
        to[i].error = 'Invalid email'
        valid = false
      }
    }

    var subject = this.state.subject
    if(!subject || !subject.text || subject.text.length === 0) {
      subject.error = 'Add subject to the email'
      valid = false
    }
    var body = this.state.body
    if(!body || !body.text || body.text.length === 0) {
      body.error = 'Add body to the email'
      valid = false
    }
    var scheduledTime = this.state.scheduledTime
    if(this.state.schedule ) {
        if(isNaN(scheduledTime.date) && !isNaN(Date.parse(scheduledTime.date))) {
          scheduledTime.error = 'This is not a valid Date'
          valid = false
        }
    }
    var fileError = ''
    if(!this.state.fileName || !this.state.fileType || this.state.fileName.length === 0 || this.state.fileType.length === 0) {
      valid = false
      fileError = 'You need to add a file'
    }
    if(this.state.fileSize > 10000000) {
      valid = false
      fileError = "SES allows max 10MB attached files"
    }
    this.setState({
      to,
      subject, 
      body,
      scheduledTime,
      fileError
    })

    return valid

  }

  render() {
    
    return (
      <div className="App" >
        <Card style={{ width: '25rem', }}>
          
        <Card.Body>
        <Card.Title>Cloud Zies - Test</Card.Title>
        { !this.state.success && !this.state.sending && (
          <Form >
            <Form.Group controlId="formBasicEmail">
              <Form.Label>Email addresses to send</Form.Label>
              {this.state.to.map((email) => {
                return (
                  <InputGroup key={email.id} className="mb-3">
                    <Form.Control  type="email" placeholder="Enter email" value={email.email} 
                    onChange={(e) => this.handleEmail(e.target.value, email.id)} isInvalid={email.error}/>
                    <InputGroup.Append>
                      <Button variant="outline-secondary" onClick={() => this.removeEmail(email.id)}>X</Button>
                    </InputGroup.Append>
                    <Form.Control.Feedback type="invalid">
                        {email.error}
                    </Form.Control.Feedback>
                  </InputGroup>
                )
              })}
              
              
            </Form.Group>
            <Form.Group >
            <Button variant="secondary" size="sm" onClick={this.handleAddEmails}>
                Add more email addresses
              </Button>
            </Form.Group>

            <Form.Group controlId="formBasicSubject">
              <Form.Label>Subject</Form.Label>
              <Form.Control type="text" placeholder="Add subject to the email" 
                            value={this.state.subject.text}
                            name="subject"
                            onChange={(e) => this.handleSubjectAndBody(e.target.name, e.target.value)}
                            isInvalid={this.state.subject.error}/>
              <Form.Control.Feedback type="invalid">
                  {this.state.subject.error}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formBasicBody">
              <Form.Label>Body</Form.Label>
              <Form.Control type="text" placeholder="Add body to the email"
                            as="textarea" rows="3"
                            value={this.state.body.text}
                            name="body"
                            onChange={(e) => this.handleSubjectAndBody(e.target.name, e.target.value)}
                            isInvalid={this.state.body.error}/>
              <Form.Control.Feedback type="invalid">
                  {this.state.body.error}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formBasicCheckboxScheduleEmail">
              <Form.Check type="checkbox" label="Schedule the email" onChange={this.handleCheckbox}/>
            </Form.Group>
            { this.state.schedule && (
              <Form.Group >
                <DatePicker
                selected={this.state.scheduledTime.date}
                onChange={date => this.handleScheduler(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
              />
              <Form.Control.Feedback type="invalid">
                  {this.state.scheduledTime.error}
              </Form.Control.Feedback>  
            </Form.Group>
            )}
            
            <Form.Group controlId="formBasicBody">
              <Form.Label>File to Attach</Form.Label>
              <Form.Control onChange={this.handleFileChange} value={this.state.uploadFile} ref={(ref) => { this.uploadInput = ref; }} type="file" isInvalid={this.state.fileError}/>
              <Form.Control.Feedback type="invalid">
                  {this.state.fileError}
              </Form.Control.Feedback>  
            </Form.Group>
            <Button variant="primary" onClick={this.handleUpload}>
              Submit
            </Button>
          </Form>
        )}
        { this.state.success && !this.state.sending &&(
          <div>
            <Alert variant='success'>
              Emails sent successfully!
            </Alert>
            <Button onClick={() => { window.location.reload() }}>Send more Emails</Button>
          </div>
        )}
        { this.state.sending &&(
          <div>
            <Alert variant='info'>
              Sending to AWS ...
            </Alert>
            
          </div>
        )}
        
        </Card.Body>
        </Card>
        
      </div>
    );
  }
}

export default App;
