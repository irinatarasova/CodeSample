const util = require('util');
PropertiesReader = require('properties-reader/src/PropertiesReader');
var config = PropertiesReader('./config.properties');

module.exports = {
  /*Generates random phoneNumber, allowed symbols [0-9], length 10, starts with 7 always*/
  randomPhoneNumber: function () {
      var text = "";
      var possible = "0123456789";
      
      for (var i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      
      return util.format('7%s', text);
    },
  /*Generates application url with or without port
  param ms_port_name is a name of microservice from config file
  possible values : [ms_DemoPort || ms_PersonalAccountPort || ms_InvestProfilingPort|| ms_SummaryPort]*/
  applicationURL: function(ms_port_name){
    if (ms_port_name.length > 0 && config.get("usePort"))
      return util.format('%s:%s', config.get("baseUrl"), config.get(ms_port_name))
    else return config.get("baseUrl");
    },
    
   /*Generates SMS-code, 6 digits, excluding "123456"  as it's hardcoded on back as invalid sms-code */
  randomSMSCode: function () {
    var text = "";
    var possible = "0123456789";
    var exludeList = ["123456", "111111", "222222"]
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    if (!exludeList.includes(text))
      return text
      else return "654321";
  },

  /*Generates random string for Name, MidName, LastName
  if param  withEpamPrefix = true -> random string contains "COMPANY_test_" prefix for integration test*/
  randomString: function (withEpamPrefix) {
    var text = "";
    var possible = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯабвгдеёжзийклмнопрстуфхцчшщэюя";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return (withEpamPrefix ? util.format('%s_%s', "COMPANY_test", text) : text);
  },

   /*Generates random valid Advisor email with domain part -bcs- */
   randomEmail: function () {
    var localPart = "";
    var domainPart = "";
    var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (var i = 0; i < 5; i++)
      localPart += possible.charAt(Math.floor(Math.random() * possible.length));
    for (var i = 0; i < 2; i++)
    domainPart += possible.charAt(Math.floor(Math.random() * possible.length));
    return util.format('%s@test.%s', localPart, domainPart);
   
  }

  }