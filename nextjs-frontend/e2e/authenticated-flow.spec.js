import { expect, test } from "@playwright/test";

const TOKEN = "e2e-access-token";
const USER = {
  id: 7,
  email: "e2e@example.com",
  full_name: "E2E User",
  created_at: "2026-11-12T09:00:00Z",
};

function scanRecord(overrides = {}) {
  return {
    id: 101,
    content_type: "sms",
    risk_score: 85,
    risk_level: "Critical",
    category: "Credential Theft",
    summary:
      "The message impersonates a bank and pressures the recipient to share credentials.",
    indicators: [
      {
        name: "Urgency pressure",
        severity: "high",
        description: "Creates a short deadline to force a hasty response.",
        source: "rule_based",
      },
    ],
    recommendations: [
      "Never share your UPI PIN, OTP, or banking password.",
      "Report the message to your bank and the cybercrime helpline.",
    ],
    analysis_type: "rule_based",
    rule_based_status: "completed",
    gemini_status: "unavailable",
    url_status: "not_applicable",
    created_at: "2026-11-12T09:05:00Z",
    ...overrides,
  };
}

/**
 * Mocks the FastAPI endpoints used by login, detection, and history. The mock
 * keeps saved scans in memory so a detection appears in history, and rejects
 * protected requests without the bearer token issued at login.
 */
async function mockApi(page) {
  const scans = [];
  const protectedRequests = [];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "");
    const authorization = request.headers().authorization;

    const json = (status, body) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204 });
    }

    if (path === "/health") {
      return json(200, {
        status: "ok",
        database: "ok",
        service: "ScamShield API",
      });
    }

    if (path === "/auth/login" && method === "POST") {
      const body = request.postDataJSON();
      if (body.email !== USER.email || body.password !== "password123") {
        return json(401, { detail: "Incorrect email or password." });
      }
      return json(200, { access_token: TOKEN, token_type: "bearer" });
    }

    if (path !== "/auth/login" && path !== "/auth/register") {
      protectedRequests.push({ path, method, authorization });
    }

    if (authorization !== `Bearer ${TOKEN}`) {
      return json(401, { detail: "Not authenticated." });
    }

    if (path === "/auth/me") {
      return json(200, USER);
    }

    if (path === "/dashboard/stats") {
      return json(200, {
        total_scans: 0,
        suspicious_scans: 0,
        critical_alerts: 0,
        average_risk_score: 0,
      });
    }

    if (path === "/detect/analyze" && method === "POST") {
      const body = request.postDataJSON();
      const scan = scanRecord({ content_type: body.content_type });
      scans.unshift(scan);
      return json(200, { ...scan, ai_analysis: { status: "skipped" } });
    }

    if (path === "/detect/history" && method === "GET") {
      return json(200, {
        items: scans,
        pagination: {
          page: 1,
          limit: 10,
          total: scans.length,
          total_pages: scans.length ? 1 : 0,
        },
        overview: {
          total_scans: scans.length,
          suspicious_scans: scans.length,
          critical_scans: scans.length,
          most_recent_scan_date: scans[0]?.created_at ?? null,
        },
      });
    }

    const detailMatch = path.match(/^\/detect\/history\/([^/]+)$/);
    if (detailMatch && method === "GET") {
      const scan = scans.find((item) => String(item.id) === detailMatch[1]);
      if (!scan) return json(404, { detail: "Scan not found." });
      return json(200, { scan });
    }

    return json(404, { detail: `Unmocked endpoint: ${method} ${path}` });
  });

  return { scans, protectedRequests };
}

test("login, detect a scam, and find it in history", async ({ page }) => {
  const api = await mockApi(page);

  // Log in with the credentials the mock accepts.
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();

  await page.getByLabel("Email address").fill(USER.email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Welcome back, E2E User.")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("access_token")))
    .toBe(TOKEN);

  // Run an analysis from the detection workspace.
  await page.getByRole("link", { name: "Detect Scam" }).click();
  await expect(page).toHaveURL(/\/detect$/);

  await page
    .getByLabel("Paste suspicious content")
    .fill(
      "URGENT: Your bank account will be blocked in 30 minutes. Share your OTP at http://upi-verify.example to keep it active.",
    );
  await page.getByRole("button", { name: "Analyze for Scams" }).click();

  const result = page.getByRole("region", { name: "Credential Theft" });
  await expect(result).toBeVisible();
  await expect(result.getByText("85", { exact: true })).toBeVisible();
  await expect(result.getByText("Critical risk")).toBeVisible();
  await expect(result.getByText("Urgency pressure")).toBeVisible();
  await expect(
    result.getByText("Never share your UPI PIN, OTP, or banking password.", {
      exact: true,
    }),
  ).toBeVisible();

  // The saved detection is listed in history.
  await page.getByRole("link", { name: "Scan History" }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole("heading", { name: "Scan History" })).toBeVisible();
  await expect(page.getByText("1 total record(s)")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Credential Theft" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Critical" })).toBeVisible();

  // Open the saved scan detail.
  await page.getByRole("button", { name: "View details" }).click();
  const dialog = page.getByRole("dialog", { name: "Scan #101" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Scan details")).toBeVisible();
  await expect(
    dialog.getByText("The message impersonates a bank and pressures"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(dialog).toBeHidden();

  // Every protected call carried the login token.
  const protectedPaths = api.protectedRequests.map((request) => request.path);
  expect(protectedPaths).toContain("/auth/me");
  expect(protectedPaths).toContain("/detect/analyze");
  expect(protectedPaths).toContain("/detect/history");
  expect(protectedPaths).toContain("/detect/history/101");
  for (const request of api.protectedRequests) {
    expect(request.authorization).toBe(`Bearer ${TOKEN}`);
  }
});
