from nicegui import ui


with ui.row().classes(''):
    ui.button('1')
    ui.button('2')

ui.button().on('')

ui.card().props('')

ui.table().run_method('')


button = ui.button()
button.props('')  # <-- what about this

class MyCard(ui.card):
    def __init__(self):
        super().__init__()

        self.props('')  # <-- or this

card = MyCard()
card.props('')  # <-- or this