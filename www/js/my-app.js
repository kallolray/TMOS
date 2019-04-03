// Initialize app
var app = new Framework7({
    theme : 'ios',
    panel: {
        swipe: 'left',
      },
    name: 'TMOS',
    id: 'com.app.test',
    lazyModulesPath: 'www/lib/framework7/components',
});


//var host = 'http://localhost:62029';
var host = 'http://tilhdev02/tmosdata';
var mcList = {};

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
app.views.create('.view-main');

// Pull to refresh content
var $ptrContent = $$('.ptr-content');
$ptrContent.on('ptr:refresh', function (e) {
    updateAndon();
    // When loading done, we need to reset it
    app.ptr.done(); // or e.detail();
});

getMCList();

function getMCList(){
    app.preloader.show('gray');
    app.request({
        url: host + '/api/plc/mclist',
        dataType:'json',
        crossDomain:true,
        cache:false,
        method:'GET',
        success: function(data){
            for(let i=0; i < data.length; ++i){
                mcList[data[i]] = i;
                $$('#name'+i).text(data[i]);
            }
            app.preloader.hide();
            updateAndon();
        },
        error: function(error){
            app.alert("Error");
          $$('#msg').text("Error : " + error);
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
                var x = mcList[data[i].LINE];
                var dt = moment(data[i].TIME).format('d-MMM h:ma');
                $$('#mc'+x).removeClass('andon-OK').addClass('andon-Red');
                $$('#dtl'+x).append(`${data[i].MC}, ${dt}<br>`);
            }
            app.preloader.hide();
        },
        error: function(error){
            app.alert("Error");
          $$('#msg').text("Error : " + error);
        }
    });    
}
