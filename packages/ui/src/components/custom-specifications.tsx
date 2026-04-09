"use client";

import { Controller, useFieldArray } from "react-hook-form";
import { Input } from "./input";
import { PlusCircle, Trash2 } from "lucide-react";

export function CustomSpecifications({ control, errors }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "customSpecifications",
  });

  return (
    <div>
      <label className="block font-semibold text-gray-300 mb-1">Custom Specifications</label>
      <div className="flex flex-col gap-3">
        {fields.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Controller
              name={`customSpecifications.${index}.name`}
              control={control}
              rules={{ required: "Specification name is required." }}
              render={({ field }) => <Input label="Specification Name" placeholder="e.g. Battery Life, Weight, Maerial" {...field} />}
            />

            <Controller
              name={`customSpecifications.${index}.value`}
              control={control}
              rules={{ required: "Value is required." }}
              render={({ field }) => <Input label="Value" placeholder="e.g. 4000mAh, 1.5kg, Plastic" {...field} />}
            />
            <button className="text-red-500 hover:text-red-700 mt-6" type="button" onClick={() => remove(index)}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        <button className="flex items-center gap-2 text-blue-500 hover:text-blue-600" type="button" onClick={() => append({ name: "", value: "" })}>
          <PlusCircle size={20} /> Add Specification
        </button>
      </div>
      {errors?.customSpecifications && <p className="text-red-500 text-xs mt-1">{errors.customSpecifications.message as string}</p>}
    </div>
  );
}
