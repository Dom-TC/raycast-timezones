import { Action, ActionPanel, Form, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { ensureTimezonesFileExists, readTimezones, saveTimezones } from "./helper";

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}

export default function Command() {
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureTimezonesFileExists().catch((error) => {
      setError("Failed to ensure timezones.json exists.");
    });
  }, []);

  const handleAddTimezone = async () => {
    try {
      if (!isValidTimezone(timezone)) {
        showToast(Toast.Style.Failure, "Invalid timezone");
        return;
      }

      const timezones = await readTimezones();
      if (timezones.includes(timezone)) {
        showToast(Toast.Style.Failure, "Timezone already exists");
        return;
      }

      timezones.push(timezone);
      await saveTimezones(timezones);
      showToast(Toast.Style.Success, "Timezone added");
    } catch (error) {
      setError("Failed to add timezone. Please try again later.");
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Timezone"
            onSubmit={handleAddTimezone}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="timezone"
        title="Timezone"
        placeholder="Enter timezone (e.g., America/New_York)"
        value={timezone}
        onChange={setTimezone}
      />
    </Form>
  );
}
