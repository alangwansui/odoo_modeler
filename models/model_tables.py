# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ModelTables(models.Model):
    '''
    model table descript
    '''
    _name = 'odoo_modeler.model_tables'
    _description = "table info"

    name = fields.Char(string="name", default='')
    model_class_name = fields.Char(string="model name", compute="compute_model_class_name")
    model_name = fields.Char(string="model name", compute="compute_model_name")
    cn_name = fields.Char(string="cn name", default='')

    remark = fields.Char(string="remark")

    project_id = fields.Many2one(comodel_name="odoo_modeler.model_project", string="project id")
    project_name = fields.Char(string="project name", related="project_id.name")
    ui_data = fields.One2many(string="ui data", comodel_name="odoo_modeler.model_table_ui", inverse_name="table_id")
    tree_js_class = fields.Char(string="list js_class")
    table_fields = fields.One2many(string="table fields",
                                   comodel_name="odoo_modeler.model_table_fields",
                                   inverse_name="table_id")
    fields_count = fields.Integer(string="fields_count")
    list_domain = fields.Text(string="list domain")
    sql_constrain = fields.Text(string="constrain")

    @api.depends("table_fields")
    def calc_fields_count(self):
        '''
        计算字段数量
        :return:
        '''
        for record in self:
            record.fields_count = len(record.table_fields)

    @api.multi
    def get_table_info(self):
        '''
        取得table_info
        :return:
        '''
        ret = self.read()[0]
        ret['ui_pos'] = self.ui_data.read()[0] if self.ui_data else []
        ret['table_fields'] = self.table_fields.get_fields_info() if self.table_fields else []
        return ret

    @api.multi
    def update_ui_pos(self, project_id, pos_x, pos_y):
        '''
        更新位置
        :param pos_x:
        :param pos_y:
        :return:
        '''
        old_record = self.env['odoo_modeler.model_table_ui']\
            .search([('table_id', '=', self.id), ('project_id', '=', project_id)])
        if len(old_record) > 0:
            old_record.write({
                'pos_x': pos_x,
                'pos_y': pos_y
            })
        else:
            self.env['odoo_modeler.model_table_ui'].create({
                'pos_x': pos_x,
                'pos_y': pos_y,
                'table_id': self.id,
                'project_id': project_id
            })

    @api.multi
    def del_table(self):
        '''
        删除表格
        :return:
        '''
        self.unlink()

    @api.multi
    def compute_model_class_name(self):
        '''
        计算表类名
        :return:
        '''
        for record in self:
            name = record.name
            if name != '':
                name = name.replace('_', '.')
                name_ar = name.split('.')
                res = ''
                for tmp in name_ar:
                    res += tmp.capitalize()
                record.model_class_name = res

    @api.multi
    def compute_model_name(self):
        '''
        计算表类名
        :return:
        '''
        for record in self:
            name_str = record.name
            if name_str != '':
                record.model_name = name_str.replace('.', '_')


class ModelTableUI(models.Model):
    '''
    table ui data
    '''
    _name = 'odoo_modeler.model_table_ui'

    table_id = fields.Many2one(strin="table_id", comodel_name="odoo_modeler.model_tables")
    # 由于存在外部引用, 所以
    project_id = fields.Many2one(comodel_name="odoo_modeler.model_project", string="project item pos")
    pos_x = fields.Integer(string="pos_x")
    pos_y = fields.Integer(string="pox_y")
    color = fields.Char(string="color")

