package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;
import java.util.Map;

public final class AuthorizationApiTest {
    private final Config config = Config.get();
    @DataProvider public Object[][] endpoints() { return java.util.stream.Stream.of("dashboard", "users", "analytics", "activity", "productivity", "learning", "plans", "subscriptions", "payments", "reports", "content", "feedback", "support", "notifications", "audit", "settings", "roles", "schedules").map(value -> new Object[]{value}).toArray(Object[][]::new); }
    @Test(dataProvider = "endpoints", groups = "security") public void protectedEndpointsRejectAnonymousAndMember(String endpoint) {
        new ApiClient().get("/api/admin/" + endpoint).expect(401);
        new ApiClient().login("member").get("/api/admin/" + endpoint).expect(403);
        new ApiClient().login("super").get("/api/admin/" + endpoint).expect(200);
    }
    @DataProvider public Object[][] roles() { return new Object[][] {{"staff", "settings"}, {"manager", "payments"}, {"manager", "support"}, {"support", "payments"}, {"support", "reports"}, {"analyst", "users"}, {"analyst", "notifications"}, {"analyst", "audit"}}; }
    @Test(dataProvider = "roles", groups = "security") public void rolesCannotReadUnassignedSections(String role, String endpoint) { new ApiClient().login(role).get("/api/admin/" + endpoint).expect(403); }
    @Test(groups = {"security", "smoke"}) public void legacyAndForgedCookiesCannotAuthenticate() {
        for (String cookie : new String[]{"lifeos-user-id=" + config.userId("super"), "lifeos-session=" + "a".repeat(64)})
            new ApiClient().request("GET", "/api/admin/users", null, Map.of("Cookie", cookie)).expect(401);
    }
    @Test(groups = "security") public void crossOriginWritesAreRejected() {
        new ApiClient().login("super").request("POST", "/api/admin/users/bulk", ApiClient.body("ids", new String[]{config.userId("member")}, "status", "suspended"), Map.of("Origin", "https://different-origin.invalid")).expect(403);
        new ApiClient().login("member").get("/api/auth/me").expect(200);
    }
    @Test(groups = "security") public void superAdminCannotDeleteSelfOrChangeProtectedRole() {
        var api = new ApiClient().login("super");
        api.delete("/api/admin/users/" + config.userId("super")).expect(409);
        api.patch("/api/admin/roles/super-admin", ApiClient.body("name", "Changed", "permissions", new String[]{})).expect(409);
        api.get("/api/admin/me").expect(200);
    }
    @Test(groups = "security") public void staffCannotPromoteMemberOrEditSuperAdmin() {
        var staff = new ApiClient().login("staff");
        staff.patch("/api/admin/users/" + config.userId("member"), ApiClient.body("name", "Member", "email", config.email("member"), "roleId", "super-admin", "status", "active")).expect(403);
        staff.patch("/api/admin/users/" + config.userId("super"), ApiClient.body("name", "Admin", "email", config.email("super"), "roleId", "super-admin", "status", "active")).expect(403);
    }
    @DataProvider public Object[][] invalidQueries() { return new Object[][] {{"users?page=0"}, {"users?limit=101"}, {"analytics?start=bad"}, {"analytics?start=2026-02-31"}, {"analytics?days=3"}, {"analytics?start=2026-09-08&end=2026-09-01"}}; }
    @Test(dataProvider = "invalidQueries", groups = "security") public void invalidQueriesReturnValidationErrors(String query) { new ApiClient().login("super").get("/api/admin/" + query).expect(400); }
    @Test(groups = "security") public void userResponsesNeverExposePasswordHashes() {
        var users = new ApiClient().login("super").get("/api/admin/users").expect(200).data();
        Assert.assertFalse(users.toString().contains("passwordHash")); Assert.assertFalse(users.toString().contains(config.password()));
    }
    @Test(groups = "security") public void logoutRevokesTheIssuedToken() {
        var client = new ApiClient().login("member"); String cookie = "lifeos-session=" + client.token();
        client.post("/api/auth/logout", Map.of()).expect(200);
        new ApiClient().request("GET", "/api/auth/me", null, Map.of("Cookie", cookie)).expect(401);
    }
}
