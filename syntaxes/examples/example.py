from nicegui import ui

# HTML strings
ui.add_head_html("<style>.my-label {background: rgb(0, 0, 255)}</style>", shared=True)
ui.add_body_html('<div id="element">Test</div>')

# CSS/Style strings
ui.add_css(".red { color: red; }")
ui.add_scss("""
.green {
    background-color: lightgreen;
    .blue {
        color: blue;
    }
}
""")
ui.add_sass("""
.yellow
    background-color: yellow
    .purple
        color: purple
""")

# Slots
with ui.table() as table:
    with table.add_slot('top-row'):
        with table.row():
            with table.cell():
                ui.label('This is the top slot.')
    table.add_slot('body', '''
        <q-tr :props="props">
            <q-td key="name" :props="props">overridden</q-td>
            <q-td key="age" :props="props">
                <q-badge color="green">{{ props.row.age }}</q-badge>
            </q-td>
        </q-tr>
    ''')

ui.run()
