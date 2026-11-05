import { useState } from "react";
import { numberInputDisplay } from "../utils/numericInput";

// Keep the text being edited separate from the parent's validated numeric value.
// In particular, Number("") in a parent handler must not put a zero back into
// the field before the user has finished replacing its contents.
export default function NumberInput({ value, onChange, onFocus, onBlur, ...props }) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  return (
    <input
      {...props}
      type="number"
      value={editing ? draft : numberInputDisplay(value)}
      onFocus={(event) => {
        setDraft(event.target.value);
        setEditing(true);
        onFocus?.(event);
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange?.(event);
      }}
      onBlur={(event) => {
        setEditing(false);
        onBlur?.(event);
      }}
    />
  );
}
