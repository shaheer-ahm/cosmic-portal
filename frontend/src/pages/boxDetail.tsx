import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BoxDetailPage,
    FitSolverContractError,
    parsePackResponse,
    parseBoxSlug,
    type PackResponse,
} from "@comp4050-fiv/visualizer";

import { apiFetch } from "../lib/api";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";

interface OrderResultOut {
    order_id: number;
    result_data: unknown;
    created_at: string;
}

export default function BoxDetailRoute() {
    const { orderId, boxSlug } = useParams();
    const navigate = useNavigate();
    const [response, setResponse] = useState<PackResponse | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orderId) return;
        apiFetch<OrderResultOut>(`/orders/${orderId}/results`)
            .then((result) =>
                setResponse(parsePackResponse(result.result_data)),
            )
            .catch((err) =>
                setError(
                    err instanceof FitSolverContractError
                        ? "This packing result is not in a format the visualizer supports."
                        : err instanceof Error
                          ? err.message
                          : "Failed to load result.",
                ),
            );
    }, [orderId]);

    const boxIndex = boxSlug ? parseBoxSlug(boxSlug) : null;

    if (error || boxIndex === null) {
        return (
            <AppShell showBottomNav={false}>
                <main className="px-5 py-10">
                    <Card className="p-5 text-center text-sm text-red-400">
                        {error || "Box not found."}
                    </Card>
                </main>
            </AppShell>
        );
    }

    if (!response) {
        return (
            <AppShell showBottomNav={false}>
                <main className="px-5 py-10 text-center text-sm text-[#777d92]">
                    Loading…
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell showBottomNav={false}>
            <BoxDetailPage
                response={response}
                orderReference={`ORD-${orderId}`}
                boxIndex={boxIndex}
                onBack={() => navigate(`/orders/${orderId}`)}
            />
        </AppShell>
    );
}
