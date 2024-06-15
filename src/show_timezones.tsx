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
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustedTime, setAdjustedTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Ensure timezones.json exists, and read the data from it.
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

  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Run every 60 seconds (1000 ms * 60)
  
    return () => clearInterval(interval);
  }, []);

  const parseInputTime = (input: string): Date | null => {
    // Assume input is in HH:mm format
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (regex.test(input)) {
      const [hours, minutes] = input.split(":").map(Number);
      const adjustedTime = new Date();
      adjustedTime.setHours(hours);
      adjustedTime.setMinutes(minutes);
      return adjustedTime;
    }
    return null;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    const parsedTime = parseInputTime(query);
    if (parsedTime) {
      setAdjustedTime(parsedTime);
    } else {
      setAdjustedTime(null);
    }
  };

  const calculateAdjustedTime = (timezone: string): string => {
    const timeToDisplay = adjustedTime || currentTime; // Use adjusted time if set, otherwise use current time
    const formattedTime = timeToDisplay.toLocaleTimeString("en-GB", { timeZone: timezone });
    return formattedTime;
  };

  const clearAdjustedTime = () => {
    setAdjustedTime(null);
    setSearchQuery("");
  };

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
    <List searchBarPlaceholder="Set time..." searchText={searchQuery} onSearchTextChange={handleSearch} filtering={false}>
      {sortedTimezones .map((timezone) => {
        const formattedCity = formatTimezoneName(timezone);
        const adjustedTime = calculateAdjustedTime(timezone);
        const time = new Date().toLocaleString("en-US", { timeZone: timezone });
        return (
          <List.Item
            key={timezone}
            title={formattedCity}
            subtitle={adjustedTime}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action.CopyToClipboard content={adjustedTime} />
                  <Action
                    title="Clear Adjusted Time"
                    icon={Icon.Xmark}
                    onAction={clearAdjustedTime}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
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
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
