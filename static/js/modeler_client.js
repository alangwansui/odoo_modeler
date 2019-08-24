/**
 * modeler client
 */
odoo.define('funenc.ModelerProjectClient', function (require) {
    "use strict";

    var core = require('web.core');
    var AbstractAction = require('web.AbstractAction');
    var ModelerTable = require('funenc.ModelerTable')

    var crash_manager = require('web.crash_manager');
    var framework = require('web.framework');
    var session = require('web.session');

    var QWeb = core.qweb;

    /**
     * 建模工具客户端
     */
    var ModelerClient = AbstractAction.extend({
        template: 'funenc.modeler_client',

        modeler_instance: undefined,
        project_id: undefined,
        project_info: undefined,
        model_container: undefined,
        tables: [],
        connections: [], // 连接缓存数组
        zip: undefined,

        events: {
            'click .add_table': '_on_add_table',
            'click .export_table': '_on_export_table',
            'click .export_project': '_on_export_project'
        },

        /**
         * 初始化
         * @param {} parent 
         * @param {*} action 
         */
        init: function (parent, action) {
            this.project_id = action.context.active_id || action.params.active_id;
            this._super.apply(this, arguments);
        },

        /**
         * 渲染结束，组件初始化
         */
        start: function () {
            this._super.apply(this, arguments);
            this.model_container = this.$('.modeler_container')
            var self = this;
            // 不这样写的话无法初始化连接
            setTimeout(function () {
                // 防止窗口变化没有刷新
                self.modeler_instance.setSuspendDrawing(true);
                self.init_tables();
                self.modeler_instance.setSuspendDrawing(false);
                setTimeout(function () {
                    self.modeler_instance.repaintEverything();
                }, 0);
            }, 0);
            // 移除connect
            core.bus.on('funec_modeler_remove_dest_con', this, this.remove_dest_connection);
            core.bus.on('funec_modeler_remove_dest_table_con', this, this.remove_dest_table_connection);
        },

        /**
         * 加载模型数据
         */
        willStart: function () {
            var self = this;
            return this._rpc({
                model: 'odoo_modeler.model_project',
                method: 'get_project_info',
                args: [this.project_id]
            }).then(function (res) {
                self.project_info = res
                return self.init_js_plumb();
            })
        },

        get_name_space: function () {
            return this.project_info.name_space ? this.project_info.name_space : "funenc"
        },

        get_project_info: function () {
            return this.project_info
        },

        /**
         * 移除connection
         */
        remove_dest_connection: function (evt) {
            var field_id = evt.field_id;
            _.each(this.tables, function (table) {
                table.remove_dest_connection(field_id)
            })
        },

        /**
         * 移除到目标table的connection
         * @param {*} evt 
         */
        remove_dest_table_connection: function (evt) {
            var table_id = evt.table_id;
            _.each(this.tables, function (table) {
                if (table.table_info.id != table_id) {
                    table.remove_dest_table_connection(table_id)
                }
            })
        },

        /**
         * 初始化jsplumb
         */
        init_js_plumb: function () {
            var self = this;
            var def = $.Deferred();

            jsPlumb.ready(function () {
                self.modeler_instance = jsPlumb.getInstance({
                    Connector: ["Flowchart", {
                        stub: [40, 60],
                        gap: 5,
                        cornerRadius: 5,
                        alwaysRespectStubs: true
                    }],
                    paintStyle: {
                        strokeWidth: 5,
                        stroke: "#000000",
                        outlineStroke: "black",
                        outlineWidth: 1
                    },
                    endpoint: ["Dot", { radius: 5 }],
                    endpointStyle: { fill: "#567567" },
                    hoverPaintStyle: {
                        strokeStyle: "#637b94",
                        lineWidth: 6
                    },
                    endpointHoverStyle: {
                        fillStyle: "#637b94"
                    },
                    dragOptions: {
                        cursor: 'pointer',
                        zIndex: 2000
                    },
                    anchors: ["Center", "Center"]
                });

                def.resolve()
            });

            return def;
        },

        /**
         * get the modeler instance
         */
        get_modeler_instance: function () {
            return this.modeler_instance;
        },

        /**
         * 初始化tables, 将表添加到container
         */
        init_tables: function () {
            this.tables = [];
            var self = this;
            for (var i = 0; i < this.project_info.tables.length; i++) {
                var table = this.project_info.tables[i];
                var tmp_table = new ModelerTable(self, table);
                tmp_table.appendTo(self.model_container);
                self.tables.push(tmp_table)
            }

            for (var i = 0; i < this.tables.length; i++) {
                var table = this.tables[i];
                table.init_connection(table);
            }
        },

        /**
         * 添加表格, 这里要取得添加的表格内容, 弹出action
         */
        _on_add_table: function () {
            var self = this;
            this.do_action({
                type: 'ir.actions.act_window',
                view_type: 'form',
                view_mode: 'form',
                res_model: "odoo_modeler.model_tables",
                target: 'new',
                views: [[false, 'form']],
                // 设置默认值
                context: {
                    "default_project_id": this.project_info.id
                }
            }, {
                    on_close: function (res) {
                        if (!res || res == 'special') {
                            return
                        }
                        var table_id = res.data.id;
                        self.deal_new_table(table_id)
                    }
                });
        },

        /**
         * 添加新的表
         * @param {*} table_id 
         */
        deal_new_table: function (table_id) {
            var self = this;
            this._rpc({
                model: 'odoo_modeler.model_tables',
                method: 'get_table_info',
                args: [table_id]
            }).then(function (table) {
                var tmp_table = new ModelerTable(self, table);
                tmp_table.appendTo(self.model_container);
                self.tables.push(tmp_table);
                
                var container = self.$('.modeler_container').parent()

                var posX = container.scrollLeft() + 300;
                var posY = container.scrollTop() + 300;

                tmp_table.$el.css("left", posX);
                tmp_table.$el.css("top", posY);
            })
        },

        /**
         * 生成manifest文件
         */
        gen_manifest: function (view_xmls) {
            var txt = QWeb.render('funenc.modeler_manifest', {
                project: this.project_info,
                view_xmls: view_xmls
            });
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        /**
         * 生成init.py
         */
        gen_init_py: function () {
            var txt = QWeb.render('funenc.modeler_init_py', {});
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        escape_dot: function (name) {
            if (name) {
                return name.replace(/\./g, "_")
            }
            return name
        },

        /**
         * 生成model init文件
         */
        gen_model_init: function (model_names) {
            // info.file_name.replace(/\./g, "_")

            // var parts = name.split('.')
            // var pre_parts = parts.slice(0, parts.length - 2)
            // var name = pre_parts.join('_')
            // name = name + "." + parts[parts.length - 1]

            var escape_names = []
            _.each(model_names, function (name) {
                var name = name.replace(/\./g, "_")
                escape_names.push(name)
            })
            var txt = QWeb.render('funenc.modeler_model_init_py', {
                model_names: escape_names,

            });
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        /**
         * 生成controller
         */
        gen_controller_init: function () {
            var txt = QWeb.render('funenc.modeler_controller_init_py', {});
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        /**
         * 生成controller模板文件
         */
        gen_controller: function () {
            var txt = QWeb.render('funenc.modeler_controller_py', {});
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        /**
         * 生成root menu 文件
         */
        gen_root_menu: function () {
            var txt = QWeb.render('funenc.modeler_menu_root', {
                project_name: this.project_info.name
            });
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        /**
         * 生成csv 文件
         */
        gen_csv_file: function () {
            var self = this
            // 只处理本身项目的
            var tmp_tables = this.tables.filter(function (table) {
                return table.table_info.project_id[0] == self.project_info.id;
            })
            var txt = QWeb.render('funenc.modeler_csv_template', {
                tables: tmp_tables
            });
            txt = _.str.trim(txt, ' \n\r    ')
            return txt;
        },

        /*
        导出项目模型
        */
        _on_export_project: function() {
            session.get_file({
                url: '/funenc_modeler/export_xls',
                data:{
                    project_id: this.project_info.id
                },
                complete: framework.unblockUI,
                error: crash_manager.rpc_error.bind(crash_manager)
            });
        },

        /**s
         * 导出模型
         */
        _on_export_table: function () {
            var zip = new JSZip();

            var view_xmls = []
            var model_names = []

            var project_name = this.project_info.name;

            var self = this;
            var cur_project_tables = []
            // add into zip
            _.each(this.tables, function (table) {
                // only export table of this project
                if (table.table_info.project_id[0] == self.project_info.id) {
                    cur_project_tables.push(table)
                    
                    var ret = table.export_table_files();
                    _.each(ret, function (info) {

                        // get the file name
                        var parts = info.file_name.split('.')
                        var pre_parts = parts.slice(0, parts.length - 1)
                        var name = pre_parts.join('_')
                        var file_name = name + "." + parts[parts.length - 1]

                        // add into zip file
                        zip.file(project_name + "/" + file_name, info.data);
                        if (_.str.endsWith(info.file_name, '.py')) {
                            var tmp_name = info.file_name.replace('models/', '')
                            tmp_name = tmp_name.replace('.py', '')
                            model_names.push(tmp_name);
                        } else if (_.str.endsWith(info.file_name, '.xml')) {
                            view_xmls.push(file_name);
                        }
                    })
                }
            })

            // root menu
            var root_menu = this.gen_root_menu();
            view_xmls.unshift("views/root_menu.xml"); // 会写入到manifest中
            zip.file(project_name + "/views/root_menu.xml", root_menu);

            // manifest 文件
            var manifest = this.gen_manifest(view_xmls);
            zip.file(project_name + "/__manifest__.py", manifest);

            // init 文件
            var init_file = this.gen_init_py();
            zip.file(project_name + "/__init__.py", init_file);

            // csv 文件
            var csv = this.gen_csv_file(this.cur_project_tables);
            zip.file(project_name + "/security/ir.model.access.csv", csv);

            // model init文件, model文件在下一步加入
            var model_init = this.gen_model_init(model_names);
            zip.file(project_name + "/models/__init__.py", model_init);

            // constroller 文件
            var controller_init = this.gen_controller_init();
            var controller = this.gen_controller();
            zip.file(project_name + "/controllers/__init__.py", controller_init);
            zip.file(project_name + "/controllers/controllers.py", controller);

            // download the zip file
            zip.generateAsync({ type: "base64" }).then(function (base64) {
                window.location = "data:application/zip;base64," + base64;
            }, function (err) {
                console.log('some thing is error while gen zip file');
            });
        }
    });

    core.action_registry.add('ModelerClient', ModelerClient);

    return ModelerClient;
});
