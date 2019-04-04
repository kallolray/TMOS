// Initialize app
var app = new Framework7({
    theme : 'ios',
    panel: {
        swipe: 'left',
      },
    name: 'TMOS',
    id: 'com.app.test',
    lazyModulesPath: 'www/lib/framework7/components',
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
        closeTimeout: 2000,
    },
    statusbar: {
        iosOverlaysWebView: false,
        overlay : false,
    },
    on: {
        pageAfterIn: function(e, page) {
            // do something after page gets into the view
            curPage = e.name;
            switch(curPage){
                case 'andon':
                    getlineList();
                    break;
                case 'hourprod':
                    getMC4PCCount();
                    $$('.mc4pc-count').on('click', function () {
                        mcListActionSheet.open();
                    });
                    break;
            }
        },
        pageInit: function (e, page) {
          // do something when page initialized
        },
      },
});


//var host = 'http://localhost:62029';
var host = 'http://tilhdev02/tmosdata';
var lineList = {};
var mcListActionSheet;
var curTag = {};
var curPage;

var toastUpdComplete = app.toast.create({
    text: 'Data Updated',
    closeTimeout: 2000,
});

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
app.views.create('.view-main',{url:'/andon/'});

document.addEventListener("deviceready", 
    function(){
        document.addEventListener("resume", refreshPage, false);
    }, false);

function refreshPage(){
    switch (curPage){
        case 'andon':
            if(Object.keys(lineList).length == 0) getlineList();
            else updateAndon();
            break;
        case 'hourprod':
            getPCCount(curTag);
            break;
    }
}

$$(document).on('page:init', function (e, page) {
    return;
    curPage = page.name;
    switch(curPage){
        case 'andon':
            getlineList();
            break;
        case 'hourprod':
            getMC4PCCount();
            $$('.mc4pc-count').on('click', function () {
                mcListActionSheet.open();
            });
            break;
    }
});

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
            var tbl = $$('#pccount');
            tbl.empty();
            for(let i=0; i < data.length; ++i){
                var dt = moment(data[i].TAGHR).format('h a');
                tbl.append($$(`<tr><td class="label-cell">${dt}</td>
                    <td class="numeric-cell"></td>
                    <td class="numeric-cell">${data[i].N}</td></tr>`));
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