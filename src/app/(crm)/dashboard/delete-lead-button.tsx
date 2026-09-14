"use client";

import { deleteClientAction } from "../actions";

export function DeleteLeadButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      action={deleteClientAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-button text-button-danger" type="submit">Delete</button>
    </form>
  );
}

export function DeleteLeadFormAction({ name }: { name: string }) {
  return (
    <button
      className="button button-danger"
      type="submit"
      formAction={deleteClientAction}
      formNoValidate
      onClick={(event) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) event.preventDefault();
      }}
    >
      Delete lead
    </button>
  );
}
