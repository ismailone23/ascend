import { SQLITE_KEY } from "@/constants/storagekeys";
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync(SQLITE_KEY);
