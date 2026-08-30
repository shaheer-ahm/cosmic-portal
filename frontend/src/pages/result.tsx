import { Box, Download } from "lucide-react";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/statusBadge";

const mockBoxes = [
  {
    id: 1,
    reference: "MED",
    items: 8,
    packedWeight: 10.4,
    maxWeight: 15.2,
    utilisation: 68,
  },
  {
    id: 2,
    reference: "SML",
    items: 3,
    packedWeight: 5.2,
    maxWeight: 8.5,
    utilisation: 61,
  },
  {
    id: 3,
    reference: "SML",
    items: 1,
    packedWeight: 1,
    maxWeight: 8.5,
    utilisation: 12,
  },
];

export function ResultPage() {
  const { orderId } = useParams();

  const orderRef = orderId || "ORD-2847";

  const totalPackedWeight = mockBoxes.reduce(
    (total, box) => total + box.packedWeight,
    0,
  );

  const totalMaxWeight = mockBoxes.reduce(
    (total, box) => total + box.maxWeight,
    0,
  );

  const totalWeightPercent =
    (totalPackedWeight / totalMaxWeight) * 100;

  const exportResult = () => {
    const result = {
      orderRef,
      status: "Completed",
      itemsPacked: 12,
      boxesUsed: 3,
      unpacked: 0,
      totalPackedWeight,
      totalMaxWeight,
      boxes: mockBoxes,
    };

    const blob = new Blob(
      [JSON.stringify(result, null, 2)],
      {
        type: "application/json",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${orderRef}-result.json`;

    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title={orderRef}
        right={<StatusBadge status="Completed" />}
      />

      <main className="px-5 py-5">
        <section>
          <h2 className="text-xl font-bold text-white">
            Packing Result
          </h2>

          <p className="mt-1 text-xs text-[#777d92]">
            Completed in 1.34s • Aug 17, 09:42 AM
          </p>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-[#777d92]">
              Items packed
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              12
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
              of 12
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#777d92]">
              Boxes used
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              3
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
              Total
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#777d92]">
              Unpacked
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              0
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
              items
            </p>
          </Card>
        </section>

        <Card className="mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-[#777d92]">
              Total weight
            </span>

            <span className="text-sm text-[#d9dbe2]">
              {totalPackedWeight.toFixed(1)} /{" "}
              {totalMaxWeight.toFixed(1)} kg
            </span>
          </div>

          <ProgressBar value={totalWeightPercent} />

          <p className="mt-2 text-right text-xs text-[#777d92]">
            {Math.round(totalWeightPercent)}%
          </p>
        </Card>

        <section className="mt-7">
          <h2 className="text-xl font-bold text-white">
            Packing Plan
          </h2>

          <div className="mt-4 space-y-4">
            {mockBoxes.map((box) => (
              <Card key={box.id} className="p-4">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#2d3150] text-[#727eff]">
                    <Box className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          Box {box.id}
                        </h3>

                        <span className="rounded-lg bg-[#343760] px-2 py-1 text-xs font-semibold text-[#8c95ff]">
                          {box.reference}
                        </span>
                      </div>

                      <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
                        {box.items}{" "}
                        {box.items === 1
                          ? "item"
                          : "items"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-[#777d92]">
                      Weight
                    </p>

                    <p className="mt-1 text-sm text-[#dedfe5]">
                      {box.packedWeight.toFixed(1)} /{" "}
                      {box.maxWeight.toFixed(1)} kg
                    </p>

                    <div className="mt-3">
                      <ProgressBar
                        value={box.utilisation}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-[#777d92]">
                      <span>Utilisation</span>
                      <span>{box.utilisation}%</span>
                    </div>

                    <button
                      type="button"
                      className="mt-4 w-full rounded-xl border border-[#343842] bg-[#292c34] px-4 py-3 text-sm text-[#e1e2e6]"
                    >
                      View packing layout
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={exportResult}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#383c49] bg-[#252831] px-5 py-4 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4" />
          Export result
        </button>
      </main>
    </AppShell>
  );
}

export default ResultPage;