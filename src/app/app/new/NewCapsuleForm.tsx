"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createCapsule, type CreateCapsuleState } from "../actions";

const initial: CreateCapsuleState = {};

const fieldClass =
  "min-h-12 w-full rounded-xl border border-line bg-night px-4 text-ink placeholder:text-ink-faint focus:border-glow focus:outline-none";

const labelClass = "font-mono text-xs uppercase tracking-[0.15em] text-ink-dim";

export function NewCapsuleForm() {
  const [state, formAction, pending] = useActionState(createCapsule, initial);

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={labelClass}>
            Wie hieß euer Erlebnis?
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            placeholder="z.B. Toskana, September"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="drip_interval" className={labelClass}>
            Wie oft neue Fotos?
          </label>
          <select id="drip_interval" name="drip_interval" className={fieldClass}>
            <option value="daily">Täglich ein Schub</option>
            <option value="weekly">Wöchentlich ein Schub</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="duration_days" className={labelClass}>
              Über wie viele Tage?
            </label>
            <input
              id="duration_days"
              name="duration_days"
              type="number"
              min={1}
              max={90}
              defaultValue={14}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="photos_per_release" className={labelClass}>
              Fotos pro Schub
            </label>
            <input
              id="photos_per_release"
              name="photos_per_release"
              type="number"
              min={1}
              max={10}
              defaultValue={1}
              className={fieldClass}
            />
          </div>
        </div>

        {state.error && <p className="text-sm text-coral">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Wird angelegt…" : "Kapsel anlegen"}
        </Button>
      </form>
    </Card>
  );
}
