var should = require('chai').should(),
expect = require('chai').expect,
supertest = require('supertest'),
PropertiesReader = require('properties-reader/src/PropertiesReader');

var tools   = require('./utils');
util = require('util');
var config = PropertiesReader('./config.properties');

var jsonfile = require('jsonfile')
var file = './messages.json'

var messages;
messages = jsonfile.readFileSync(file);

console.dir("URI = " +tools.applicationURL("ms_DemoPort"));
demo_api    = supertest(tools.applicationURL("ms_DemoPort"));
pa_api = supertest(tools.applicationURL("ms_PersonalAccountPort"));
s_api  = supertest(tools.applicationURL("ms_SummaryPort"));
ip_api = supertest(tools.applicationURL("ms_InvestProfilingPort"));

// TO ADD - some work comments
// TO DO - all messages to messages.json file
var Cookies;
var AuthToken;
var PFP_ID;
var TemplateID;

describe.skip('Advisor Demo logon', function () {

    it('should return a 200 response => successful logon', function (done) {
        demo_api.get(util.format('/api/rest/advisors/demo/check?email=%s', config.get("activeAdvisor_1")))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("advisorId");
                expect(res.body.advisorId).to.not.equal(null);
                done();
            });
    });

    it('should return a 400 response => wrong required param name', function (done) {
        demo_api.get(util.format('/api/rest/advisors/demo/check?mail=%s', config.get("activeAdvisor_1")))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, res) {
                expect(res.body.error.code).to.equal(400);
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('failure');
                expect(res.body.error.message).to.equal("Required String parameter 'email' is not present");
                expect(res.body.error).to.have.property("timestamp");
                expect(res.body.error.timestamp).not.to.equal(null);
                done();
            });
    });

    it('should return a 400 response => missing required param "email"', function (done) {
        demo_api.get('/api/rest/advisors/demo/check')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, res) {
                expect(res.body.error.code).to.equal(400);
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('failure');
                expect(res.body.error.message).to.equal("Required String parameter 'email' is not present");
                expect(res.body.error).to.have.property("timestamp");
                expect(res.body.error.timestamp).not.to.equal(null);
                done();
            });
    });

    it('should return a 2000 response => several users in *** with specified email', function (done) {
        demo_api.get(util.format('/api/rest/advisors/demo/check?email=%s', config.get("multipleAdvisors")))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body.error.code).to.equal(2000);
                if (err) console.dir("REG is an error!!!");
                //console.dir("OUTPUT=" + err.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('failure');
                //expect(res.body.error.message).to.equal("С указанным e-mail найдено больше одного пользователя в ***");
                expect(res.body.error.message).to.equal(messages.msg_UserNotFound);
                expect(res.body.error).to.have.property("timestamp");
                expect(res.body.error.timestamp).not.to.equal(null);
                done();
            });
    });

    it('should return a 2000 response => specified user is inactive in ***', function (done) {
        demo_api.get(util.format('/api/rest/advisors/demo/check?email=%s', config.get("inactiveAdvisor")))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body.error.code).to.equal(2000);
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('failure');
                //expect(res.body.error.message).to.equal("С указанным e-mail не найден пользователь в ***");
                expect(res.body.error.message).to.equal("Не найден Пользователь удовлетворяющий условиям поиска");
                expect(res.body.error).to.have.property("timestamp");
                expect(res.body.error.timestamp).not.to.equal(null);
                done();
            });
    });

    /*specified user email doesn't contain *** in domain part*/ 
    it('should return a 2000 response => specified user is non company employee', function (done) {
        demo_api.get('/api/rest/advisors/demo/check?email=test@wrongdomain.ru')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(2000)
            .end(function (err, res) {
                expect(res.body.error.code).to.equal(2000);
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('failure');
                //expect(res.body.error.message).to.equal("Ошибка поиска советника (cообщение от ***)");
                expect(res.body.error.message).to.equal("Не найден Пользователь удовлетворяющий условиям поиска");
                expect(res.body.error).to.have.property("timestamp");
                expect(res.body.error.timestamp).not.to.equal(null);
                done();
            });
    });
});

