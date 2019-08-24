# -*- coding: utf-8 -*-

from odoo import models, fields, api


class FieldSelections(models.Model):
    '''
    字段选项
    '''
    _name = 'odoo_modeler.model_field_selections'

    key = fields.Char(string="key")
    val = fields.Char(string="val")
    owner_id = fields.Many2one(string="field_id", comodel_name="odoo_modeler.model_table_fields")

    @api.multi
    def get_selections(self):
        '''
        取得选项
        :return:
        '''
        return self.read()


class ModelTableFields(models.Model):
    '''
    模型字段
    '''
    _name = 'odoo_modeler.model_table_fields'
    _description = 'table fields'
    _order = 'index'

    @api.multi
    def get_table_domain(self):
        '''
        取得表格选择domain
        :return:
        '''
        if self.env.context.get("table_id"):
            table_id = self.env.context.get("table_id")
            table = self.env['odoo_modeler.model_tables'].browse(table_id)
            ids = [table.project_id.id]
            out_ids = table.project_id.out_projects.ids
            ids += out_ids
            domain = [('project_id', 'in', ids)]
            return domain
        else:
            return []

    cn_name = fields.Char(string="cn name")
    name = fields.Char(string="name")
    color = fields.Char(string="color")
    index = fields.Integer(string="integer", default=0)
    table_id = fields.Many2one(string="table id", comodel_name="odoo_modeler.model_tables")
    field_type = fields.Selection(selection=[
        ('Char', 'CHAR'),
        ('Integer', 'Integer'),
        ('Selection', 'Selection'),
        ('Text', 'Text'),
        ('Boolean', 'Boolean'),
        ('Binary', 'Binary'),
        ('Float', 'Float'),
        ('Html', 'Html'),
        ('Date', 'Date'),
        ('DateTime', 'DateTime'),
        ('Reference', 'Reference'),
        ('Many2one', 'Many2one'),
        ('Many2many', 'Many2many'),
        ('One2many', 'One2many')
    ], string="field type")

    comodel_id = fields.Many2one(string="comodel id",
                                 comodel_name="odoo_modeler.model_tables",
                                 domain=get_table_domain,
                                 ondelete='restrict')

    # 这里实际上指向的为id
    # 必需是commodel的字段
    inverse_name = fields.Many2one(string="inverse name",
                                   comodel_name="odoo_modeler.model_table_fields")

    col1 = fields.Char(string="col1")
    col2 = fields.Char(string="col2")

    field_widget = fields.Char(string="widget")
    default = fields.Char(string="default")
    domain = fields.Text(string="domain")
    domain_remark = fields.Text(string="domain remark")
    read_only = fields.Boolean(string="read only")
    invisible = fields.Boolean(string="read only")
    field_class = fields.Char(string="field class")
    related = fields.Char(string="related", help="field related")

    compute_type = fields.Selection(selection=[('auto', 'auto'), ('custom', 'custom')], string="compute type")
    compute = fields.Char(string="compute")
    compute_depends = fields.Char(string="compute depends")
    compute_method = fields.Text(string="compute_method", compute="_compute_compute_method")
    custom_compute = fields.Text(string="custom compute")
    com_project_id = fields.Many2one(related="comodel_id.project_id")

    attrs = fields.Text("attrs")
    selections = fields.One2many(comodel_name="odoo_modeler.model_field_selections", inverse_name="owner_id")
    option = fields.Text(string="option", help="option attrs")
    relation = fields.Char(string="relation", help="relation for many2many")

    help = fields.Char(string="help")
    remark = fields.Text(string="remark")

    @api.onchange('field_type')
    def on_change_field_type(self):
        '''
        动态计算domain
        :return:
        '''
        table_domain = self.get_table_domain()
        return {
             'domain': {
                 'comodel_id': table_domain
             }
        }

    @api.onchange('comodel_id')
    def on_change_comodel(self):
        '''
        只能选择comodel模型的字段
        :return:
        '''
        if self.comodel_id:
            return {
                "domain": {
                    "inverse_name": [('table_id', "=", self.comodel_id.id)]
                }
            }
        else:
            return {
                "domain": {
                    "inverse_name": [('table_id', "in", [])]
                }
            }

    @api.multi
    def get_field_info(self):
        '''
        取得字段信息, 同时读取了selection信息, 只有三种类型的关联字段才有值
        :param field_id:
        :return:
        '''
        res = self.read()[0]
        if self.field_type in ['Many2one', 'One2many', 'Many2many'] and self.comodel_id:
            com_project_id = self.comodel_id.project_id.id
            com_project_info = self.env['odoo_modeler.model_project']\
                .search_read([('id', '=', com_project_id)])
            res['com_project_info'] = com_project_info[0]
        else:
            res['com_project_info'] = False

        selections = self.selections.read()
        res['selections'] = selections
        return res

    @api.multi
    def get_fields_info(self):
        '''
        取得字段信息, 注意, 这个是读取多个字段
        :param field_id:
        :return:
        '''
        rst = []
        for record in self:
            rst.append(record.get_field_info())
        return rst

    @api.multi
    def del_field(self):
        '''
        删除字段
        :return:
        '''
        return self.unlink()

    @api.model
    def update_fields_index(self, infos):
        '''
        更新index
        :return:
        '''
        for info in infos:
            self.browse(info['id']).write({
                'index': info['index']
            })

    @api.onchange('compute', 'compute_depends')
    def _compute_compute_method(self):
        '''
        计处计算字段内容
        :return:
        '''
        for record in self:
            if record.compute:
                compute_str = ''
                if record.compute_depends:
                    compute_str += "@api.depends("
                    compute_str += record.compute_depends
                    compute_str += ")\n"
                compute_str += "    def "
                compute_str += record.compute
                compute_str += "(self):\n"
                compute_str += "        pass\n"
                record.compute_method = compute_str






