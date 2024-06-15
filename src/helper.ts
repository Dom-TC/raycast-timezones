import { environment } from "@raycast/api";
import { promises as fs } from "fs";
import path from "path";

const TIMEZONES_FILE = path.join(environment.supportPath, "timezones.json");

// Confirm that TIMEZONES_FILE exists.
export async function ensureTimezonesFileExists() {
  try {
    await fs.access(TIMEZONES_FILE);
  } catch {
    // File does not exist, create it with default content
    const defaultContent = JSON.stringify([]);
    await fs.writeFile(TIMEZONES_FILE, defaultContent, "utf-8");
  }
}


// Read the current timezones from TIMEZONES_FILE
export async function readTimezones() {
  try {
    const data = await fs.readFile(TIMEZONES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save the current timezones into TIMEZONES_FILE
export async function saveTimezones(timezone: string[]) {
  await fs.writeFile(TIMEZONES_FILE, JSON.stringify(timezone), "utf-8");
}