describe('Register New Client', function(){
    var clientPhone = tools.randomPhoneNumber();
    console.dir('New Client Phone is ' + clientPhone);
    it('should return a 200 response => first step, cell input', function (done) {
        pa_api.post('/api/rest/clients/auth/sendSMS')
            .set('Accept', 'application/json')
            .send({
                 phone: clientPhone,
                 template: 1
             })  
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                Cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });
    
    it('should return a 200 response => valid sms-code sent', function (done) {
        pa_api.get(util.format('/api/rest/clients/auth/checkSMS?otp=%s', tools.randomSMSCode()))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                done();
            });
    });
    
    it('should return a 200 response => check client status in ***', function (done) {
        pa_api.get('/api/rest/clients/reg/checkStatus')
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                //console.dir("ERROR=" + res.body.error.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("data");
                expect(res.body.data).to.have.property("status");
                expect(res.body.data.status).to.equal('new');
                done();
            });
    });
    
    it('should return a 200 response => client registration', function (done) {
        var fName = tools.randomString(false);
        var mName = tools.randomString(false);
        var lName = tools.randomString(false);
        console.dir(util.format("Client Name is: lastName %s, midName %s, firstName %s", lName, mName, fName));
        pa_api.post('/api/rest/clients/reg')
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .send({
                email       :	tools.randomEmail(),
                firstName   :	fName,
                lastName    :	mName,
                middleName  :	lName,
                phone       :	clientPhone
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) console.dir("REG is an error!!!");
                //console.dir("OUTPUT=" + err.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body.data).to.have.property("tokenFront");
                AuthToken = res.body.data.tokenFront;
                PFP_ID = res.body.data.pfpId;
                console.dir('Client pfpid = ' + PFP_ID);
                expect(res.body.data.pfpId).not.to.equal(null);
                done();
            });
    });
    
    it('should return a 200 response => get summary', function (done) {
        s_api.get(util.format('/api/rest/clients/summary?pfpid=%s&language=%s', PFP_ID, config.get('language')))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .set('Authorization',  util.format('Bearer %s', AuthToken))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                //if (err) console.dir("HERE is an error!!!");
                //console.dir("OUTPUT=" + err.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("clientName");
                expect(res.body.clientName).not.to.equal(null);
                expect(res.body).to.have.property("stages");
                expect(res.body.stages).to.be.an('array');
                expect(res.body.stages).to.have.lengthOf(4); 
                done();
            });
    });
    
    it('should return a 200 response => get questionary', function (done) {
        ip_api.get(util.format('/api/rest/clients/investProfiling/getQuestionary?language=%s', config.get('language')))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .set('Authorization',  util.format('Bearer %s', AuthToken))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) console.dir("HERE is an error!!!");
                expect(res.body).to.have.property("questionary");
                expect(res.body.businessResult).to.equal("success");
                expect(res.body.questionary.template_id).not.to.equal(null);
                TemplateID = res.body.questionary.template_id;
                //console.dir('TEMPLATE '+ TemplateID);
                expect(res.body.questionary.questions).to.be.an('array');
                expect(res.body.questionary.questions).to.have.lengthOf(12); 
                done();
            });
    });
    
    it('should return a 200 response => calculate client profile', function (done) {
        ip_api.post(util.format('/api/rest/clients/investProfiling/calculateProfile?language=%s', config.get('language')))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .send({
                "pfp_id": PFP_ID,
                "questionary":{
                   "templateid":TemplateID,
                   "questions":[
                      {
                        "number":"1",
                         "answers":[
                            {"number":"1"}
                         ],
                        "number":"2",
                        "answers":[
                            {"number":"1"}
                         ],
                        "number":"3",
                         "answers":[
                            {"number":"1"}
                          ],
                        "number":"4",
                          "answers":[
                            {"number":"1"}
                           ],
                        "number":"5",
                           "answers":[
                            {"number":"1"}
                            ],
                        "number":"6",
                            "answers":[
                            {"number":"1"}
                             ],
                        "number":"7",
                            "answers":[
                            {"number":"1"}
                              ],
                        "number":"8",
                            "answers":[
                            {"number":"1"}
                               ],
                        "number":"9",
                            "answers":[
                            {"number":"1"}
                                ],
                        "number":"10",
                            "answers":[
                            {"number":"1"}
                                 ],
                        "number":"11",
                            "answers":[
                            {"number":"1"}
                                  ],
                        "number":"12",
                            "answers":[
                            {"number":"1"}
                                   ]
                        }]
                }})
            .set('Authorization',  util.format('Bearer %s', AuthToken))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) console.dir("HERE is an error!!!");
                //console.dir(err.message)
                expect(res.body.businessResult).to.equal("success");
                expect(res.body).to.have.property("questionary_id");
                expect(res.body.questionary_id).not.to.equal(null);
                expect(res.body.profiles).to.be.an('array');
                expect(res.body.profiles).to.have.lengthOf(1); 
    
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                done();
            });
    });

    // logon as just created Client and get Prospective status

    it('should return a 200 response => first step, cell input', function (done) {
        pa_api.post('/api/rest/clients/auth/sendSMS')
            .set('Accept', 'application/json')
            .send({
                 phone: clientPhone,
                 template: 1
             })  
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                Cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });
    
    it('should return a 200 response => valid sms-code sent', function (done) {
        pa_api.get(util.format('/api/rest/clients/auth/checkSMS?otp=%s', tools.randomSMSCode()))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                done();
            });
    });
    
    it('should return a 200 response => check client status in ***', function (done) {
        pa_api.get('/api/rest/clients/reg/checkStatus')
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("data");
                expect(res.body.data).to.have.property("status");
                expect(res.body.data.status).to.equal('prospective');

                expect(res.body.data).to.have.property("tokenFront");
                expect(res.body.data.pfpId).to.equal(PFP_ID);
                
                done();
            });
    });
    
});

