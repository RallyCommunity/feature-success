Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    featureRecommendationDropdownField: 'c_Recommendation',
    initiativeRecommendationDropdownField: 'c_InitiativeRecommendation',
    recommendationSummaryField: 'c_RecommendationSummary',
    winnerField: 'c_Winner',
    voteField: 'c_Votes',
    items: [
        {xtype:'container',itemId:'selector_box', padding: 10},
        {xtype:'container',itemId:'display_box', padding: 10}
    ],
    
    launch: function() {
        var me = this;
        var feature_fields = ['FormattedID','Name','Notes','ConversationPost','PercentDoneByStoryCount',
            this.featureRecommendationDropdownField, this.initiativeRecommendationDropdownField, this.winnerField];
        
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: ['portfolioitem/theme'],
            fetch: feature_fields,
            autoLoad: true,
            enableHierarchy: true
        }).then({
            success: function(store) {
                me.down('#display_box').add({
                    xtype: 'rallytreegrid',
                    columnCfgs: me._getColumns(),
                    store: store,
                    listeners: {
                        itemclick: function(view, record, item, index, evt) {
                            var column_index = view.getPositionByEvent(evt).column;
                            var columns = me._getColumns();
                            var check_index = column_index - 5;
                            if (check_index > 0 ) {
                                if ( columns[check_index].dataIndex == "Notes" ) { 
                                    me._showNotesPopup(record);
                                }
                            }
                        },
                        scope : this
                    }
                });
             }
         });
    },
    
    _addSelectors: function(container) {
        container.add({
            xtype:'rallybutton', 
            cls:'secondary', 
            text:'Choose Initiative',
            listeners: {
                scope: this,
                click: this._launchPIPicker
            }
        });
    },
    
    _updateData: function(initiative) {
        var me = this;
        
        var feature_fields = ['FormattedID','Name','Notes',this.featureRecommendationDropdownField, this.winnerField, this.recommendationSummaryField];
        var feature_filter = [{property:'Parent.ObjectID', value:initiative.get('ObjectID')}];
        
        this._loadATypeWithAPromise('portfolioitem/feature',feature_fields, feature_filter ).then({
            success: function(features) {
                me._displayGrid(features);
            },
            failure: function(msg) {
                 Ext.Msg.alert(msg);
            }
        });
    },
    
    _loadATypeWithAPromise: function(model_name, model_fields,model_filter){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
          
        Ext.create('Rally.data.wsapi.Store', {
            model: model_name,
            fetch: model_fields,
            filters: model_filter
        }).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
                } else {
                    console.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    _getColumns: function() {
        var me = this;
        
        var specialComboFunction = function(field) {
            console.log('field', field);
            return {
                xtype: 'tsvariablecomboboxeditor', 
                field: {
                    xtype: 'rallyfieldvaluecombobox',
                    autoExpand: true,
                    field: field,
                    storeConfig: {
                        autoLoad: false
                    }
                }
           }
        };
        
        var columns = [
            {dataIndex:'Name', text:'name'},
            {dataIndex:'PercentDoneByStoryCount', text: 'Progress' },
            {
                dataIndex:this.featureRecommendationDropdownField,
                text:'Recommendation', 
                listeners: {
                    render: function(column) {
                        console.log('col', column);
                        console.log('editor', column.getEditor());
                        return true;
                    }
                },
                renderer: function(value,meta,record){
                    
                    if ( record.get("_type") == "portfolioitem/feature") {
                        if ( value == "Abandon" ) {
                            value = "<span class='red_label right'>" + value + "</span>";
                            //meta.tdCls = "red";
                        }
                        if ( value == "Explore" ) {
                            value = "<span class='yellow_label right'>" + value + "</span>";
                        }
                        if ( value == "Exploit" ) {
                            value = "<span class='green_label right'>" + value + "</span>";
                        }
                    } 
                    
                    if ( record.get("_type") == "portfolioitem/initiative") {
                        value = record.get(me.initiativeRecommendationDropdownField);
                        
                        if ( value == "Pivot" ) {
                            value = "<span class='red_label'>" + value + "</span>";
                        }

                        if ( value == "Persevere" ) {
                            value = "<span class='green_label'>" + value + "</span>";
                        }
                    } 
                    return value;
                }
            },
            {dataIndex: this.recommendationSummaryField, text: 'Summary' },
            {dataIndex: 'Notes', text:'<div class="icon-file"> </div>', width: 25, editor: false, 
                renderer: function(value) {
                    if (value) {
                        return "<span class='icon-file'> </span>";
                    }
                    return "";
                }
            },
            {dataIndex:this.winnerField, width: 25, text:'',editor: 'rallycheckboxfield', 
                renderer: function(value) {
                    if (value) {
                        return "<span class='icon-flag'> </span>";
                    }
                    return "";
                }
            },
            {dataIndex:'Discussion', width: 35, text:''}
        ];
        
        return columns;
    },
    
    _displayGrid: function(records) {
        var me = this;
        var store = Ext.create('Rally.data.custom.Store',{data: records});
        var container = this.down('#display_box');
        
        container.removeAll();
        container.add({
            xtype:'rallygrid',
            columnCfgs: this._getColumns(),
            store: store,
            listeners: {
                itemclick: function(view, record, item, index, evt) {
                    var column_index = view.getPositionByEvent(evt).column;
                    var columns = me._getColumns();
                    console.log(columns[column_index].dataIndex);
                    if ( columns[column_index].dataIndex == "Notes" ) { 
                        // notes
                        me._showNotesPopup(record);
                    }
                },
                scope : this
            }
        });
    },
    
    _launchPIPicker: function() {
        var me = this;
        Ext.create('Rally.ui.dialog.ArtifactChooserDialog', {
            artifactTypes: ['portfolioitem/initiative'],
            autoShow: true,
            height: 250,
            title: 'Choose Initiative',
            multiple: false,
            listeners: {
                artifactchosen: function(dialog, selectedRecord){
                    me._updateData(selectedRecord);
                },
                scope: this
            }
         });
    },
    _showNotesPopup: function(record) {
        var me = this;
        var title = record.get('FormattedID') + ": " + record.get('Name');
        
        var magic_renderer = function(field,value,meta_data,record){
            return me._magicRenderer(field,value,meta_data,record);
        };
        
        Ext.create('Rally.ui.dialog.Dialog', {
            id        : 'fieldPopup',
            title     : title,
            width     : Ext.getBody().getWidth() - 25,
            height    : Ext.getBody().getHeight() - 25,
            closable  : true,
            items     : [
                { 
                    xtype: 'container', 
                    cls: 'notes_recommendation',
                    html: "Recomendation: " + record.get(me.featureRecommendationDropdownField) 
                },
                {
                    xtype:  'container',
                    cls: 'notes_with_border',
                    html: record.get('Notes')
                }
            ]
        }).show();
    },
    
    _showInfoPopup: function(record, field_name) {
        var me = this;
       
        var title = record.get('FormattedID') + ": " + record.get('Name');

        
        var magic_renderer = function(field,value,meta_data,record){
            return me._magicRenderer(field,value,meta_data,record);
        };
        
        Ext.create('Rally.ui.dialog.Dialog', {
            id        : 'fieldPopup',
            title     : title,
            width     : Ext.getBody().getWidth() - 25,
            height    : Ext.getBody().getHeight() - 25,
            closable  : true,
            /*layout    : 'fit',*/
            items     : [{
                xtype:  'container',
                html: record.get(field_name)
            }]
        }).show();
    }
});
