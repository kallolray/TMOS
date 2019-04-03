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
          name: 'hourprod',
          path: '/hourprod/',
          url: 'hourprod.html',
        },
        {
            name: 'andon',
            path: '/andon/',
            url: 'andon.html',
        },
      ],
});


//var host = 'http://localhost:62029';
var host = 'http://tilhdev02/tmosdata';
var lineList = {};
var mcListActionSheet;

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
app.views.create('.view-main');
$$(document).on('page:init', function (e, page) {
    switch(page.name){
        case 'andon':
            getlineList();
            // Pull to refresh content
            var $ptrContent = $$('.ptr-content');
            $ptrContent.on('ptr:refresh', function (e) {
                updateAndon();
                // When loading done, we need to reset it
                app.ptr.done(); // or e.detail();
            });
            break;
        case 'hourprod':
            getMC4PCCount();
            $$('.mc4pc-count').on('click', function () {
                mcListActionSheet.open();
            });
            break;
    }
});

$$(document).on('page:reinit', function (e, page) {
    switch(page.name){
        case 'hourprod':
            mcListActionSheet.open();
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
        error: function(error){
            app.preloader.hide();
            app.dialog.alert("Error");
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
                var x = lineList[data[i].LINE];
                var dt = moment(data[i].TIME).format('d-MMM h:ma');
                $$('#mc'+x).removeClass('andon-OK').addClass('andon-Red');
                $$('#dtl'+x).append(`${data[i].MC}, ${dt}<br>`);
            }
            app.preloader.hide();
        },
        error: function(error){
            app.preloader.hide();
            app.dialog.alert("Error");
            $$('#msg').text("Error : " + error);
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
                            getPCCount(data[i].TAGID);
                        },
                    });
            }
            mcListActionSheet = app.actions.create({buttons:mcListButtons});
            app.preloader.hide();
        },
        error: function(error){
            app.preloader.hide();
            app.dialog.alert("Error");
            $$('#msg').text("Error : " + error);
        }
    });
}

function getPCCount(tagID){
    app.preloader.show('gray');
    var mcListButtons = [];
    app.request({
        url: host + '/api/plc/PCCount/' + tagID,
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
            app.preloader.hide();
        },
        error: function(error){
            app.preloader.hide();
            app.dialog.alert("Error");
            $$('#msg').text("Error : " + error);
        }
    });
}