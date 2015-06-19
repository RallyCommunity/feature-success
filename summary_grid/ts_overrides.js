Ext.override(Rally.ui.popover.PopoverFactory, {
    _onRecordLoad: function(record, options){
        console.log('yo',options);
        
        if (this.popovers[options.field]) {
            options.record = record;
            return this.popovers[options.field](options);
        }
        
        if ( options.field == "Notes" ) {
            options.record = record;
            return Ext.create('Rally.technicalservices.NotesPopover', options);
            
        }
    }
});

/**
 * Create a popover to display the Notes of a specified record.
 * Generally this class will not be instantiated directly but instead will be obtained
 * via the Rally.ui.popover.PopoverFactory#bake method.
 *
 *     Rally.ui.popover.PopoverFactory.bake({
 *         field: 'Description'
 *     });
 */
Ext.define('Rally.technicalservices.NotesPopover', {
    alias: 'widget.tsnotespopover',
    extend: 'Rally.ui.popover.HoverablePopover',

    id: 'notes-popover',
    cls: 'description-popover',

    constructor: function(config) {
        config.items = [
            {
                xtype: 'tsnotesrichtextview',
                storeConfig: {
                    context: config.context,
                    model: config.record.self,
                    filters: [
                        {
                            property: 'ObjectID',
                            operation: '=',
                            value: config.record.get('ObjectID')
                        }
                    ]
                },
                listeners: {
                    viewready: function() {
                        if (Rally.BrowserTest) {
                            Rally.BrowserTest.publishComponentReady(this);
                        }
                    },
                    scope: this
                }
            }
        ];
        this.callParent(arguments);
    }
});

/**
 * @private
 * Displays rich text description for a record.
 */
Ext.define('Rally.technicalservices.NotesRichTextView', {
    extend: 'Ext.view.View',
    alias: 'widget.tsnotesrichtextview',
    requires: [
        'Rally.nav.DetailLink',
        'Rally.ui.renderer.template.FormattedIDTemplate'
    ],
    cls: 'description-richtext-view',
    itemSelector : 'div.notes',
    loadMask: false,

    detailsField: 'Notes',
    detailsFieldBackup: 'Notes',

    initComponent: function() {
        this._setDetailsField();
        this._createTpl();

        if (!this.store) {
            this.store = this._createStore();
        }

        this.callParent(arguments);
    },

    _createStore: function() {
        var defaultConfig = {
            fetch: ['Name', 'FormattedID', this.detailsField],
            limit: 1,
            pageSize: 1,
            autoLoad: true,
            requester: this
        };

        return Ext.create('Rally.data.wsapi.Store', Ext.apply(defaultConfig, this.storeConfig));
    },

    prepareData: function(data) {
        data.FormattedID = Ext.create('Rally.ui.renderer.template.FormattedIDTemplate').apply(data);
        return data;
    },

    _setDetailsField: function() {
        var model = (this.storeConfig && this.storeConfig.model) || (this.store && this.store.model);
        if (model && !model.getField(this.detailsField) && model.getField(this.detailsFieldBackup)) {
            this.detailsField = this.detailsFieldBackup;
        }
    },

    _createTpl: function() {
        //  Have to create the template this way to maintain scope when it is applied
        this.tpl = new Ext.XTemplate(
            '<tpl>',
                '<div class="header">',
                    '<b>{[values[0].FormattedID]}:</b> {[values[0].Name]}',
                '</div>',
                '<tpl if="this.hasDetails(values)">',
                    '<div class="description">{[this.getDetails(values)]}</div>',
                '</tpl>',
            '</tpl>'
        );

        this.tpl.self.addMembers({
            hasDetails: Ext.bind(function(data) {
                return data && data[0] && !_.isEmpty(data[0][this.detailsField]);
            }, this),

            getDetails: Ext.bind(function(data) {
                return data[0][this.detailsField];
            }, this)
        });
    }
});
