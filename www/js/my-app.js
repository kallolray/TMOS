// Initialize app
var app = new Framework7({
    theme : 'ios',
    panel: {
        swipe: 'left',
      },
    name: 'TMOS',
    id: 'com.app.test',
});

var host = 'http://localhost:62029';
//var host = 'http://tilhdev02/tmosdata';
var mcList = {};

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = app.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
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
            var tbl = "";
            for(let i=0; i < data.length; ++i){
                if(i%2 == 0) 
                    tbl += '<tr style="height:30%">';
                tbl += `<td id='mc${i}' style="width:50%">${data[i]}<br><span id='dtl${i}'></span></td>`;
                if(i%2 == 1)
                    tbl +='</tr>';
                mcList[data[i]] = i;
            }
            $$('#mcList').append($$(tbl));
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
            for(let i=0; i < data.length; ++i){
                var x = mcList[data[i].LINE];
                $$('#mc'+x).css('background-color', 'red');
                $$('#dtl'+x).text(`${data[i].MC},${data[i].TIME}`);
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