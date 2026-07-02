"use client";

import ExitModal from "./ExitModal";
import EmailModalExample from "./EmailCollectModal";
import { useState } from "react";

export default function ModelProvider() {
  const [open, setOpen] = useState(false);

  const handleEmailSubmit = async (email) => {
    // Here we would typically send the email to your backend
    // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
  };
  return (
    <>
      <ExitModal setOpen={setOpen} />
      <EmailModalExample
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleEmailSubmit}
      />
    </>
  );
}
