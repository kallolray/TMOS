// Initialize app
// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var isMobile = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
//var host = 'http://localhost:62029';
var host = 'http://tilhdev02/tmosdata';
if(isMobile) host = 'http://tilhdev02/tmosdata';
var lineList = {};
var mcListActionSheet = null;
var curTag = {};
var curPage;
var userData = null;
var consoleLog = [];

var app = new Framework7({
    theme : 'ios',
    panel: {
        swipe: 'left',
      },
    name: 'TMOS',
    id: 'com.timken.rayk.tmos',
    routes: [
        {
            name: 'andon',
            path: '/andon/',
            url: 'andon.html',
        },
        {
            name: 'hourprod',
            path: '/hourprod/',
            url: 'hourprod.html',
        },
        {
            name: 'log',
            path: '/log/',
            url: 'log.html',
        },
        {
            name: 'settings',
            path: '/settings/',
            url: 'settings.html',
        },
      ],
    toast: {
        closeTimeout: 1000,
    },
    statusbar: {
        iosOverlaysWebView: false,
        overlay : false,
    },
    on: {
        init: function(e, page) {
            document.addEventListener("resume", refreshPage, false);
            //screen.orientation.lock('landscape');
            //if(isMobile) pushApp.setupPush();
        },
        pageInit: function (e, page) {
          // do something when page initialized
            curPage = e.name;
            if(curPage == 'settings'){
                 app.panel.disableSwipe('left');
                 changeOrientation('portrait');
            }
            else{
                 app.panel.enableSwipe('left');
                 changeOrientation('landscape');
            }
            refreshPage();
        },
      },
});

if(Locstor.contains("userData"))
{
    userData = Locstor.get("userData");
    $$("#userName").text("Hi " + userData.userName);
}

var view = app.views.create('.view-main',{iosSwipeBack:false, 
    url: (Locstor.contains("userData")? userData.startWith || "/andon/" : "/settings/")});



var toastUpdComplete = app.toast.create({
    text: 'Data Updated',
});

document.addEventListener("deviceready", 
    () => 
    {
        if(isMobile){
            pushApp.setupPush(consoleLog);
        }
    }, false);
    
function refreshPage(){
    switch (curPage){
        case 'andon':
            if(Object.keys(lineList).length == 0) getlineList();
            else updateAndon();
            break;
        case 'hourprod':
            if(mcListActionSheet == null) getMC4PCCount();
            else getPCCount(curTag);
            break;
        case 'log':
            showLog();
            break;
        case 'settings':
            if(userData != null){
                app.form.fillFromData('#settings-form', userData);
                $$('#miscData').html(`Last Updated On: ${userData.lastUpdated}<br>\
                    Platform: ${device.platform} on ${device.model}<br>\
                    Notification ID: ${userData.notificationID || pushApp.registrationId}`);
            }else{
                $$("#settingsCancel").hide();
            }
            break;
    }
}

function changeOrientation(orient){
    //app.dialog.alert(screen.orientation.type);
    if(!screen.orientation.type.startsWith(orient)){
        screen.orientation.unlock();
        screen.orientation.lock(orient);
    }
}

function showLog(){
    $$("#regID").val(pushApp.registrationId);
    $$("#logData").html(consoleLog.join("<br>"));
    $$("#lastUpdLog").text(moment().format('D-MMM h:mm:ssa'));
}

function getlineList(){
    app.preloader.show('gray');
    app.request({
        url: host + '/api/plc/AndonLines',
        dataType:'json',
        crossDomain:true,
        cache:false,
        method:'GET',
        success: function(data){
            for(let i=0; i < data.length; ++i){
                lineList[data[i]] = i;
                $$('#name'+i).text(data[i]);
            }
            app.preloader.hide();
            updateAndon();
        },
        error: function(error,status){
            app.preloader.hide();
            showDBError(error);
        }
    });
}

function updateAndon(){
    app.preloader.show('blue');
    app.request({
        url: host + '/api/plc/activeandon',
        dataType:'json',
        crossDomain:true,
        cache:false,
        method:'GET',
        success: function(data){
            Object.entries(lineList).forEach(
                ([key, value]) => $$('#name'+value).text(key)
            );
            for(i=0; i < 6; ++i){
                $$('#mc'+i).removeClass('andon-Red').addClass('andon-OK');
                $$('#dtl'+i).html('');
            }
            for(let i=0; i < data.length; ++i){
                var x = lineList[data[i].LINE];
                var dt = moment(data[i].TIME).format('D-MMM h:mma');
                $$('#mc'+x).removeClass('andon-OK').addClass('andon-Red');
                $$('#dtl'+x).append(`${data[i].MC}, ${data[i].ADESC}, ${dt}<br>`);
            }
            $$('#lastUpdAndon').text(moment().format('D-MMM h:mm:ssa'));
            //toastUpdComplete.open();
        },
        error: function(error){
            showDBError(error);
        },
        complete: function(){
            app.preloader.hide();
        }
    });    
}

