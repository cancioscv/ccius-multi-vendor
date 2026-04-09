"use client";

import { Controller } from "react-hook-form";
import { Input } from "./input";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export function CustomProperties({ control, errors }: any) {
  const [properties, setProperties] = useState<{ label: string; values: string[] }[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Controller
        name="customProperties"
        control={control}
        render={({ field }) => {
          useEffect(() => {
            field.onChange(properties);
          }, [properties]);

          function addProperty() {
            if (!newLabel.trim()) return;
            setProperties([...properties, { label: newLabel, values: [] }]);
            setNewLabel("");
          }

          function addValue(index: number) {
            if (!newValue.trim()) return;
            const updatedProperties = [...properties];
            updatedProperties[index].values.push(newValue);

            setProperties(updatedProperties);
            setNewValue("");
          }

          function removeProperty(index: number) {
            setProperties(properties.filter((_, i) => i !== index));
          }

          return (
            <div className="mt-2">
              <label className="block font-semibold text-gray-300 mb-1">Custom Properties</label>

              <div className="flex flex-col gap-3">
                {/* Existing properties */}
                {properties.map((property, index) => (
                  <div key={index} className="border border-gray-700 p-3 roundedlg bg-gray-900">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{property.label}</span>
                      <button type="button" onClick={() => removeProperty(index)}>
                        <X size={18} className="text-red-500" />
                      </button>
                    </div>

                    {/* Add values to property */}
                    <div className="flex items-center mt-2 gap-2">
                      <input
                        type="text"
                        className="border outline-none border-gray-700 bg-gray-800 p-2 rounded-md text-white w-full"
                        placeholder="Enter value..."
                        value={newValue}
                        onChange={(e: any) => setNewValue(e.target.value)}
                      />

                      <button type="button" onClick={() => addValue(index)} className="px-3 py-1 bg-blue-500 text-white rounded-md">
                        Add
                      </button>
                    </div>

                    {/* Show values */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {property.values.map((value, i) => (
                        <span className="px-2 py-1 bg-gray-700 text-white rounded-md text-sm" key={i}>
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add new Property */}
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newLabel}
                    placeholder="Enter property label (e.g. Material, Warranty)"
                    onChange={(e: any) => setNewLabel(e.target.value)}
                  />

                  <button className="px-3 py-2 bg-blue-500 text-white rounded-md flex items-center" type="button" onClick={addProperty}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
              {errors.customProperties && <p className="text-red-500 text-xs mt-1">{errors.customProperties.message as String}</p>}
            </div>
          );
        }}
      />
    </div>
  );
}
