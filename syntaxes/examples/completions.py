from nicegui import ui


with ui.row().classes(''):
    ui.button('1')
    ui.button('2')

ui.button().on('')
ui.button().props('')

ui.card().props('')
ui.card().style('')

ui.table().props('')
ui.table().run_method('')
ui.table().on('')

with ui.table() as table:
    table.props('')
    table.on('')
    table.run_method('')
    table.add_slot('')

button = ui.button()
button.props('')

with ui.button() as btn:
    btn.props('')

class MyCard(ui.card):
    def __init__(self):
        super().__init__()

        self.props('')

card = MyCard()
card.props('')
card.on('')