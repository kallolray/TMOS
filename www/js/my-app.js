// Initialize app
var app = new Framework7({
    theme : 'ios',
    panel: {
        swipe: 'left',
      },
    name: 'TMOS',
    id: 'com.app.test',
});


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = app.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    $$('#msg').text('Device Ready, making Ajax Request');
    $$.ajax({
        url: 'http://tilhdev02/tmos/plcdata.asmx/getMCList',
        data: { tagType:'P' },
        cache: false,
        dataType: 'json',
        type: 'POST',
        success: function(r_data){
            $$('#msg').text(r_data);
            app.alert("Got data back");
            },
        error: function(error){
          console.log(error);
          $$('#msg').text("Error : " + error);
        }
  });    
});


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