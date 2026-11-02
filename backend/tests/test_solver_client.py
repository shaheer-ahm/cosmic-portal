from types import SimpleNamespace
import pytest
from app import solver_client
from app.solver_client import _box_type_payload, _item_payload
from app.schemas import SolverBox, SolverPlacedItem


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


def test_box_payload_omits_optional_none_values():
    box = SimpleNamespace(
        Reference = "SML",
        Width = 150,
        Length = 150,
        Depth = 150,
        MaxWeight = None,
        BoxWeight = None,
        Active = True,
        MaximumBoxes = None,
    )

    payload = _box_type_payload(box)

    assert payload == {
        "Reference": "SML",
        "Width": 150,
        "Length": 150,
        "Depth": 150,
        "Active": True,
    }


def test_box_payload_keeps_optional_values():
    box = SimpleNamespace(
        Reference = "MED",
        Width = 300,
        Length = 300,
        Depth = 300,
        MaxWeight = 8.5,
        BoxWeight = 0.5,
        Active = True,
        MaximumBoxes = 10,
    )

    payload = _box_type_payload(box)

    assert payload ["MaxWeight"] == 8.5
    assert payload ["BoxWeight"] == 0.5
    assert payload ["MaximumBoxes"] == 10


def test_solver_response_preserves_fragile_and_balance_fields():
    placed_item = SolverPlacedItem(
        Sequence = 0,
        InstanceId = "GLASS#1",
        ItemCode = "GLASS",
        ItemReference = "Glass",
        BoxGroup = None,
        Position = {"X": 0, "Y": 0, "Z": 0},
        Dimensions = {"Width": 100, "Length": 100, "Depth": 100},
        Orientation = {
            "Code": "WLD",
            "AxisMap": {"X": "Width", "Y": "Length", "Z": "Depth"},
            "RotationDegrees": {"X": 0, "Y": 0, "Z": 0},
        },
        Weight = 1.0,
        Fragile = True,
    )

    packed_box = SolverBox(
        BoxIndex = 0,
        Reference = "MED",
        BoxGroup = None,
        Dimensions = {"Width": 300, "Length": 300, "Depth": 300},
        ItemCount = 1,
        ItemsWeight = 1.0,
        BoxWeight = 0.5,
        TotalWeight = 1.5,
        MaxWeight = 8.5,
        VolumeUtilisation = 0.1,
        LoadHeight = 100,
        CentreOfGravity = {"X": 50, "Y": 50, "Z": 50},
        Balanced = True,
        Items = [placed_item],
    )

    saved_data = packed_box.model_dump()

    assert saved_data["Items"][0]["Fragile"] is True
    assert saved_data["CentreOfGravity"] == {"X": 50.0, "Y": 50.0, "Z": 50.0}
    assert saved_data["Balanced"] is True


def test_call_solver_sends_api_key_header(monkeypatch):
    item = SimpleNamespace(
        ItemCode = "ITEM-001",
        ItemReference = "Test item",
        Width = 100,
        Length = 100,
        Depth = 100,
        Weight = 1.0,
        BoxGroup = None,
        Quantity = 1,
        KeepUpright = False,
        Fragile = False,
    )

    box = SimpleNamespace(
        Reference = "SML",
        Width = 200,
        Length = 200,
        Depth = 200,
        MaxWeight = 10.0,
        BoxWeight = 0.5,
        Active = True,
        MaximumBoxes = 5,
    )

    captured_headers = {}

    class FakeResponse:
        status_code = 500
        text = "Test response"

        @staticmethod
        def json():
            return {"detail": "test response"}

    def fake_post(
            utl, *, json, headers, timeout,
    ):
        captured_headers.update(headers)
        return FakeResponse()

    monkeypatch.setattr(
        solver_client,
        "SOLVER_URL",
        "https://solver.example",
    )
    monkeypatch.setattr(
        solver_client,
        "FITSOLVER_API_KEY",
        "test-api-key"
    )
    monkeypatch.setattr(
        solver_client.httpx,
        "post",
        fake_post,
    )

    with pytest.raises(solver_client.SolverError):
        solver_client.call_solver([item], [box])

    assert captured_headers["X-API-Key"] == "test-api-key"