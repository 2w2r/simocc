"use client"

import { useEffect, useState } from "react"

import { Minus, Plus } from "lucide-react"

import { searchAircraftTypes } from "@/actions/fleet"
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
import { AircraftType, CustomAircraftType } from "@/components/ops/fleet/types"

function formatAircraftTypeName(type: AircraftType): string {
    return `${type.manufacturer} ${type.model}`
}

export function FleetFormAircraftTypeCombobox({
    customAircraftTypes,
    selectedAircraftType,
    onAircraftTypeChange,
    onAddCustomAircraftType,
    onRemoveCustomAircraftType,
}: {
    customAircraftTypes: CustomAircraftType[]
    selectedAircraftType: AircraftType | null
    onAircraftTypeChange: (type: AircraftType | null) => void
    onAddCustomAircraftType: () => void
    onRemoveCustomAircraftType: () => Promise<void>
}) {
    const [typeQuery, setTypeQuery] = useState("")
    const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([])

    useEffect(() => {
        if (typeQuery.length < 1) {
            setAircraftTypes([])
            return
        }
        const timeout = setTimeout(async () => {
            const results = await searchAircraftTypes(typeQuery)
            setAircraftTypes(results)
        }, 200)
        return () => clearTimeout(timeout)
    }, [typeQuery])

    return (
        <Combobox
            items={aircraftTypes}
            itemToStringLabel={(type) =>
                `${type.icaoCode}  ·  ${formatAircraftTypeName(type)}`
            }
            value={selectedAircraftType}
            onValueChange={(type) => {
                onAircraftTypeChange((type as AircraftType) ?? null)
                setTypeQuery("")
            }}
        >
            <ComboboxInput
                placeholder="Type"
                className="text-sm"
                showClear
                onChange={(e) => setTypeQuery(e.target.value)}
                onBlur={() => setTimeout(() => setTypeQuery(""), 200)}
            />
            <ComboboxContent>
                <ComboboxList>
                    {(type) => (
                        <ComboboxItem key={type.id} value={type}>
                            <span className="w-12 shrink-0 font-mono text-sm">
                                {type.icaoCode}
                            </span>
                            <span
                                className="truncate text-muted-foreground"
                                title={formatAircraftTypeName(type)}
                            >
                                {formatAircraftTypeName(type)}
                            </span>
                            {type.deprecated && (
                                <span className="ml-auto shrink-0 rounded-sm bg-muted px-1 text-[10px] font-medium uppercase text-muted-foreground">
                                    Deprecated
                                </span>
                            )}
                        </ComboboxItem>
                    )}
                </ComboboxList>
                {typeQuery.length === 0 ? (
                    <ButtonGroup className="mx-1 mb-1 w-[calc(100%-0.5rem)] group-data-empty/combobox-content:mt-1">
                        <Button variant="outline" size="icon" onClick={onAddCustomAircraftType}>
                            <Plus className="size-3.5" />
                        </Button>
                        <ButtonGroupText className="flex-1 justify-center text-sm">
                            Custom Type
                        </ButtonGroupText>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={customAircraftTypes.length === 0}
                            onClick={onRemoveCustomAircraftType}
                        >
                            <Minus className="size-3.5" />
                        </Button>
                    </ButtonGroup>
                ) : (
                    <ComboboxEmpty>No aircraft types found.</ComboboxEmpty>
                )}
            </ComboboxContent>
        </Combobox>
    )
}
