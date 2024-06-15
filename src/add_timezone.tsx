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

  useEffect(() => {
    ensureTimezonesFileExists();
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Timezone"
            onSubmit={async () => {
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
            }}
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
