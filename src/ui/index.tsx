import { useState } from "react";
import { LogbookList } from "@/ui/components/LogbookList";
import { LogbookDetail } from "@/ui/components/LogbookDetail";
import "./styles.css";

export default function Plugin() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <LogbookDetail pirepId={selectedId} onBack={() => setSelectedId(null)} />
    );
  }

  return <LogbookList onSelect={setSelectedId} />;
}
