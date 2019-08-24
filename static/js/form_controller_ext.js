/**
 * form controller extend, add save and exit
 */
odoo.define('funenc.FormControllerExt', function (require) {
    "use strict";
    
    var FormController = require('web.FormController');

    FormController.include({
        /**
         * 重写这个函数，扩展增加save_and_exit功能，让返回时带让保存的record
         * @param {*} event 
         */
        _onButtonClicked: function (event) {
            // stop the event's propagation as a form controller might have other
            // form controllers in its descendants (e.g. in a FormViewDialog)
            event.stopPropagation();
            
            var self = this;
            var def;

            this._disableButtons();

            function saveAndExecuteAction() {
                return self.saveRecord(self.handle, {
                    stayInEdit: true,
                }).then(function () {
                    // we need to reget the record to make sure we have changes made
                    // by the basic model, such as the new res_id, if the record is
                    // new.
                    var record = self.model.get(event.data.record.id);
                    return self._callButtonAction(attrs, record);
                });
            }

            function SaveAndExit() {
                return self.saveRecord(self.handle, {
                    stayInEdit: true,
                }).then(function () {
                    // we need to reget the record to make sure we have changes made
                    // by the basic model, such as the new res_id, if the record is
                    // new.
                    var record = self.model.get(event.data.record.id);
                    var action = {type: 'ir.actions.act_window_close', infos: record}
                    return self.do_action(action, {})
                });
            }

            var attrs = event.data.attrs;
            if (attrs.confirm) {
                var d = $.Deferred();
                Dialog.confirm(this, attrs.confirm, {
                    confirm_callback: saveAndExecuteAction,
                }).on("closed", null, function () {
                    d.resolve();
                });
                def = d.promise();
            } else if (attrs.special === 'cancel') {
                def = this._callButtonAction(attrs, event.data.record);
            } else if (attrs.special === 'save_and_exit') {
                def = SaveAndExit();
            } else if (!attrs.special || attrs.special === 'save') {
                def = saveAndExecuteAction();
            } 

            def.always(this._enableButtons.bind(this));
        },
    })

    return FormController;
});
