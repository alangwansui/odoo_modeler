
# -*- coding: utf-8 -*-

from odoo import models, fields, api


class VscodeSnippets(models.Model):
    '''
    vs code snippets heler
    '''
    _name = 'odoo_modeler.vscode_snippets'
    
    source = fields.Text(string='源码')
    target = fields.Text(string='目标')

    @api.onchange("source")
    def on_change_source(self):
        '''
        生成目标
        :return:
        '''
        self.target = str(self.source).replace('\n', '\\n')\
            .replace('\t', '\\t')\
            .replace('\"', '\\"')
