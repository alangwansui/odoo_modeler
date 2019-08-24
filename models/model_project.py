# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ModelProject(models.Model):
    '''
    model project
    '''
    _name = 'odoo_modeler.model_project'

    name = fields.Char(string="name", required=True)
    cn_name = fields.Char(string="chinese name", default="hello")
    summary = fields.Text(string="summary", default="funenc auto gen project")
    description = fields.Text(string="description", default="funenc auto gen project")
    tables = fields.One2many(string="tables",
                             comodel_name="odoo_modeler.model_tables",
                             inverse_name="project_id")
    out_projects = fields.Many2many(string="out_projects",
                                    comodel_name="odoo_modeler.model_project",
                                    relation="out_projects_rel",
                                    column1="src_project",
                                    column2="dst_project",
                                    ondelete='restrict')
    tables_count = fields.Integer(string="tables count", compute="calc_tables_count")
    name_space = fields.Char(string="project", default="funenc", help="project name")
    author = fields.Char(string="author", default="crax")
    website = fields.Char(string="comp url", default="http://www.funenc.com")
    category = fields.Char(string="category", default="funenc")
    depends = fields.Text(string="depends", default="'base'")
    version = fields.Text(string="version", default="1.0")
    remark = fields.Char(string="remark")

    @api.model
    def calc_tables_count(self):
        '''
        calc tables count
        :return:
        '''
        for record in self:
            record.tables_count = len(record.tables)

    @api.multi
    def export_export_csv(self):
        '''
         导入楼据结构
        :return:
        '''
        pass

    @api.multi
    def get_project_info(self):
        '''
        get project info, include table info and fields info
        :return:
        '''

        # 取得所有的表信息
        cur_project_id = self.id
        ret = self.read()[0]
        ids = self.out_projects.ids
        ids.append(self.id)
        self = self.browse(ids)

        table_ids = self.mapped("tables.id")
        ret["tables"] = self.env['odoo_modeler.model_tables']\
            .search_read([('id', 'in', table_ids)])

        field_ids = self.mapped("tables.table_fields.id")
        field_selections_ids = self.mapped("tables.table_fields.selections.id")
        field_infos = self.env['odoo_modeler.model_table_fields']\
            .search_read([('id', 'in', field_ids)])

        # get all the field selections
        field_selections = self.env['odoo_modeler.model_field_selections']\
            .search_read([('id', 'in', field_selections_ids)])
        field_selections_cache = dict()
        for selection in field_selections:
            if selection['owner_id'][0] not in field_selections_cache:
                field_selections_cache[selection['owner_id'][0]] = [selection]
            else:
                field_selections_cache[selection['owner_id'][0]].append(selection)

        feilds = self.env['odoo_modeler.model_table_fields'].browse(field_ids)
        project_ids = feilds.mapped("comodel_id.project_id")
        project_infos = project_ids.read()
        project_info_cache = {info['id']: info for info in project_infos}

        # cache all the fields
        table_fields_cache = dict()
        for field_info in field_infos:
            if field_info['id'] in field_selections_cache:
                field_info['selections'] = field_selections_cache[field_info['id']]

            # 关联项目
            if field_info['field_type'] in ['Many2one', 'One2many', 'Many2many'] and field_info['comodel_id'] \
                    and field_info['com_project_id'] and field_info['com_project_id'][0] in project_info_cache:
                field_info['com_project_info'] = project_info_cache[field_info['com_project_id'][0]]

            if field_info['table_id'][0] not in table_fields_cache:
                table_fields_cache[field_info['table_id'][0]] = [field_info]
            else:
                table_fields_cache[field_info['table_id'][0]].append(field_info)

        # set table fileds
        for table in ret["tables"]:
            if table['id'] in table_fields_cache:
                table['table_fields'] = table_fields_cache[table['id']]

        # get all the ui data ui_data
        ui_data_ids = self.mapped("tables.ui_data.id")
        ui_infos = self.env['odoo_modeler.model_table_ui']\
            .search_read([('id', 'in', ui_data_ids), ('project_id', '=', cur_project_id)])
        ui_info_cache = dict()
        for ui_info in ui_infos:
            ui_info_cache[ui_info['table_id'][0]] = ui_info

        # set ui data
        for table in ret["tables"]:
            if table['ui_data']:
                pos_id = table['id']
                if pos_id in ui_info_cache:
                    table['ui_pos'] = ui_info_cache[pos_id]
            else:
                table['ui_pos'] = False

        return ret


