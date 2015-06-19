Ext.define('Rally.technicalservices.ProgressCalculator', {
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',
    config: {
        fieldName: null,
        fieldValues: []
    },

    constructor: function(config) {
        this.initConfig(config);
        this.callParent(arguments);
    },
    
    getMetrics: function () {
         return Ext.Array.map(this.fieldValues, function(fieldValue) {
            return  {
                as: fieldValue,
                groupByField: this.fieldName,
                allowedValues: [fieldValue],
                f: 'groupByCount',
                display: 'area'
            };
        }, this);
     },
     
     prepareCalculator: function (calculatorConfig) {
        var config = Ext.Object.merge(calculatorConfig, {
            granularity: this.config.granularity || this.lumenize.Time.DAY,
            tz: this.config.timeZone,
            holidays: this.config.holidays,
            workDays: this._getWorkdays()
        });

        return new this.lumenize.TimeSeriesCalculator(config);
    },
    
    runCalculation: function (snapshots) {
        var calculatorConfig = this._prepareCalculatorConfig(),
            seriesConfig = this._buildSeriesConfig(calculatorConfig);

        var calculator = this.prepareCalculator(calculatorConfig);
        calculator.addSnapshots(snapshots, this._getStartDate(snapshots), this._getEndDate(snapshots));

        var chart_data = this._transformLumenizeDataToHighchartsSeries(calculator, seriesConfig);
        
        console.log(chart_data);
        
        chart_data.categories = Ext.Array.map(chart_data.categories, function(datum){
            return " ";
        });
        
        chart_data.series = this._updateColors(chart_data.series);
        console.log(chart_data);
        
        return chart_data;
    },
    
    _updateColors: function(chart_series) {
        var updated_series = Ext.Array.map(chart_series, function(series) {
            console.log(series);
            if ( !series.name ) { series.name = 'none'; }
            if ( series.name == 'Abandon' ) {
                series.color = "#F66349";
            }
            console.log(series);
            
            return series;
        });
        
        return updated_series;
    }
        
});