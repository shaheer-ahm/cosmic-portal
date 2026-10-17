from types import SimpleNamespace
import pytest
from app.solver_client import _item_payload


@pytest.mark.parametrize("fragile", [True, False])
def test_item_payload_sends_fragile_value(fragile):
    item = SimpleNamespace(
        ItemCode = "GLASS",
        ItemReference = "Fragile glass item",
        Width = 100,
        Length = 100,
        Depth = 100,
        Weight = 1.0,
        BoxGroup = None,
        Quantity = 1,
        KeepUpright = True,
        Fragile = fragile,
    )

    payload = _item_payload(item)

    assert "Fragile" in payload
    assert payload["Fragile"] is fragile