from nicegui import ui

a = f''


ui.add_head_html("<style>.my-label {background: rgb(0, 0, 255)}</style>")
ui.add_body_html(
    """
<div>
    <span>
    text or something, idk
    </span>
</div>
""",
    shared=True,
)

ui.add_css(r"""
.red {
    color: red;
}
""")
ui.add_scss(
    """
    .green {
        background-color: lightgreen;
        .blue {
            color: blue;
        }
    }
    """,
    indented=True,
)
ui.add_sass(
    """
    .yellow
        background-color: yellow
        .purple
            color: purple
"""
)

tree = ui.tree()

tree.add_slot(
    "default-header",
    '<span :props="props">Node <strong>{{ props.node.id }}</strong></span>',
)
tree.add_slot(
    "default-header",
    '<span :props="props">Node <strong>{{ props.node.id }}</strong></span>',
)
tree.add_slot(
    "default-body",
    """
    <span :props="props">Description: "{{ props.node.description }}"</span>
""",
)
tree.add_slot(
    "default-body",
    """
    <span :props="props">Description: "{{ props.node.description }}"</span>
""",
)

with ui.row().classes("w-full").style("background-color=red;"):
    pass

ui.run()
