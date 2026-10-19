import pytest
from pydantic import ValidationError
from app.schemas import ItemCreate


def valid_item_data():
    return {
        "ItemCode": "ITEM-001",
        "ItemReference": "Test item",
        "Width": 100,
        "Length": 200,
        "Depth": 50,
        "Weight": 1.5,
        "Quantity": 1,
        "BoxGroup": "GROUP-A",
        "Fragile": False,
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("Width", 0),
        ("Length", -1),
        ("Depth", 0),
        ("Weight", -0.01),
        ("Quantity", 0),
        ("ItemCode", "   "),
        ("ItemReference", "   "),
    ],
)
def test_item_rejects_invalid_values(field, value):
    data = valid_item_data()
    data[field] = value

    with pytest.raises(ValidationError):
        ItemCreate(**data)


def test_item_accepts_valid_values_and_trims_text():
    data = valid_item_data()
    data["ItemCode"] = "  ITEM-001  "
    data["ItemReference"] = "  Test item  "
    data["BoxGroup"] = "  GROUP-A  "
    item = ItemCreate(**data)
    assert item.ItemCode == "ITEM-001"
    assert item.ItemReference == "Test item"
    assert item.BoxGroup == "GROUP-A"


def test_blank_optional_box_group():
    data = valid_item_data()
    data["BoxGroup"] = "   "
    item = ItemCreate(**data)
    assert item.BoxGroup is None