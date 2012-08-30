function PortfolioItemThroughput() {
  var that = this;
  this.display = function(element) {
	var DEFAULT_NUM_MONTHS = 6;

    var rallyDataSource = null;
    var storiesTable = null;
    var stackedCB = null;

    var recentResults = null;
    var currentSeries = null;
    var currentNumMonths = null;
    var currentType = null;

    function convertEstimate(est) {
        if(est !== null ) {
            return est.Value;
        }
        return 0;
    }

    function getMonthKeyFromRecord( record ) {
        return getMonthKeyFromDate(rally.sdk.util.DateTime.fromIsoString( record.ActualEndDate ));
    }

    function getMonthKeyFromDate( theDate ) {
        var month = theDate.getMonth()+1;
        var yr = theDate.getFullYear();
        return month + "/" + yr;
    }

    function getRoadmapAllocation( item ){
        var alloc = item.InvestmentCategory;
        if(alloc === null || alloc === '') {
            if(item.Parent) {
                alloc = item.Parent.InvestmentCategory;
                item.InvestmentCategory = alloc;
                if ( alloc !== null ) {
                    item.InvestmentCategoryText = alloc + " (inherited)";
                }
            }
        } else {
            item.InvestmentCategoryText = alloc;
        }
        if(alloc === null){
            alloc = 'None';
        }
        return alloc;
    }

    function collectResults(results) {
        //console.log("Collecting results");
        //console.log(results);

        recentResults = results;

        var series = {};
        dojo.forEach( results.completedItems, function(item) {
            var seriesName = getRoadmapAllocation(item);
            var seriesVals = null;
            if ( series[seriesName] ) {
                seriesVals = series[seriesName];
            } else {
                seriesVals = [];
                series[seriesName] = seriesVals;
            }
            var key = getMonthKeyFromRecord( item );

            var found = false;
            dojo.forEach( seriesVals, function(val) {
                if (val[0] == key ) {
                    val[1] += convertEstimate(item.PreliminaryEstimate);
                    found = true;
                }
            });
            if ( !found ){
                var newVal = [ key, convertEstimate(item.PreliminaryEstimate) ];
                seriesVals.push(newVal);
            }

            item.FormattedIDLink = new rally.sdk.ui.basic.Link({"item":item});

        });

        currentSeries = series;
        renderChart( series, stackedCB.getChecked() );

    }

    function renderChart(data, isStacked){
        //console.log("Render chart");
        var chart = new EJSC.Chart("chart",
                { show_legend: false, height:"80%", width:"80%", show_titlebar: false, auto_resize:true });


        // Add Bins in order.
        var startDate = rally.sdk.util.DateTime.add(new Date(), "month", (0 - currentNumMonths));
        for ( var idx = 0; idx < currentNumMonths; idx++ ) {
            var binKey = getMonthKeyFromDate(startDate);
            chart.axis_bottom.addBin( binKey);
            startDate = rally.sdk.util.DateTime.add(startDate, "month", 1);
        }

        var container = chart;
        if ( isStacked ) {
            container = new EJSC.StackedBarSeries( {autosort: true});
            chart.addSeries( container );
        }

        for( var item in data ) {
            if (data.hasOwnProperty(item)) {
                var series = container.addSeries( new EJSC.BarSeries(
                    new EJSC.ArrayDataHandler( data[item] ), {title: item, autosort: true}));
            }
        }

        chart.onAfterSelectPoint = function( point, series, chart, hintElem, type) {

            if( type == 'select') {

                var monthLabel = point.x;
                if ( dojo.isString(monthLabel) === false ) {
                    // For some reason stacked bars are having issues...
                    monthLabel = chart.axis_bottom.__ticks[monthLabel-1].l;
                    //monthLabel = currentSeries[series.title][monthLabel-1][0];
                }
                renderTable( series.title, monthLabel );
            }
        };
    }

    function renderTable( allocation, month ) {
        //console.log("Rendering table for: " + allocation + ", " + month);
        document.getElementById("stories").innerHTML = "";

		if ( allocation == 'None' ) {
			allocation = null;
		}

        if( recentResults ) {
            var selectedRecords = dojo.filter( recentResults.completedItems, function( item ) {
                return ( item.InvestmentCategory == allocation ) && (getMonthKeyFromRecord(item) == month);
            });
            //console.log('Found Some...');
            //console.log(selectedRecords);
            var tableConfig = {
                columns: [
                    { key: "FormattedIDLink", header: "Formatted ID" },
                    { key: "Name", header: "Name" },
                    { key: "Project.Name", header: "Project" },
                    { key: "InvestmentCategoryText", header: "Allocation" },
                    { key: "PreliminaryEstimate.Name", header: "SWAG" },
                    { key: "ActualEndDate", header: "Accepted Date" }
                ],
                items: selectedRecords
            };

            if (storiesTable) {
                storiesTable.destroy();
            }
            storiesTable = new rally.sdk.ui.Table(tableConfig);
            storiesTable.display("stories");

        } else {
            console.log("WHOOPS.  There should be some results.");
        }
    }

    function onNumMonthsChanged(tb, args) {
        var numMonths = parseInt(args.value, 10);

        currentNumMonths = numMonths;
        if ( currentType !== null ) {
            loadData( numMonths, currentType );
        }
    }

    function onStackChange( cb, args ){
        renderChart( currentSeries, args.checked );
    }

    function onTypeChange( cb, args ) {
        currentType = args.item.TypePath;

        loadData(currentNumMonths, currentType);
    }

    function loadData(numMonths, type) {
        var startDate = rally.sdk.util.DateTime.add(new Date(), "month", (0 - numMonths));

        var queryConfig = {
            key: 'completedItems',
            type: type.replace(/\//g, '-'),
            fetch: 'Parent,ActualEndDate,PreliminaryEstimate,InvestmentCategory,Project,Name,FormattedID,Value',
            order: 'ActualEndDate InvestmentCategory',
            query: '(ActualEndDate >= "' + rally.sdk.util.DateTime.format(startDate, 'yyyy-MM-dd') + '")'
        };
        rallyDataSource.findAll(queryConfig, collectResults);
    }

    function onLoad() {
        rallyDataSource = new rally.sdk.data.RallyDataSource(
                "__WORKSPACE_OID__",
                "__PROJECT_OID__",
                "__PROJECT_SCOPING_UP__",
                "__PROJECT_SCOPING_DOWN__");

        rallyDataSource.setApiVersion('1.37');

        currentNumMonths = DEFAULT_NUM_MONTHS;
        var numMonthsCfg = {label : "Number of Previous Months: ", showLabel: true, value: DEFAULT_NUM_MONTHS};
        var numMonthsTextBox = new rally.sdk.ui.basic.TextBox(numMonthsCfg);
        numMonthsTextBox.display("numMonths", onNumMonthsChanged);

        var sConfig = { label: "Stacked?", showLabel: true };
        stackedCB = new rally.sdk.ui.basic.CheckBox(sConfig);
        stackedCB.display("stacked", onStackChange);

        var typeCfg = {
            label:'Type: ',
            showLabel:true,
            'type':'typeDefinition',
            attribute:'Name',
            order:'Ordinal desc',
            fetch:'Ordinal,TypePath',
            query: '((Parent.Name = "Portfolio Item") and (Creatable = true))'
        };

        var typeDropDown = new rally.sdk.ui.ObjectDropdown(typeCfg, rallyDataSource);
        typeDropDown.display('type', onTypeChange);

        //loadData(DEFAULT_NUM_MONTHS, DEFAULT_TYPE);
    }

    rally.addOnLoad(onLoad);
  };
}