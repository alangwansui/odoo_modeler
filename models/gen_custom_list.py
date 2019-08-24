# -*- coding: utf-8 -*-

js_class_template = '''
odoo.define('construction_dispatch.report_list', function (require) {
  "use strict";

  var BasicView = require('web.BasicView');
  var ListRenderer = require('web.ListRenderer');
  var ListController = require('web.ListController');
  var ListView = require('web.ListView')
  var view_registry = require("web.view_registry");
  var ListRenderer = require("web.ListRenderer")
  var BasicModel = require('web.BasicModel');

  // 控制器
  var ReportListController = ListController.extend({

  })

  // 重写，自定义搜索
  var ReportListModel = BasicModel.extend({

  })

  // 重写，渲染列表视图
  var ReportListRender = ListRenderer.extend({

  })

  // 扩展、重新配置list
  var ReportList = ListView.extend({
    config: _.extend({}, BasicView.prototype.config, {
      Model: ReportListModel,
      Renderer: ReportListRender,
      Controller: ReportListController,
    })
  });

  view_registry.add("ReportList", ReportList);

  return ReportList;
});
'''

# client action xml 配置
act_client_xml_template = '''
<!-- client action -->
<record id="project_action_client" model="ir.actions.client">
    <field name="name">project modeler</field>
    <field name="tag">ModelerClient</field>
    <field name="target">main</field>
</record>
'''

# client action 
act_client_js_template = '''
<!-- client action -->
<record id="project_action_client" model="ir.actions.client">
    <field name="name">project modeler</field>
    <field name="tag">ModelerClient</field>
    <field name="target">main</field>
</record>
'''

js_view_template = '''
odoo.define('funenc.{name}_view', function (require) {
    "use strict";

    /**
     * 自定义树，更加灵活
     */
    var BasicView = require('web.BasicView');
    var ListRenderer = require('web.ListRenderer');
    var ListController = require('web.ListController');

    var ListView = require('web.ListView');
    var view_registry = require('web.view_registry');

    var {name}_render = ListRenderer.extend({

    })

    var {name}_controller = ListController.extend({

    })
    
    var {name}_list_view = ListView.extend({
        config: _.extend({}, BasicView.prototype.config, {
            Renderer: dev_list_render,
            Controller: dev_controller
        }),
        viewType: 'list'
    });

    view_registry.add('{name}_list_view', {name}_list_view);
    
    return {name}_list_view;
});
'''



