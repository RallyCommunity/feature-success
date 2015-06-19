Ext.define('Rally.technicalservices.VariableComboBoxEditor', {
    extend:  Ext.grid.CellEditor ,
    alias: 'widget.tsvariablecomboboxeditor',

    ignoreNoChange: true,

    initComponent: function() {
        console.log('field:', this.field);
        
        this.callParent(arguments);
        this.field.on('select', this._onValueSelected, this);
    },

    getName: function() {
        return this.field && this.field.getName();
    },

    getValue: function() {
        return this._valueSelected ? this.callParent(arguments) : this.startValue;
    },

    _onValueSelected: function() {
        this._valueSelected = true;
    },

    onHide: function() {
        this.callParent(arguments);
        delete this._valueSelected;
        this.field.setValue('');
    },

    startEdit: function(el, value) {
        this.field.setOriginalValue(value);
        this.callParent(arguments);
    }
});