function getMC4PCCount(){
    app.preloader.show('gray');
    var mcListButtons = [];
    app.request({
        url: host + '/api/plc/MC4PCCount',
        dataType:'json',
        crossDomain:true,
        cache:false,
        method:'GET',
        success: function(data){
            for(let i=0; i < data.length; ++i){
                mcListButtons.push(
                    {
                        text:data[i].MCNAME,
                        onClick: function () {
                            getPCCount({ID:data[i].TAGID, Name:data[i].MCNAME});
                        },
                    });
            }
            mcListActionSheet = app.actions.create({buttons:mcListButtons});
            app.preloader.hide();
            mcListActionSheet.open();
        },
        error: function(error,status){
            showDBError(error);
        },
        complete: function(){
            app.preloader.hide();
        }
    });
}

function getPCCount(tag){
    app.preloader.show('gray');
    curTag.ID = tag.ID;
    curTag.Name = tag.Name;
    $$('#titleHourProd').text(curTag.Name);
    app.request({
        url: host + '/api/plc/PCCount/' + tag.ID,
        dataType:'json',
        crossDomain:true,
        cache:false,
        method:'GET',
        success: function(data){
            var shiftNames = Object.keys(data);
            if (shiftNames.length == 0) return;
            var tr = "";
            for(let i = 1; i < shiftNames.length; ++i){
                tr += `<td width=22%>
                    <div class="shiftName">${shiftNames[i]}</div>
                    <table class="shiftTable" cellpadding=3 border=1>
                        <thead><tr>
                                <th class="text-align-center">Hour</th>
                                <th class="text-align-right">Tgt</th>
                                <th class="text-align-right">Act</th>
                        </tr></thead>
                        <tbody>`;
                var sTarget = 0, sActual = 0;
                for(const shiftData of data[shiftNames[i]]){
                    var dt = moment(shiftData.HR).format('h a');
                    var act = "--", cls="";
                    if(moment(shiftData.HR) < new Date){
                        act = shiftData.A;
                        cls = act >= shiftData.T?"prod-OK":"prod-nOK";
                        sTarget += shiftData.T;
                        sActual += act;
                    }
                    
                    tr += `<tr><td class="text-align-center">${dt}</td>
                        <td class="text-align-right">${shiftData.T}</td>
                        <td class="text-align-right ${cls}">${act}</td></tr>`;
                }
                tr += `<tr style="font-weight:bold"><td class="text-align-center">Total</td>
                    <td class="text-align-right">${sTarget}</td>
                    <td class="text-align-right ${(sActual>= sTarget?"prod-OK":"prod-nOK")}">${sActual}</td></tr>
                    </tbody></table></td>`
            }
            $$('#shiftData').html(tr);

            $$('#andonForLine').html(data["ANDON"] || "No Andon");
            if(data["ANDON"] != "") $$('#andonForLine').removeClass('green').addClass('red');
            else $$('#andonForLine').removeClass('red').addClass('green');

            $$('#lastUpHourProd').text(moment().format('D-MMM h:mm:ssa'));
            //toastUpdComplete.open();
        },
        error: function(error,status){
            showDBError(error);
        },
        complete: function(){
            app.preloader.hide();
        }
    });
}
function saveUserData(){
    var oldMobile = userData == null?"":userData.mobile || "";
    userData = app.form.convertToData('#settings-form');
    userData.lastUpdated = moment().format("D-MMM-YY h:mm:ss a");
    userData.notificationID = pushApp.registrationId || '0';
    userData.oldMobile = oldMobile;
    Locstor.set("userData", userData);
    $$("#userName").text("Hi " + userData.userName);
    saveUserData2Server();
    view.router.navigate(userData.startWith || "/andon/");
}

function saveUserData2Server(){
    if(userData == null || userData.userID == null || userData.mobile == null || 
            userData.userName == null || userData.notificationID == null){
        showToast("Not Saved as all Data not provided");
        return;
    }
    app.preloader.show('gray');
    app.request({
        url: host + '/api/plc/UpdMobile',
        dataType:'json',
        crossDomain:true,
        cache:false,
        method:'POST',
        data: {mobileNum: userData.mobile, oldMobileNum: userData.oldMobile, userID:userData.userID, 
            userName:userData.userName, regID:userData.notificationID, 
            NotifyWhenPushed:userData.NotifyWhenPushed.length, NotifyHourlyMiss:userData.NotifyHourlyMiss.length,
            platform: device.platform, model: device.model
        },
        success : (data) =>{
            app.toast.show(data);
        },
        error: (error) =>{
            showDBError(error);
        },
        complete: function(){
            app.preloader.hide();
        }
    });
}

function showDBError(error){
    app.dialog.alert(error.statusText || error.responseText);
}
