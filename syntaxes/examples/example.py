from nicegui import ui

tree = ui.tree([
    {'id': 'numbers', 'description': 'Just some numbers', 'children': [
        {'id': '1', 'description': 'The first number'},
        {'id': '2', 'description': 'The second number'},
    ]},
    {'id': 'letters', 'description': 'Some latin letters', 'children': [
        {'id': 'A', 'description': 'The first letter'},
        {'id': 'B', 'description': 'The second letter'},
    ]},
], label_key='id', on_select=lambda e: ui.notify(e.value))

tree.add_slot('default-header', '''
    <span :props="props">Node <strong>{{ props.node.id }}</strong></span>
''')
tree.add_slot('default-body', '''
    <span :props="props">Description: "{{ props.node.description }}"</span>
''')

ui.run()
