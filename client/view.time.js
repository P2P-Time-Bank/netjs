function newTimeView(v) {
    var numTimeSegments = 48;
    var timeUnitLengthMS = 30 * 60 * 1000; //30min

    var goalWidgetSize = [170, 170];
    var goalWidgetScale = '75%';
    
    var d = newDiv().appendTo(v);

    var colTimes = { };
    
    var gridsterParam = {
        widget_base_dimensions: goalWidgetSize,
        widget_margins: [6, 6],
        min_cols: numTimeSegments
    };
    
    var goalGridsterParam = _.extend(_.clone(gridsterParam), {
        resize: {
            enabled: true,
            max_size: [Infinity, 1],
            stop: function(e, ui, $widget) {
                //console.log($widget, 'resized');
            }    
        },
        draggable: {
            start: function() {
            },
            stop: function(event, ui) {
                var p = ui.$player;
                var g = p.attr('goalid');
                var targetCol = p.attr('data-col')-1;
                var targetTime = colTimes[targetCol];
                var G = $N.getObject(g);
                G.when = targetTime;
                $N.pub(G);
                //console.log(, , 'dragged');
            }
        }        
    });

    var headerRow = newDiv().addClass('gridster').appendTo(d);
    var headerRowGrid = $('<ul/>').appendTo(headerRow);

    d.append('<br/><br/>');
    
    var goalRows = newDiv().addClass('gridster').appendTo(d);
    var goalRowsGrid = $('<ul/>').appendTo(goalRows);
    
    var goalRowsGridster = goalRowsGrid.gridster(goalGridsterParam).data('gridster');


    
    
    foreachGoal(numTimeSegments, timeUnitLengthMS, $N.id(), function(time, goals, centroids, column) {
        colTimes[column] = time;

        var b = $('<li class="mainViewButton"></li>');
        b.attr('data-col', 1+column);
        b.attr('data-row', 1);
        b.css('border-bottom', '1px solid gray');
            
        b.append(name);
        
        var ts = new Date(time);
        
        if ((ts.getHours() !== 0) || (ts.getMinutes()!==0)) {
            var m = ts.getMinutes();
            if (m === 0) m = '00';                        
            ts = ts.getHours() + ":" + m;
        }
        else {
            ts = ts.toDateString();
            ts = ts.substring(0, ts.length-5);
        }
        b.append(ts);
        
        var addbutton = $('<button title="Add Tag">[+]</button>').appendTo(b);

        var y = function() {
            var tti = time;
            var tts = ts;
            addbutton.click(function() {
                var d = newPopup("Add a Goal at " + tts, {width: 800, height: 600, modal: true});
                d.append(newTagger([], function(results) {
                    saveAddedTags(results, 'Goal', tti + timeUnitLengthMS / 2);

                    //now = _.unique(now.concat(results));
                    later(function() {
                        d.dialog('close');
                        //updateGoalList();
                    });
                    //container.html(newSelfTimeList(s, x, container));
                }));
            });
        };
        y();
        
        headerRowGrid.append(b);
        
        function addGoal(g) {
            var gg = $('<li class="mainViewButton"></li>');
            gg.css('font-size', goalWidgetScale);
            var O = newObjectSummary(g, {
                showAuthorIcon: false,
                showAuthorName: false,
                showActionPopupButton: false
            });
            gg.attr('goalid', g.id);
            O.css('height', '95%');
            
            gg.append(O);
            goalRowsGridster.add_widget(gg, 1, 1, 1+column, 1);                    
        }
        
        _.each(goals, addGoal);
        _.each(centroids, addGoal);
        
    });
    
    
    
    var headerRowGridster = headerRowGrid.gridster(gridsterParam).data('gridster');
    
    headerRowGridster.disable();

    
    return d;
}

