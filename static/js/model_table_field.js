/**
 * modeler client
 */
odoo.define('funenc.modeler.TableField', function (require) {
    "use strict";

    var Widget = require('web.Widget');
    var core = require('web.core');

    var TableField = Widget.extend({
        template: 'funenc.modeler.field_item',
        field_info: undefined,
        table_id: undefined,
        modeler_instance: undefined,
        connections: [],

        events: {
            'click .edit': '_on_edit_field',
            'click .delete': '_on_del_field'
        },

        /**
         * 
         * @param {*} parent 
         * @param {*} field_info 
         */
        init: function (parent, field_info) {
            this.connections = [];
            this.field_info = _.clone(field_info);
            this.project_info = parent.project_info
            this.table_id = parent.get_table_id();
            this.modeler_instance = parent.get_modeler_instance();
            this._super.apply(this, arguments);
        },

        /**
         * 开始
         */
        start: function () {
            this._super.apply(this, arguments);
            $(self.$('.field_name')).tooltip({
                delay: 0
            })
        },

        /**
         * 设置连接
         * @param {*} con 
         */
        add_connection: function (con) {
            this.connections.push(con);
        },

        /**
         * 编辑字段
         */
        _on_edit_field: function () {
            event.preventDefault();
            var self = this;
            this.do_action({
                type: 'ir.actions.act_window',
                view_type: 'form',
                view_mode: 'form',
                res_model: "odoo_modeler.model_table_fields",
                res_id: this.field_info.id,
                target: 'new',
                views: [[false, 'form']]
            }, {
                    on_close: function (res) {
                        if (!res) {
                            return
                        }
                        self._update_field_info();
                    }
                });
        },

        /**
         * 更新字段信
         * @param {} field_id 
         */
        _update_field_info: function () {
            var self = this;
            this._rpc({
                model: "odoo_modeler.model_table_fields",
                method: "get_field_info",
                args: [this.field_info.id]
            }).then(function (res) {
                console.log(res);

                var old_field_info = self.field_info
                self.field_info = res;
                // 更新显示
                self.$('.field_type').text('(' + self.field_info.field_type + ")");
                self.$('.field_name').text(self.field_info.name + '(' + self.field_info.cn_name + ')');
                // 检查类型是否发生改变，如果发生改变需要重新关联
                var need_reconnect = false;
                // 关联类型发生变化
                if (self._is_relation_field(old_field_info) != self._is_relation_field(self.field_info)) {
                    need_reconnect = true;
                } else if (old_field_info.name != self.field_info.name) { // 名称发生变化
                    need_reconnect = true;
                }
                // 通知table重新联接
                if (need_reconnect) {
                    self.trigger_up('update_field_con', { field: self });
                }
                self.$('.field_name').attr('title', self.field_info.remark);
            })
        },

        /** 
         * 是否是关联字段
         */
        _is_relation_field: function (info) {
            if (info.field_type == 'Many2one'
                || info.field_type == 'One2many'
                || info.field_type == 'Reference') {
                return true;
            }
            return false;
        },

        /**
         * 删除字段
         */
        _on_del_field: function (event) {
            // 禁止事件传递
            event.preventDefault();

            // 从表格中移除这字段
            this.getParent().del_field(this);

            // 从dom中移除
            this.destroy();
        },

        /**
         * 重新计算容器坐标
         */
        revalidate: function () {
            self.modeler_instance.revalidate(this.$el);
        },

        /**
         * 移除连接
         */
        destroy: function () {
            // 移除和这个字段连接的项, 根据 id 进行区分
            core.bus.trigger('funec_modeler_remove_dest_con', {
                field_id: this.field_info.id
            });

            // 删除连接
            this.remove_connection();

            // 调用
            this._super.apply(this, arguments);
        },

        /**
         * 移除连接, 如果传入了con则移降指写的con, 否则移除所有的con
         */
        remove_connection: function (con) {
            var self = this;
            if (con) {
                var index = _.findIndex(this.connections, function (tmp_con) {
                    return tmp_con;
                })
                if (index != -1) {
                    var con = this.connections[index];
                    self.modeler_instance.deleteConnection(con);
                    this.connections.splice(index, 1);
                }
            } else {
                _.each(this.connections, function (conn) {
                    self.modeler_instance.deleteConnection(conn);
                })
                self.connections = []
            }
        },

        find_dest_connection: function (field_id) {
            var con = _.find(this.connections, function (tmp_con) {
                var target_field_id = tmp_con.getParameter('target_field_id')
                return target_field_id == field_id;
            })
            return con;
        },

        find_dest_table_connection: function (table_id) {
            var con = _.find(this.connections, function (tmp_con) {
                var target_table_id = tmp_con.getParameter('target_table_id')
                return target_table_id == table_id;
            })
            return con;
        },

        /**
         * 生成代码
         */
        gen_code: function () {
            var res = this.field_info.name + " = ";
            switch (this.field_info.field_type) {
                case 'Char':
                    res += "fields.Char("
                    break;
                case 'Integer':
                    res += "fields.Char("
                    break;
                case 'Text':
                    res += "fields.Text("
                    break;
                case 'Binary':
                    res += "fields.Binary("
                    break;
                case 'Float':
                    res += "fields.Float("
                    break;
                case 'Reference':
                    res += "fields.Reference("
                    break;
                case 'Html':
                    res += "fields.Html("
                    break;
                case 'Many2one':
                    res += "fields.Many2one("
                    break;
                case 'Many2many':
                    res += "fields.Many2many("
                    break;
                case 'One2many':
                    res += "fields.One2many("
                    break;
                case 'Selection':
                    res += "fields.Selection("
                    break
                case 'Boolean':
                    res += "fields.Boolean("
                    break
                case 'Date':
                    res += "fields.Date("
                    break
                case 'DateTime':
                    res += "fields.Datetime("
                    break
            }
            var attrs = this.deal_attrs();
            res += attrs;
            res += ")"
            return res;
        },

        /**
         * gen xml for field
         */
        gen_xml: function () {
            var res = '<field name="' + this.field_info.name + '"/>'
            return res;
        },

        /**
         * 产生选项
         */
        gen_selection: function () {
            var ret = []
            _.each(this.field_info.selections || [], function (selection) {
                ret.push("(\'" + selection.key + "\', \'" + selection.val + "\')");
            })
            var res = ret.join(', ')
            return res;
        },

        /**
         * 处理属性
         */
        deal_attrs: function () {
            var attrs = []

            // 没有填cn_name的时候使用name
            if (this.field_info.cn_name) {
                attrs.push("string='" + this.field_info.cn_name + "'")
            } else {
                attrs.push("string='" + this.field_info.name + "'")
            }

            if (this.field_info.related) {
                attrs.push("related='" + this.field_info.related + "'")
            } else {
                switch (this.field_info.field_type) {
                    case 'Many2many':
                        if (!this.field_info.com_project_info) {
                            console.log(this.field_info);
                            this.do_notify('提示', '关联模型未选择' + this.field_info.name);
                            break
                        }
                        // 先要取得关联模型的名称
                        attrs.push("comodel_name='" + this.field_info.com_project_info.name + "." + this.field_info.comodel_id[1] + "'")
                        if (this.field_info.relation)
                            attrs.push("relation='" + this.field_info.relation + "'")
                        if (this.field_info.col1 && this.field_info.col2) {
                            attrs.push("col1='" + this.field_info.col1 + "'")
                            attrs.push("col2='" + this.field_info.col2 + "'")
                        }
                        break;
                    case 'One2many':
                        if (!this.field_info.com_project_info) {
                            console.log(this.field_info);
                            this.do_notify('提示', '关联模型未选择' + this.field_info.name);
                            break
                        }
                        attrs.push("comodel_name='" + this.field_info.com_project_info.name + "." + this.field_info.comodel_id[1] + "'")
                        attrs.push("inverse_name='" + this.field_info.inverse_name[1] + "'")
                        break;
                    case 'Many2one':
                        if (!this.field_info.com_project_info) {
                            console.log(this.field_info);
                            this.do_notify('提示', '关联模型未选择' + this.field_info.name);
                            break
                        }
                        attrs.push("comodel_name='" + this.field_info.com_project_info.name + "." + this.field_info.comodel_id[1] + "'")
                        break;
                    case 'Selection':
                        attrs.push('selection=[' + this.gen_selection() + "]")
                        break;
                }
            }

            if (this.field_info.field_widget) {
                attrs.push("widget='" + this.field_info.field_widget + "'")
            }

            if (this.field_info.default) {
                attrs.push("default='" + this.field_info.default + "'")
            }

            if (this.field_info.domain) {
                attrs.push("domain=\"" + this.field_info.domain + "\"")
            }

            if (this.field_info.compute_type) {
                attrs.push("compute='" + this.field_info.compute + "'")
            }

            if (this.field_info.help) {
                attrs.push("help='" + this.field_info.help + "'")
            }

            if (this.field_info.attrs) {
                attrs.push("attrs='" + this.field_info.attrs + "'")
            }

            return attrs.join(", ");
        }
    });

    return TableField;
});
