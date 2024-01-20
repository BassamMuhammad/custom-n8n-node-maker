"use client";

import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { createNode } from "@/app/actions/createNode";


export default function Home() {
  const initialState = {
    message: "",
  };

  const { pending } = useFormStatus();
  const [state, formAction] = useFormState(createNode, initialState);

  return (
    <main>
      <form style={{display: "flex", flexDirection: "column", gap: 5}} action={formAction}>
        <input name='displayName' placeholder="Node Name" />
        <input name='description' placeholder='description' />
        <textarea name='func' rows={30} />
        <input type='submit' value="Submit" disabled={pending} aria-disabled={pending}/>
        <p aria-live="polite" role="status">
        {pending ? "Processing" :state?.message}
      </p>
      </form>
    </main>
  )
}
