// Initialize app
//var host = 'http://localhost:62029';
var host = 'http://tilhdev02/tmosdata';
var lineList = {};
var mcListActionSheet = null;
var curTag = {};
var curPage;

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
      ],
    toast: {
        closeTimeout: 500,
    },
    statusbar: {
        iosOverlaysWebView: false,
        overlay : false,
    },
    on: {
        init: function(e, page) {
            document.addEventListener("resume", refreshPage, false);
            screen.orientation.lock('landscape');
        },
        pageInit: function (e, page) {
          // do something when page initialized
            curPage = e.name;
            refreshPage();
        },
      },
});

var toastUpdComplete = app.toast.create({
    text: 'Data Updated',
    closeTimeout: 2000,
});

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

/*document.addEventListener("deviceready", 
    function(){
        
    }, false);*/
    
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
    }
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
            app.dialog.alert("Error - " + status);
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
                var dt = moment(data[i].TIME).format('d-MMM h:ma');
                $$('#mc'+x).removeClass('andon-OK').addClass('andon-Red');
                $$('#dtl'+x).append(`${data[i].MC}, ${dt}<br>`);
            }
            $$('#lastUpdAndon').text(moment().format('d-MMM h:mm:ssa'));
            toastUpdComplete.open();
        },
        error: function(error,status){
            app.dialog.alert("Error - " + status);
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
            app.dialog.alert("Error - " + status);
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
            for(let i = 0; i < shiftNames.length; ++i){
                $$('#shiftName-' + i).text(shiftNames[i]);
                var tr = "";
                for(const shiftData of data[shiftNames[i]]){
                    var dt = moment(shiftData.HR).format('h a');
                    var act = moment(shiftData.HR) >= new Date? "NA" : shiftData.A;
                    var cls = "";
                    if(act != "NA")
                        cls = `class="${act >= shiftData.T?"prod-OK":"prod-nOK"}"`;
                    
                    tr += `<tr><td class="text-align-center">${dt}</td>
                    <td class="text-align-right">
                    ${shiftData.T} / <span ${cls}>${act}</span></td></tr>`;
                }
                $$('#shiftData-'+i).html(tr);
            }
            $$('#lastUpHourProd').text(moment().format('d-MMM h:mm:ssa'));
            toastUpdComplete.open();
        },
        error: function(error,status){
            app.dialog.alert("Error - " + status);
        },
        complete: function(){
            app.preloader.hide();
        }
    });
}