// Initialize app
var app = new Framework7({
    theme : 'ios',
    panel: {
        swipe: 'left',
      },
    name: 'TMOS',
    id: 'com.app.test',
});

//var host = 'http://localhost:62029';
var host = 'http://tilhdev02/tmosdata';
var mcList = {};

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = app.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});
// Pull to refresh content
var $ptrContent = $$('.ptr-content');
$ptrContent.on('ptr:refresh', function (e) {
    updateAndon();
    // When loading done, we need to reset it
    app.ptr.done(); // or e.detail();
});
// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    //$$('#msg').text('Device Ready, making Ajax Request');
    getMCList();
});

function getMCList(){
    $$.ajax({
        url: host + '/api/plc/mclist',
        cache: false,
        dataType: 'json',
        type: 'GET',
        crossOrigin: true,
        success: function(data){
            for(let i=0; i < data.length; ++i){
                mcList[data[i]] = i;
                $$('#name'+i).text(data[i]);
            }
            updateAndon();
        },
        error: function(error){
            app.alert("Error");
          $$('#msg').text("Error : " + error);
        }
    });    
}

function updateAndon(){
    $$.ajax({
        url: host + '/api/plc/activeandon',
        cache: false,
        dataType: 'json',
        type: 'GET',
        crossOrigin: true,
        success: function(data){
            for(i=0; i < 6; ++i){
                $$('#mc'+i).removeClass('andon-Red').addClass('andon-OK');
                $$('#dtl'+i).html('');
            }
            for(let i=0; i < data.length; ++i){
                var x = mcList[data[i].LINE];
                var dt = moment(data[i].TIME).format('d-MMM h:ma');
                $$('#mc'+x).removeClass('andon-OK').addClass('andon-Red');
                $$('#dtl'+x).append(`${data[i].MC}, ${dt}<br>`);
            }
        },
        error: function(error){
            app.alert("Error");
          $$('#msg').text("Error : " + error);
        }
    });    
}
// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
app.onPageInit('about', function (page) {
    // Do something here for "about" page
    app.alert('Here comes About page');
});

/*
// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;

    if (page.name === 'about') {
        // Following code will be executed for page with data-page attribute equal to "about"
        app.alert('Here comes About page');
    }
})

// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="about"]', function (e) {
    // Following code will be executed for page with data-page attribute equal to "about"
    app.alert('Here comes About page');
})
*/