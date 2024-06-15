import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { ensureTimezonesFileExists, readTimezones, saveTimezones } from "./helper";

function formatTimezone(timezone: string): string {
  const parts = timezone.split("/");
  const city = parts[parts.length - 1].replace(/_/g, " ");
  return city
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractCityName(timezone: string): string {
  const parts = timezone.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

export default function Command() {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"alphabetical" | "chronological" | "manual">("chronological");

  useEffect(() => {
    async function loadTimezones() {
      await ensureTimezonesFileExists();
      const tzs = await readTimezones();
      setTimezones(tzs);
      setLoading(false);
    }
    loadTimezones();
  }, []);

  const sortTimezones = (tzs: string[]): string[] => {
    switch (sortOrder) {
      case "alphabetical":
        return tzs.slice().sort((a, b) => {
          const cityA = extractCityName(a);
          const cityB = extractCityName(b);
          return cityA.localeCompare(cityB);
        });
      case "chronological":
        return tzs.slice().sort((a, b) => {
          const offsetA = new Date().toLocaleTimeString("en-GB", { timeZone: a });
          const offsetB = new Date().toLocaleTimeString("en-GB", { timeZone: b });
          return offsetA.localeCompare(offsetB);
        });
      case "manual":
      default:
        return tzs;
    }
  };

  const handleSortChange = (order: "alphabetical" | "chronological" | "manual") => {
    setSortOrder(order);
  };

  const handleRemoveTimezone = async (timezone: string) => {
    const newTimezones = timezones.filter((tz) => tz !== timezone);
    setTimezones(newTimezones);
    await saveTimezones(newTimezones);
    showToast(Toast.Style.Success, "Timezone removed");
  };

  if (loading) {
    return <List isLoading={true} />;
  }

  const sortedTimezones = sortTimezones(timezones);

  return (
    <List>
      {sortedTimezones.map((timezone) => {
        const formattedCity = formatTimezone(timezone);
        const time = new Date().toLocaleString("en-US", { timeZone: timezone });
        return (
          <List.Item
            key={timezone}
            title={formattedCity}
            subtitle={time}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard content={time} />
                <ActionPanel.Submenu title="Set sort order" icon={Icon.Shuffle}>
                <Action
                  title="Alphabetical"
                  shortcut={{ modifiers: ["cmd"], key: "1" }}
                  onAction={() => handleSortChange("alphabetical")}
                />
                <Action
                  title="Chronological"
                  shortcut={{ modifiers: ["cmd"], key: "2" }}
                  onAction={() => handleSortChange("chronological")}
                />
                <Action
                  title="Manual"
                  shortcut={{ modifiers: ["cmd"], key: "3" }}
                  onAction={() => handleSortChange("manual")}
                />
              </ActionPanel.Submenu>
                <Action
                  title="Remove Timezone"
                  style={Action.Style.Destructive}
                  icon={Icon.Trash}
                  onAction={() => handleRemoveTimezone(timezone)}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}