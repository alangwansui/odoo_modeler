# -*- coding: utf-8 -*-
{
    'name': "odoo_modeler",

    'summary': """
        odoo modeler, automatic generate related code and ui""",

    'description': """
        odoo modeler, automatic generate related code and views
    """,

    'author': "funenc",
    'website': "http://www.funenc.com",

    'category': 'funenc',
    'version': '0.1',

    'depends': ['base'],

    'data': [
        'security/ir.model.access.csv',
        'security/rules.xml',
        'views/assets.xml',
        'views/modeler_projects.xml',
        'views/modeler_tables.xml',
        'views/modeler_table_fields.xml',
        'views/vscode_snippets.xml',
        'views/modeler_config.xml'
    ],

    'qweb': [
        'static/xml/modeler_client.xml',
        'static/xml/modeler_templates.xml',
        'static/xml/manifest.xml',

        # init
        'static/xml/init_py_template.xml',

        # controller
        'static/xml/controller.xml',
        'static/xml/controller_init.xml',

        # model
        'static/xml/model_init.xml',
        'static/xml/model_template.xml',
        'static/xml/menu_root_template.xml',
        'static/xml/view_template.xml',
        'static/xml/csv_template.xml',
    ],
    'application': True
}