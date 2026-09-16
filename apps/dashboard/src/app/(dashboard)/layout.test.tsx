import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), deployment: vi.fn(), get: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/server/session", () => ({ getSession: mocks.session, getDeploymentInfoOrNull: mocks.deployment }));
vi.mock("@/lib/server/api", () => ({ serverApi: { get: mocks.get }, ServerApiError: class extends Error {} }));
vi.mock("@/lib/server/product-view", () => ({ resolveRequestProductView: async () => "platform" }));
vi.mock("@/components/api-unavailable", () => ({ ApiUnavailable: "api-unavailable" }));
vi.mock("@/components/sidebar", () => ({ Sidebar: "sidebar" }));
vi.mock("@/components/updates/UpdateCenter", () => ({ UpdateCenter: "updates" }));
vi.mock("@/components/migrated-launcher", () => ({ MigratedLauncher: "migrated" }));
vi.mock("@/components/migration-in-progress", () => ({ MigrationInProgress: "migration" }));
vi.mock("./providers", () => ({ DashboardProviders: "providers" }));

import DashboardLayout from "./layout";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ session: { activeOrganizationId: "org-1" }, user: { id: "user-1" } });
  mocks.deployment.mockResolvedValue({ authMode: "local", selfHosted: true });
  mocks.get.mockImplementation((path: string) => path === "auth/organization/list"
    ? Promise.resolve([{ id: "org-1" }])
    : new Promise(() => {}));
});

it("renders the dashboard while GitHub is unavailable", async () => {
  const layout = await DashboardLayout({ children: "project content" });
  expect(layout.type).toBe("providers");
  expect(layout.props.initialUser).toEqual({ id: "user-1" });
  expect(mocks.get.mock.calls.map(([path]) => path)).toEqual(["auth/organization/list"]);
}, 1000);

it("still redirects unauthenticated visitors before loading dashboard data", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(DashboardLayout({ children: "private" })).rejects.toThrow("redirect:/login");
  expect(mocks.get).not.toHaveBeenCalled();
  expect(mocks.deployment).not.toHaveBeenCalled();
});
