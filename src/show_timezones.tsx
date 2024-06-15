import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { ensureTimezonesFileExists, readTimezones, saveTimezones } from "./helper";

function formatTimezoneName(timezone: string): string {
  const parts = timezone.split("/");
  const city = parts[parts.length - 1].replace(/_/g, " ");
  return city
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function Command() {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"alphabetical" | "chronological" | "manual">("chronological");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimezones() {
      try {
        await ensureTimezonesFileExists();
        const tzs = await readTimezones();
        setTimezones(tzs);
        setLoading(false);
      } catch (error) {
        setError("Failed to load timezones. Please try again later.");
        setLoading(false);
      }
    }
    loadTimezones();
  }, []);

  const sortTimezones = (tzs: string[]): string[] => {
    switch (sortOrder) {
      case "alphabetical":
        return tzs.slice().sort((a, b) => {
          const cityA = formatTimezoneName(a);
          const cityB = formatTimezoneName(b);
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

  const handleSortChange = async (order: "alphabetical" | "chronological" | "manual") => {
    setSortOrder(order);
  };

  const handleRemoveTimezone = async (timezone: string) => {
    try {
      const newTimezones = timezones.filter((tz) => tz !== timezone);
      setTimezones(newTimezones);
      await saveTimezones(newTimezones);
      showToast(Toast.Style.Success, "Timezone removed");
    } catch (error) {
      setError("Failed to remove timezone. Please try again later.");
    }
  };

  if (loading) {
    return <List isLoading={true} />;
  }

  if (error) {
    return <List searchBarPlaceholder={error} isLoading={false} />;
  }

  const sortedTimezones = sortTimezones(timezones);

  return (
    <List>
      {sortedTimezones.map((timezone) => {
        const formattedCity = formatTimezoneName(timezone);
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
