# -*- coding: utf-8 -*-

from odoo import http
import xlwt
from odoo.http import request


class OdooModelerController(http.Controller):
    '''
    模型控制器
    '''

    @http.route('/funenc_modeler/export_xls', type='http', auth="user")
    def export_xls(self, project_id, token):
        '''
        导出项目数据模型
        :param project_id:
        :param token:
        :return:
        '''
        project = request.env['odoo_modeler.model_project'].browse(int(project_id))
        tables = project.tables

        workbook = xlwt.Workbook()
        worksheet = workbook.add_sheet(project.name)
        row_index = 0
        for table in tables:
            row_index += 1
            worksheet.write(row_index, 0, table['name'])
            row_index += 1
            worksheet.write(row_index, 0, '名称')
            worksheet.write(row_index, 1, '字段')
            worksheet.write(row_index, 2, '类型')
            row_index += 1
            for field in table.table_fields:
                worksheet.write(row_index, 0, field.cn_name)
                worksheet.write(row_index, 1, field.name)
                worksheet.write(row_index, 2, field.field_type)
                row_index += 1

        response = request.make_response(None,
                                         headers=[('Content-Type', 'application/vnd.ms-excel'),
                                                  ('Content-Disposition', 'attachment; filename=project.xls')],
                                         cookies={'fileToken': token})
        workbook.save(response.stream)
        return response
