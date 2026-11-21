import "server-only";
import { db } from "./index";

export type SourceRow = {
  id: number;
  name: string;
  grade: string;
  active: number;
  sort: number;
};

export function listSources(includeInactive = false): SourceRow[] {
  const sql = includeInactive
    ? "SELECT * FROM sources ORDER BY sort, name COLLATE NOCASE"
    : "SELECT * FROM sources WHERE active = 1 ORDER BY sort, name COLLATE NOCASE";
  return db().prepare(sql).all() as unknown as SourceRow[];
}

export function findSourceById(id: number): SourceRow | undefined {
  return db().prepare("SELECT * FROM sources WHERE id = ?").get(id) as
    | SourceRow
    | undefined;
}

export function insertSource(name: string, grade: string, sort: number): number {
  const r = db()
    .prepare("INSERT INTO sources (name, grade, sort) VALUES (?, ?, ?)")
    .run(name, grade, sort);
  return Number(r.lastInsertRowid);
}

export function updateSource(
  id: number,
  name: string,
  grade: string,
  active: boolean,
  sort: number,
) {
  db()
    .prepare(
      "UPDATE sources SET name = ?, grade = ?, active = ?, sort = ? WHERE id = ?",
    )
    .run(name, grade, active ? 1 : 0, sort, id);
}

export function sourceNameExists(name: string, excludeId?: number): boolean {
  const sql = excludeId
    ? "SELECT 1 FROM sources WHERE name = ? COLLATE NOCASE AND id != ?"
    : "SELECT 1 FROM sources WHERE name = ? COLLATE NOCASE";
  const args = excludeId ? [name, excludeId] : [name];
  return !!db().prepare(sql).get(...args);
}
