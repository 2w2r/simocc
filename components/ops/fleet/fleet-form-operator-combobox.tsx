"use client"

import { useEffect, useState } from "react"

import { Minus, Plus } from "lucide-react"

import { searchOperators } from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import {
    ButtonGroup,
    ButtonGroupText,
} from "@/components/ui/button-group"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { OperatorReference } from "@/lib/generated/prisma/client"
import { CustomOperator, Operator } from "@/components/ops/fleet/types"

function formatOperatorCode(operator: Operator): string {
    return `${operator.icaoCode ?? "———"}/${operator.iataCode ?? "——"}`
}

export function FleetFormOperatorCombobox({
    privateOperator,
    customOperators,
    selectedOperator,
    onOperatorChange,
    onAddCustomOperator,
    onRemoveCustomOperator,
}: {
    privateOperator: OperatorReference | null
    customOperators: CustomOperator[]
    selectedOperator: Operator | null
    onOperatorChange: (op: Operator | null) => void
    onAddCustomOperator: () => void
    onRemoveCustomOperator: () => Promise<void>
}) {
    const [operatorQuery, setOperatorQuery] = useState("")
    const [operators, setOperators] = useState<Operator[]>([])

    const operatorsWithPrivate = [
        ...operators,
        ...(privateOperator ? [privateOperator] : []),
    ]

    useEffect(() => {
        if (operatorQuery.length < 1) {
            setOperators([])
            return
        }
        const timeout = setTimeout(async () => {
            const results = await searchOperators(operatorQuery)
            setOperators(results)
        }, 200)
        return () => clearTimeout(timeout)
    }, [operatorQuery])

    return (
        <Combobox
            items={operatorsWithPrivate}
            itemToStringLabel={(op) =>
                op.id === "none"
                    ? "—/—  ·  No Operator"
                    : `${op.icaoCode ?? "—"}/${op.iataCode ?? "—"}  ·  ${op.name}`
            }
            value={selectedOperator}
            onValueChange={(op) => {
                onOperatorChange((op as Operator) ?? null)
                setOperatorQuery("")
            }}
        >
            <ComboboxInput
                placeholder="Operator"
                className="text-sm"
                showClear
                onChange={(e) => setOperatorQuery(e.target.value)}
                onBlur={() => setTimeout(() => setOperatorQuery(""), 200)}
            />
            <ComboboxContent>
                <ComboboxList>
                    {(operator) => (
                        <ComboboxItem key={operator.id} value={operator}>
                            <span className="w-16 shrink-0 font-mono text-sm">
                                {formatOperatorCode(operator)}
                            </span>
                            <span
                                className="truncate text-muted-foreground"
                                title={operator.name}
                            >
                                {operator.name}
                            </span>
                        </ComboboxItem>
                    )}
                </ComboboxList>
                {operatorQuery.length === 0 ? (
                    <ButtonGroup className="mx-1 mb-1 w-[calc(100%-0.5rem)]">
                        <Button variant="outline" size="icon" onClick={onAddCustomOperator}>
                            <Plus className="size-3.5" />
                        </Button>
                        <ButtonGroupText className="flex-1 justify-center text-sm">
                            Custom Operator
                        </ButtonGroupText>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={customOperators.length === 0}
                            onClick={onRemoveCustomOperator}
                        >
                            <Minus className="size-3.5" />
                        </Button>
                    </ButtonGroup>
                ) : (
                    <ComboboxEmpty>No operators found.</ComboboxEmpty>
                )}
            </ComboboxContent>
        </Combobox>
    )
}