function foreachGoal(numTimeSegments, timeUnitLengthMS, user, onTimeSegment) {

    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();

    var GOALS = $N.objectsWithTag('Goal', true);

    for (var i = 0; i < numTimeSegments; i++) {

        var ti = time + (i * timeUnitLengthMS);

        var goals = _.filter(GOALS, function(x) {
            if (x.author != user)
                return;

            var w = x.when || 0;
            return ((w >= ti) && (w < ti + timeUnitLengthMS));
        });


/*
        var ts = new Date(ti);
        if (ts.getHours() != 0) {
            ts = ts.getHours() + ":00";
        }

        var d = newDiv().addClass('alternatingDiv').append('<span class="goalRowHeading">' + ts + '</span>');

        var addbutton = $('<button title="Add Tag">[+]</button>').appendTo(d);

        var y = function() {
            var tti = ti;
            var tts = ts;
            addbutton.click(function() {
                var d = newPopup("Add a Goal at " + tts, {width: 800, height: 600, modal: true});
                d.append(newTagger([], function(results) {
                    saveAddedTags(results, 'Goal', tti + timeUnitLengthMS / 2);

                    //now = _.unique(now.concat(results));
                    later(function() {
                        d.dialog('close');
                        //updateGoalList();
                    });
                    //container.html(newSelfTimeList(s, x, container));
                }));
            });
        };
        y();

        _.each(goals, function(g) {
            var ogg = objTags(g);
            if (_.contains(ogg, 'GoalCentroid'))
                return;

            var gg = newObjectSummary(g).addClass("miniGoalSummary");
            d.append(gg);
        });
*/


        var centroids = $N.objectsWithTag('GoalCentroid', true) || [];
        if (centroids) {
            centroids = _.filter(centroids, function(c) {
                return (c.when >= ti) && (c.when < ti + timeUnitLengthMS);
            });
        }
        
        onTimeSegment(ti, goals, centroids, i);


    }

}


//Deprecated
function newGoalList(target, user, centroids) {
    var numTimeSegments = 24;
    var timeUnitLengthMS = 30 * 60 * 1000; //30min

    var time = new Date();
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);
    time = time.getTime();

    var GOALS = $N.objectsWithTag('Goal', true);

    for (var i = 0; i < numTimeSegments; i++) {

        var ti = time + (i * timeUnitLengthMS);

        var goals = _.filter(GOALS, function(x) {
            if (x.author != user)
                return;

            var w = x.when || 0;
            return ((w >= ti) && (w < ti + timeUnitLengthMS));
        });


        var ts = new Date(ti);
        
        if ((ts.getHours() !== 0) || (ts.getMinutes()!==0)) {
            var m = ts.getMinutes();
            if (m === 0) m = '00';                        
            ts = ts.getHours() + ":" + m;
        }
        else {
            ts = ts.toDateString();
            ts = ts.substring(0, ts.length-5);
        }
        
        var d = newDiv().addClass('alternatingDiv').append('<span class="goalRowHeading">' + ts + '</span>');

        var addbutton = $('<button title="Add Tag">[+]</button>').appendTo(d);

        var y = function() {
            var tti = ti;
            var tts = ts;
            addbutton.click(function() {
                var d = newPopup("Add a Goal at " + tts, {width: 800, height: 600, modal: true});
                d.append(newTagger([], function(results) {
                    saveAddedTags(results, 'Goal', tti + timeUnitLengthMS / 2);

                    //now = _.unique(now.concat(results));
                    later(function() {
                        d.dialog('close');
                        //updateGoalList();
                    });
                    //container.html(newSelfTimeList(s, x, container));
                }));
            });
        };
        y();

        _.each(goals, function(g) {
            var ogg = objTags(g);
            if (_.contains(ogg, 'GoalCentroid'))
                return;

            var gg = newObjectSummary(g).addClass("miniGoalSummary");
            d.append(gg);
        });


        if (centroids) {
            _.each(_.filter(centroids, function(c) {
                return (c.when >= ti) && (c.when < ti + timeUnitLengthMS);
            }), function(g) {
                newObjectSummary(g).addClass("miniGoalSummary centroidSummary").appendTo(d);
            });
        }

        target.append(d);
    }

}
