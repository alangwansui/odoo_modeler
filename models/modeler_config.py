
# -*- coding: utf-8 -*-

from odoo import models, fields, api, exceptions


class ModelerConfig(models.Model):
    '''
    model 配置
    '''
    _name = 'odoo_modeler.modeler_config'
    
    project_dir = fields.Char(string='项目目录')

    @api.model
    def jump_config_widow(self):
        '''
        跳转到添加页面,指定plan_type用于区分计划类型
        :return:
        '''
        records = self.search([('create_uid.id', '=', self.env.user.id)])

        if len(records) > 0:
            record = records[0]
        else:
            record = self.create([{'project_dir': ''}])

        return {
            "type": "ir.actions.act_window",
            "res_model": "odoo_modeler.modeler_config",
            'view_mode': 'form',
            "res_id": record.id,
            "views": [[self.env.ref('odoo_modeler.modeler_config_form').id, "form"]]
        }

    @api.model
    def get_save_dir(self):
        '''
        取得保存目录
        :return:
        '''
        records = self.search([('create_uid.id', '=', self.env.user.id)])
        if len(records) > 0:
            return records[0].project_dir
        else:
            raise exceptions.ValidationError('当前用户没有设置保存目录')
