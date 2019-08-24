odoo.define('modeler_project_list', function (require) {
    "use strict";

    var BasicView = require('web.BasicView');
    var ListRenderer = require('web.ListRenderer');
    var ListController = require('web.ListController');
    var ListView = require('web.ListView')
    var view_registry = require("web.view_registry");
    var ListRenderer = require("web.ListRenderer")
    var BasicModel = require('web.BasicModel');

    // 控制器
    var ModelerProjectListController = ListController.extend({})

    // 重写，自定义搜索
    var ModelerProjectListModel = BasicModel.extend({})

    // 重写，渲染列表视图
    var ModelerProjectListRender = ListRenderer.extend({
        /**
         * 重写，点击打开
         * @param {} event 
         */
        // _onRowClicked: function (event) {
        //     event.preventDefault();
        //     this.do_action({
        //         type: 'ir.actions.act_client',
        //         tag: "ModelerClient"
        //     });
        // }
    })

    // 扩展、重新配置list
    var ModelerProjectList = ListView.extend({
        config: _.extend({}, BasicView.prototype.config, {
            Model: ModelerProjectListModel,
            Renderer: ModelerProjectListRender,
            Controller: ModelerProjectListController,
        })
    });

    view_registry.add("ModelerProjectList", ModelerProjectList);

    return ModelerProjectList;
});