describe.skip('Register Prospective Client', function(){
    var clientPhone = config.get('prospectiveClientCell_1');
    console.dir('Prospective Client Phone is ' + clientPhone);
    it('should return a 200 response => first step, cell input', function (done) {
        pa_api.post('/api/rest/clients/auth/sendSMS')
            .set('Accept', 'application/json')
            .send({
                 phone: clientPhone,
                 template: 1
             })  
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                Cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });
    
    it('should return a 200 response => valid sms-code sent', function (done) {
        pa_api.get(util.format('/api/rest/clients/auth/checkSMS?otp=%s', tools.randomSMSCode()))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                done();
            });
    });
    
    it('should return a 200 response => check client status in ***', function (done) {
        pa_api.get('/api/rest/clients/reg/checkStatus')
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) console.dir("ERROR ")
                //console.dir("ERROR=" + res.body.error.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("data");
                expect(res.body.data).to.have.property("status");
                expect(res.body.data.status).to.equal('prospective');
                expect(res.body.data).to.have.property("tokenFront");
                AuthToken = res.body.data.tokenFront;
                expect(res.body.data).to.have.property("pfpId");
                PFP_ID = res.body.data.pfpId;
                done();
            });
    });
        
    it('should return a 200 response => get summary', function (done) {
        s_api.get(util.format('/api/rest/clients/summary?pfpid=%s&language=%s', PFP_ID, config.get('language')))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .set('Authorization',  util.format('Bearer %s', AuthToken))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                //if (err) console.dir("HERE is an error!!!");
                //console.dir("OUTPUT=" + err.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("clientName");
                expect(res.body.clientName).to.equal(config.get('prospectiveClient1_fName'));
                expect(res.body).to.have.property("stages");
                expect(res.body.stages).to.be.an('array');
                expect(res.body.stages).to.have.lengthOf(4); 
                done();
            });
    });
});

describe.skip('Register Active Client', function(){
    var clientPhone = config.get('activeClientCell_1');
    console.dir('Active Client Phone is ' + clientPhone);
    it('should return a 200 response => first step, cell input', function (done) {
        pa_api.post('/api/rest/clients/auth/sendSMS')
            .set('Accept', 'application/json')
            .send({
                 phone: clientPhone,
                 template: 1
             })  
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                Cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });
    
    it('should return a 200 response => valid sms-code sent', function (done) {
        pa_api.get(util.format('/api/rest/clients/auth/checkSMS?otp=%s', tools.randomSMSCode()))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                done();
            });
    });
    
    it('should return a 200 response => check client status in ***', function (done) {
        pa_api.get('/api/rest/clients/reg/checkStatus')
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) console.dir("ERROR ")
                //console.dir("ERROR=" + res.body.error.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("data");
                expect(res.body.data).to.have.property("status");
                expect(res.body.data.status).to.equal('active');
                done();
            });
    });
        
    it.skip('should return a 200 response => get summary', function (done) {
        s_api.get(util.format('/api/rest/clients/summary?pfpid=%s&language=%s', PFP_ID, config.get('language')))
            .set('Accept', 'application/json')
            .set('Cookie', [Cookies])
            .set('Authorization',  util.format('Bearer %s', AuthToken))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                //if (err) console.dir("HERE is an error!!!");
                //console.dir("OUTPUT=" + err.message)
                expect(res.body).to.have.property("businessResult");
                expect(res.body.businessResult).to.equal('success');
                expect(res.body).to.have.property("clientName");
                expect(res.body.clientName).to.equal(config.get('prospectiveClient1_fName'));
                expect(res.body).to.have.property("stages");
                expect(res.body.stages).to.be.an('array');
                expect(res.body.stages).to.have.lengthOf(4); 
                done();
            });
    });
});