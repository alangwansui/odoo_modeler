/**
 * modeler client
 */

odoo.define('funenc.ModelerTable', function (require) {
    "use strict";

    var Widget = require('web.Widget');
    var TableField = require('funenc.modeler.TableField');
    var core = require('web.core');
    var qweb = core.qweb;

    var ModelerTable = Widget.extend({
        template: 'funenc.modeler_table_template',
        table_info: undefined,
        field_container: undefined,
        project_info: undefined,
        fields: [],
        modeler_instance: undefined,
        name_space: '',

        events: {
            'click .add-column': '_on_add_field',
            'click .edit_table': '_on_edit_table',
            'click .del_table': '_on_del_table',
            'click .gen_table': '_on_gen_table'
        },

        custom_events: {
            update_field_con: 'reconnect'
        },

        /**
         * 重新连接
         */
        reconnect: function (event) {
            var field = event.data.field;
            // 先删除链接
            field.remove_connection();
            // 再进行连接
            if (field.field_info.comodel_id &&
                field.field_info.comodel_id != "" &&
                field.field_info.comodel_id[0] != this.table_info.id) {
                this.set_connection(field);
            }
        },

        /**
         * 初始化
         * @param {*} parent 
         * @param {*} table_info 
         */
        init: function (parent, table_info) {
            this.table_info = _.clone(table_info);
            this.modeler_instance = parent.get_modeler_instance();
            this.name_space = parent.get_name_space();
            this.project_info = parent.get_project_info();
            this._super.apply(this, arguments);
        },

        /**
         * get the modeler instance
         */
        get_modeler_instance: function () {
            return this.modeler_instance
        },

        /**
         * start
         */
        start: function () {
            var self = this;
            this._super.apply(this, arguments);

            // init the container
            this.$field_container = this.$('.nodecollection-container')

            // init the fields
            this.init_fields();
            this.$field_container.sortable({
                update: function (ev, ui) {
                    self.updateIndex();
                }
            });

            if (this.table_info.ui_pos) {
                this.$el.css("left", this.table_info.ui_pos.pos_x);
                this.$el.css("top", this.table_info.ui_pos.pos_y);
            }

            this.make_draggable();
            this.$field_container.disableSelection();
        },

        make_draggable: function () {
            var self = this;
            // set it draggable
            this.modeler_instance.draggable(this.$el, {
                filter: ".node-column *, .btn, .button *",
                containment: true,
                // callback for stop
                stop: function (info) {
                    if (!self.table_info.ui_pos) {
                        self.table_info.ui_pos = {
                            pos_x: info.pos[0],
                            pos_y: info.pos[1]
                        }
                    } else {
                        self.table_info.ui_pos.pos_x = info.pos[0]
                        self.table_info.ui_pos.pos_y = info.pos[1]
                    }
                    self.update_table_pos();
                }
            });
        },

        init_table_pos: function () {
            // set the pos
            if (this.table_info.ui_pos) {
                this.$el.css("left", this.table_info.ui_pos.pos_x);
                this.$el.css("top", this.table_info.ui_pos.pos_y);
            }
        },

        /**
         * 外部项目使用特殊颜色显示
         */
        get_table_color: function () {
            if (this.table_info.project_id[0] == this.project_info.id) {
                return ""
            } else {
                return "node-Yellow"
            }
        },

        /**
         * 初始化连接
         * @param {} ev 
         */
        init_connection: function (ev) {
            var self = this;
            for (var index = 0; index < this.fields.length; index++) {
                var field = this.fields[index];
                if (field.field_info.comodel_id &&
                    field.field_info.comodel_id != "" &&
                    field.field_info.comodel_id[0] != self.table_info.id) {
                    self.set_connection(field);
                }
            }
        },

        /**
         * 更新表格位置但不显示loading
         */
        update_table_pos: function () {
            this._rpc({
                model: 'odoo_modeler.model_tables',
                method: 'update_ui_pos',
                args: [
                    this.table_info.id,
                    this.project_info.id,
                    this.table_info.ui_pos.pos_x,
                    this.table_info.ui_pos.pos_y
                ]
            }, { shadow: true })
        },

        /**
         * init the fields
         */
        init_fields: function () {
            this.fields = []
            var self = this;
            if (!this.table_info.table_fields) {
                return;
            }
            for (var i = 0; i < this.table_info.table_fields.length; i++) {
                var field = this.table_info.table_fields[i];
                var tmp = new TableField(self, field);
                tmp.appendTo(self.$field_container);
                self.fields.push(tmp);
            }
        },

        /**
         * 更新项目index
         */
        updateIndex() {
            var index_info = []
            _.each(this.fields, function (field) {
                var index = field.$el.index();
                index_info.push({
                    index: index,
                    id: field.field_info.id
                })
            })

            this._rpc({
                model: 'odoo_modeler.model_table_fields',
                method: 'update_fields_index',
                args: [index_info]
            }).then(function (field) { })
        },

        /**
         * 添加新的字段
         */
        _on_add_field: function (event) {
            event.preventDefault();

            var self = this;
            this.do_action({
                type: 'ir.actions.act_window',
                view_type: 'form',
                view_mode: 'form',
                res_model: "odoo_modeler.model_table_fields",
                target: 'new',
                views: [[false, 'form']],
                // 设置默认值
                context: {
                    "default_table_id": this.table_info.id,
                    "table_id": this.table_info.id
                }
            }, {
                    on_close: function (res) {
                        if (!res || res == 'special') {
                            return
                        }
                        var field_id = res.data.id;
                        self._add_new_field(field_id)
                        self.modeler_instance.revalidate(this.$el);
                    }
                });
        },

        /**
         * 内部方法，建立新的字段
         * @param {} field_id 
         */
        _add_new_field: function (field_id) {
            var self = this
            this._rpc({
                model: 'odoo_modeler.model_table_fields',
                method: 'get_field_info',
                args: [field_id]
            }).then(function (field) {
                // 添加新的元素到后面
                var tmp = new TableField(self, field);
                tmp.appendTo(self.$field_container);
                self.fields.push(tmp)
                if (field.comodel_id
                    && field.comodel_id[0] != self.table_info.id) {
                    // 建立建接 
                    self.set_connection(tmp);
                }
            })
        },

        get_table_id: function () {
            return this.table_info.id;
        },

        /**
         * 取得关联模型信息
         */
        get_com_model_info: function (comodel_id) {
            var d = $.Deferred();
            this._rpc({
                model: 'odoo_modeler.model_tables',
                method: 'get_table_info',
                args: [comodel_id]
            }).then(function (table_info) {
                if (table_info) {
                    d.resolve(table_info);
                } else {
                    d.reject('the related model is not exit');
                }
            })
        },

        /**
         * 建立连接
         */
        set_connection: function (field, field_con) {

            if (field.field_info.field_type != 'Many2one'
                && field.field_info.field_type != 'One2many'
                && field.field_info.field_type != 'Many2many'
                && field.field_info.field_type != 'Reference') {
                return
            }

            if (field.field_info.comodel_id) {

                var source_table_id = 'modeler_table_' + this.table_info.id;
                var target_table_id = 'modeler_table_' + field.field_info.comodel_id[0];

                var source_field_id = "modeler_field_" + field.field_info.id
                var target_field_id = undefined;
                if (field.field_info.field_type == 'One2many') {
                    target_field_id = 'modeler_field_' + field.field_info.inverse_name[0];
                } else {
                    target_field_id = target_table_id;
                }

                var label = field.field_info.name;
                switch (field.field_info.field_type) {
                    case "Many2one":
                        label += " (多对一) ";
                        label += field.field_info.comodel_id[1];
                        break;
                    case "One2many":
                        label += " (一对多) ";
                        label += field.field_info.inverse_name[1]; // 字段
                        break;
                    case "Many2many":
                        label += " (多对多) ";
                        label += field.field_info.comodel_id[1];
                        break;
                    case "Reference":
                        label += " (引用) ";
                        label += field.field_info.comodel_id[1];
                        break;
                }


                if (!field_con) {
                    var con = this.CreateTableConnection({
                        source_table_id: source_table_id,
                        target_table_id: target_table_id,
                        label: label,
                        parameters: { // 保存参数
                            source_table_id: this.table_info.id,
                            source_field_id: field.field_info.id,
                            target_table_id: field.field_info.comodel_id[0],
                            target_field_id: field.field_info.inverse_name[0]
                        }
                    });
                    if (con) {
                        field.add_connection(con);
                    }
                } else {
                    var con = this.CreateFieldConnectin({
                        source_field_id: source_field_id,
                        dest_field_id: target_field_id,
                        label: label,
                        parameters: {
                            source_table_id: this.table_info.id,
                            source_field_id: field.field_info.id,
                            target_table_id: field.field_info.comodel_id[0],
                            target_field_id: field.field_info.inverse_name[0]
                        }
                    });
                    if (con) {
                        field.add_connection(con);
                    }
                }
                // 刷新connection
                this.modeler_instance.repaintEverything();
            }
        },

        /**
         * 创建连接
         * @param {} source_field_id 
         * @param {*} target_field_id 
         */
        CreateTableConnection: function (info) {

            var conn = this.modeler_instance.connect({
                source: info.source_table_id,
                target: info.target_table_id,
                anchor: "Continuous",
                ConnectionsDetachable: false,
                Container: document.body,
                connector: ["Flowchart", {
                    stub: [40, 50, 60],
                    gap: 10,
                    cornerRadius: 5,
                    alwaysRespectStubs: true
                }],
                paintStyle: { strokeWidth: 5, stroke: '#666' },
                HoverPaintStyle: {
                    strokeStyle: "#637b94",
                    lineWidth: 6
                },
                overlays: [
                    ["Arrow", {
                        location: 1, foldback: 1, length: 10
                    }],
                    ["Label", {
                        cssClass: "modeler_label",
                        label: info.label,
                        location: 0.5, // 中间
                        id: "label" + info.source_table_id + "_" + info.target_table_id
                    }]
                ],
                parameters: info.parameters
            });

            return conn;
        },

        /**
         * 创建连接
         * @param {} source_field_id 
         * @param {*} target_field_id 
         */
        CreateFieldConnectin: function (info) {

            var conn = this.modeler_instance.connect({
                source: info.source_field_id,
                target: info.target_field_id,
                connector: ["Flowchart", {
                    stub: [40, 60],
                    gap: 10,
                    cornerRadius: 5,
                    alwaysRespectStubs: true
                }],
                paintStyle: { strokeWidth: 5, stroke: '#666' },
                anchor: "Continuous",
                HoverPaintStyle: {
                    strokeStyle: "#637b94",
                    lineWidth: 6
                },
                overlays: [
                    ["Arrow", {
                        location: 1, foldback: 1, length: 10
                    }],
                    ["Label", {
                        cssClass: "modeler_label",
                        label: info.label,
                        location: 0.5, // 中间
                        id: "label" + info.source_field_id + "_" + info.target_field_id
                    }]
                ]
            });

            return conn;
        },

        /**
         * 销毁
         */
        destroy: function () {
            this._super.apply(this);
        },

        /**
         * 取得name space
         */
        get_name_space: function () {
            return this.project_info.name;
        },

        /**
         * 生成py文件
         */
        gen_model_file: function () {
            var fields_infos = []
            _.each(this.fields, function (field) {
                fields_infos.push(field.gen_code());
            })

            var txt = qweb.render('funenc.modeler_model_template', {
                fields_infos: fields_infos,
                table_info: this.table_info,
                fields: this.fields
            });

            return txt;
        },

        escape_dot: function (name) {
            if (name) {
                var rst_name = name.replace(/\./g, "_")
                return rst_name
            }
            return name;
        },

        /**
         * gen views
         */
        gen_views: function () {
            _.each(this.fields, function (field) {
                field.xml = field.gen_xml()
            })

            var str = qweb.render("funenc.modeler_view_template", {
                "table": this.table_info,
                "fields": this.fields,
                "escape_dot": this.escape_dot
            })

            return _.unescape(str)
        },

        gen_csv_file: function () {
            var txt = qweb.render('funenc.modeler_csv_template', {
                tables: [this]
            });
            return txt;
        },

        gen_csv_file_simple: function () {
            var txt = qweb.render('funenc.modeler_csv_template_simple', {
                tables: [this]
            });
            return txt;
        },

        /**
         * 单独下载表相关的文件
         */
        download_table_files: function () {

            // py files
            var model_file = this.gen_model_file();
            var blob = new Blob([model_file], { type: "text/plain;charset=utf-8" });
            saveAs(blob, this.table_info.name + ".py");

            // xml files
            var view_xml = this.gen_views();

            // csv files
            var csv = this.gen_csv_file();

            var blob = new Blob([view_xml, csv], { type: "text/plain;charset=utf-8" });
            saveAs(blob, this.table_info.name + ".xml");
        },

        /**
         * save local file
         */
        save_table_files: function () {
            var self = this
            //  get the save dir
            this._rpc({
                "model": "odoo_modeler.modeler_config",
                "method": "get_save_dir",
                "args": []
            }).then(function (rst) {

                if (!rst || rst == '') {
                    self.do_warn('提示', '当前用户没有设置保存目录');
                    return
                }

                // save dir
                var save_dir = rst

                // py files
                var model_file = self.gen_model_file();

                // xml files
                var view_xml = self.gen_views();

                // csv files
                var csv = self.gen_csv_file_simple();

                // save table file
                var data = {
                    cmd: "save_file",
                    model_file: model_file,
                    model_file_name: "/models/" + self.table_info.name + ".py",
                    model_init_file_name: "/models/__init__.py",
                    model_init: "\nfrom . import " + self.table_info.name,
                    view_xml: view_xml,
                    view_file_name: "/views/" + self.table_info.name + ".xml",
                    csv: csv,
                    // 这个实际上是需要追加文件内容
                    csv_file_name: "/security/ir.model.access.csv",
                    manifest_file_name: '__manifest__.py',
                    manifest_file_content: ",'/views/" + self.table_info.name + ".xml'",
                    save_dir: save_dir
                }

                window.cefQuery({
                    request: JSON.stringify(data),
                    persistent: false,
                    onSuccess: function (response) {
                        self.do_warn('提示', '保存成功');
                    },
                    onFailure: function (error_code, error_message) {
                        self.do_warn('提示', '保存失败');
                    }
                })
            })
        },

        /**
         * 导出文件
         */
        export_table_files: function () {
            var ret = []

            ret.push({
                file_name: 'models/' + this.table_info.name + ".py",
                data: this.gen_model_file()
            })

            // xml files
            var view_xml = this.gen_views();
            ret.push({
                file_name: "views/" + this.table_info.name + ".xml",
                data: view_xml
            })

            // var blob = new Blob([list_view, form_view, action_window], { type: "text/plain;charset=utf-8" });
            // saveAs(blob, this.table_info.name + ".xml");

            return ret;
        },

        /**
         * 编辑表格模型
         */
        _on_edit_table: function () {
            event.preventDefault();

            var self = this;
            this.do_action({
                type: 'ir.actions.act_window',
                view_type: 'form',
                view_mode: 'form',
                res_id: this.table_info.id,
                res_model: "odoo_modeler.model_tables",
                target: 'new',
                views: [[false, 'form']]
            }, {
                    on_close: function (res) {
                        if (!res) {
                            return
                        }
                        // update the table info, to do update the table info
                        self.$('.table_name').text(res.name);
                    }
                });
        },

        is_in_cef: function () {
            if (window.cefQuery) {
                return true
            } else {
                return false
            }
        },

        /**
         * 由于字段是唯一的，所以通过字段来区
         * @param {} field_id 
         */
        remove_dest_connection: function (field_id) {
            if (!field_id) {
                return
            }
            _.each(this.fields, function (field) {
                var con = field.find_dest_connection(field_id)
                if (con) {
                    field.remove_connection(con)
                }
            })
        },

        remove_dest_table_connection: function (table_id) {
            if (!table_id) {
                return
            }
            _.each(this.fields, function (field) {
                var con = field.find_dest_table_connection(table_id)
                if (con) {
                    field.remove_connection(con)
                }
            })
        },

        /**
         * 删除表格
         */
        _on_del_table: function (event) {
            event.preventDefault()

            if (this.table_info.project_id[0] != this.project_info.id) {
                this.do_warn('警告', '不要删除外部项目数据!');
                return;
            }

            var self = this;
            _.each(this.fields, function (field) {
                // 销毁的时候会自动移除连接
                field.destroy();
            })

            // 从数据库中移除table
            this._rpc({
                model: "odoo_modeler.model_tables",
                method: "del_table",
                args: [this.table_info.id]
            }).then(function (res) {
                // 先删除连接到自向的connection
                core.bus.trigger('funec_modeler_remove_dest_table_con', {
                    table_id: self.table_info.id
                });
                self.destroy()
            })
        },

        /**
         * 移除字段, 具体移除链接等在字段中进行
         */
        del_field: function (field) {
            var def = $.Deferred();
            var index = _.find(this.fields, function (tmp) {
                return tmp == field
            })
            if (index != -1) {
                this.fields.splice(index, 1);
                this._rpc({
                    model: "odoo_modeler.model_table_fields",
                    method: "del_field",
                    args: [field.field_info.id]
                }).then(function (res) {
                    def.resolve();
                }).fail(function () {
                    def.reject();
                })
            } else {
                console.log('can not find the field');
                def.reject();
            }
        },

        /**
         *  单独生成table的数据
         */
        _on_gen_table: function (event) {
            event.preventDefault();
            if (this.is_in_cef()) {
                this.save_table_files();
            } else {
                this.download_table_files();
            }
        }
    });

    return ModelerTable;
});
