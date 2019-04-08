var pushApp = {
    statusData : [],
    registrationId: "",
    addStatus: function(text){
        this.statusData.push(text);
    },

    setupPush: function(consoleLog) {
        this.statusData = consoleLog;
        pushApp.addStatus("Calling push init"); 
        var push = PushNotification.init({
            "android": {
                "senderID": "XXXXXXXX"
            },
            "browser": {},
            "ios": {
                "sound": true,
                "vibration": true,
                "badge": true
            },
            "windows": {}
        });
        pushApp.addStatus("After Push Init"); 

        push.on('registration', function(data) {
            pushApp.addStatus('registration done');
            pushApp.registrationId = data.registrationId;
            var oldRegId = localStorage.getItem('registrationId');
            if (oldRegId !== data.registrationId) {
                pushApp.addStatus('registration id changed');
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your pushApp server as the value has changed
            }
        });

        push.on('error', function(e) {
            pushApp.addStatus("Push error = " + e.message); 
        });

        push.on('notification', function(data) {
            pushApp.addStatus("Notification received"); 
            navigator.notification.alert(
                data.message,         // message
                null,                 // callback
                data.title,           // title
                'Ok'                  // buttonName
            );
       });
    }
};