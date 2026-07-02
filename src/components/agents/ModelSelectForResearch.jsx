"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bolt, Cpu } from "lucide-react";
import { useState } from "react";

function ModelSelectForResearch() {
  const [model, setModel] = useState("gemini-2.0-flash");

  const handleChange = (value) => {
    setModel(value);
  };

  return (
    <div>
      <Select value={model} onValueChange={handleChange}>
        <SelectTrigger className="w-fit border-0 bg-transparent p-0 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini-2.0-flash">
            <div className="flex items-center">
              <Bolt className="mr-2 h-4 w-4 text-yellow-400" />
              2.0 Flash
            </div>
          </SelectItem>

          <SelectItem value="gemini-2.5-flash-preview-04-17">
            <div className="flex items-center">
              <Bolt className="mr-2 h-4 w-4 text-orange-400" />
              2.5 Flash
            </div>
          </SelectItem>

          <SelectItem value="gemini-2.5-pro-preview-05-06">
            <div className="flex items-center">
              <Cpu className="mr-2 h-4 w-4 text-purple-400" />
              2.5 Pro
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default ModelSelectForResearch;
