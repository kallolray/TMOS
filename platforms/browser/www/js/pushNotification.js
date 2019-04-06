var pushApp = {
    statusData : "",
    registrationId: "",
    addStatus: function(text){
        this.statusData += (text + "<br>");
    },

    setupPush: function() {
        console.log('calling push init');
        pushApp.addStatus("calling push init"); 
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
        console.log('after init');
        pushApp.addStatus("After Init"); 

        push.on('registration', function(data) {
            console.log('registration event: ' + data.registrationId);
            pushApp.addStatus('registration event: ' + data.registrationId);
            pushApp.registrationId = registrationId;
            var oldRegId = localStorage.getItem('registrationId');
            if (oldRegId !== data.registrationId) {
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your pushApp server as the value has changed
            }
        });

        push.on('error', function(e) {
            console.log("push error = " + e.message);
            pushApp.addStatus("push error = " + e.message); 
        });

        push.on('notification', function(data) {
            console.log('notification event');
            pushApp.addStatus("notification event"); 
            navigator.notification.alert(
                data.message,         // message
                null,                 // callback
                data.title,           // title
                'Ok'                  // buttonName
            );
       });
    }
};