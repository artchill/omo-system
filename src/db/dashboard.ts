import "server-only";
import { db } from "./index";

export type DashboardMetrics = {
  totalLeads: number;
  newLeads: number;
  validLeads: number;
  consultInvites: number;
  attended: number;
  absent: number;
  deals: number;
  dealAmountUsd: number;
  netAmountUsd: number;
};

/** Get aggregate metrics, optionally filtered by date range. */
export function getDashboardMetrics(opts?: {
  from?: string;
  to?: string;
}): DashboardMetrics {
  const d = db();
  const from = opts?.from;
  const to = opts?.to;

  const dateFilter = (col: string) => {
    const parts: string[] = [];
    const params: string[] = [];
    if (from) { parts.push(`${col} >= ?`); params.push(from); }
    if (to) { parts.push(`${col} <= ?`); params.push(to); }
    return { clause: parts.length ? `WHERE ${parts.join(" AND ")}` : "", params };
  };

  const leads = dateFilter("created_at");
  const totalLeads = Number(
    d.prepare(`SELECT COUNT(*) AS n FROM leads ${leads.clause}`).get(...leads.params)?.n ?? 0,
  );

  const newLeads = Number(
    d.prepare(`SELECT COUNT(*) AS n FROM leads ${leads.clause ? leads.clause + " AND" : "WHERE"} status = 'new'`).get(...leads.params)?.n ?? 0,
  );

  /* "valid" = had at least one contact log with result = "interested" or status in open group beyond 'new' */
  const validLeads = Number(
    d.prepare(
      `SELECT COUNT(DISTINCT l.id) AS n FROM leads l WHERE l.status NOT IN ('new','invalid','duplicate','spam','no_answer','not_interested')${from ? " AND l.created_at >= ?" : ""}${to ? " AND l.created_at <= ?" : ""}`,
    ).get(...leads.params)?.n ?? 0,
  );

  const ci = dateFilter("invited_at");
  const consultInvites = Number(
    d.prepare(`SELECT COUNT(*) AS n FROM consult_invites ${ci.clause}`).get(...ci.params)?.n ?? 0,
  );
  const attended = Number(
    d.prepare(`SELECT COUNT(*) AS n FROM consult_invites ${ci.clause ? ci.clause + " AND" : "WHERE"} attendance = 'attended'`).get(...ci.params)?.n ?? 0,
  );
  const absent = Number(
    d.prepare(`SELECT COUNT(*) AS n FROM consult_invites ${ci.clause ? ci.clause + " AND" : "WHERE"} attendance = 'absent'`).get(...ci.params)?.n ?? 0,
  );

  const dl = dateFilter("deal_date");
  const deals = Number(
    d.prepare(`SELECT COUNT(*) AS n FROM deals ${dl.clause}`).get(...dl.params)?.n ?? 0,
  );
  const amounts = d.prepare(
    `SELECT COALESCE(SUM(quote_usd), 0) AS total, COALESCE(SUM(net_usd), 0) AS net FROM deals ${dl.clause}`,
  ).get(...dl.params) as { total: number; net: number };

  return {
    totalLeads,
    newLeads,
    validLeads,
    consultInvites,
    attended,
    absent,
    deals,
    dealAmountUsd: amounts.total,
    netAmountUsd: amounts.net,
  };
}

export type AssistantStat = {
  userId: number;
  name: string;
  assigned: number;
  valid: number;
  deals: number;
};

export function getAssistantStats(): AssistantStat[] {
  const rows = db().prepare(`
    SELECT
      u.id AS userId,
      u.name,
      COUNT(DISTINCT l.id) AS assigned,
      COUNT(DISTINCT CASE WHEN l.status NOT IN ('new','invalid','duplicate','spam','no_answer','not_interested') THEN l.id END) AS valid,
      COUNT(DISTINCT d.id) AS deals
    FROM users u
    LEFT JOIN leads l ON l.assistant_id = u.id
    LEFT JOIN deals d ON d.lead_id = l.id
    WHERE u.role = 'assistant' AND u.active = 1
    GROUP BY u.id
    ORDER BY assigned DESC
  `).all() as unknown as AssistantStat[];
  return rows;
}
