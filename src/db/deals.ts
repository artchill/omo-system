import "server-only";
import { db } from "./index";

export type DealRow = {
  id: number;
  lead_id: number;
  deal_date: string;
  lodging: string;
  program_type: string;
  plan: string;
  campus: string;
  depart_date: string | null;
  return_date: string | null;
  weeks: number | null;
  quote_usd: number | null;
  fx_rate: number | null;
  amount_twd: number | null;
  reg_fee_usd: number;
  commission_rate: number;
  net_usd: number | null;
  net_twd: number | null;
  paid_currency: string;
  paid_amount: number | null;
  key_points: string;
  note: string;
  created_at: string;
  updated_at: string;
  lead_name?: string;
};

const now = () => new Date().toISOString();

export function listDeals(limit = 50, offset = 0): { rows: DealRow[]; total: number } {
  const total = Number(
    db().prepare("SELECT COUNT(*) AS n FROM deals").get()?.n ?? 0,
  );
  const rows = db()
    .prepare(
      `SELECT d.*, l.name AS lead_name
       FROM deals d
       LEFT JOIN leads l ON l.id = d.lead_id
       ORDER BY d.deal_date DESC
       LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as unknown as DealRow[];
  return { rows, total };
}

export function listDealsByLead(leadId: number): DealRow[] {
  return db()
    .prepare("SELECT * FROM deals WHERE lead_id = ? ORDER BY deal_date DESC")
    .all(leadId) as unknown as DealRow[];
}

export function findDealById(id: number): DealRow | undefined {
  return db()
    .prepare(
      `SELECT d.*, l.name AS lead_name
       FROM deals d
       LEFT JOIN leads l ON l.id = d.lead_id
       WHERE d.id = ?`,
    )
    .get(id) as DealRow | undefined;
}

export type NewDeal = {
  lead_id: number;
  deal_date: string;
  lodging?: string;
  program_type?: string;
  plan?: string;
  campus?: string;
  depart_date?: string;
  return_date?: string;
  weeks?: number;
  quote_usd?: number;
  fx_rate?: number;
  amount_twd?: number;
  reg_fee_usd: number;
  commission_rate: number;
  net_usd?: number;
  net_twd?: number;
  paid_currency?: string;
  paid_amount?: number;
  key_points?: string;
  note?: string;
};

export function insertDeal(d: NewDeal): number {
  const t = now();
  const r = db()
    .prepare(
      `INSERT INTO deals (
        lead_id, deal_date, lodging, program_type, plan, campus,
        depart_date, return_date, weeks,
        quote_usd, fx_rate, amount_twd,
        reg_fee_usd, commission_rate, net_usd, net_twd,
        paid_currency, paid_amount, key_points, note,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      d.lead_id,
      d.deal_date,
      d.lodging ?? "",
      d.program_type ?? "",
      d.plan ?? "",
      d.campus ?? "",
      d.depart_date ?? null,
      d.return_date ?? null,
      d.weeks ?? null,
      d.quote_usd ?? null,
      d.fx_rate ?? null,
      d.amount_twd ?? null,
      d.reg_fee_usd,
      d.commission_rate,
      d.net_usd ?? null,
      d.net_twd ?? null,
      d.paid_currency ?? "TWD",
      d.paid_amount ?? null,
      d.key_points ?? "",
      d.note ?? "",
      t,
      t,
    );
  return Number(r.lastInsertRowid);
}

export function updateDeal(
  id: number,
  fields: Partial<Omit<DealRow, "id" | "lead_id" | "created_at" | "updated_at">>,
) {
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`);
    vals.push((v as string | number | null) ?? null);
  }
  sets.push("updated_at = ?");
  vals.push(now());
  vals.push(id);
  db()
    .prepare(`UPDATE deals SET ${sets.join(", ")} WHERE id = ?`)
    .run(...vals);
}
