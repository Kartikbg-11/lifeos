package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import org.testng.Assert;
import org.testng.annotations.Test;
import java.time.Instant;
import java.util.Map;
import java.util.stream.StreamSupport;

public final class ScheduledJobsTest {
    private final Config config = Config.get();
    @Test(groups = "security") public void scheduledWorkerRequiresItsSecret() { new ApiClient().post("/api/internal/admin-jobs", Map.of()).expect(401); }
    @Test(groups = "regression") public void dueReportScheduleRunsOnce() {
        var admin = new ApiClient().login("super"); String name = config.unique("schedule");
        var schedule = admin.post("/api/admin/schedules", ApiClient.body("name", name, "type", "usage", "frequency", "daily", "enabled", true, "nextRunAt", Instant.now().minusSeconds(60).toString())).expect(200).data();
        runWorker();
        var first = admin.get("/api/admin/reports?limit=100").expect(200).data().path("items");
        long count = StreamSupport.stream(first.spliterator(), false).filter(row -> row.path("name").asText().contains(name)).count(); Assert.assertEquals(count, 1L);
        runWorker(); var second = admin.get("/api/admin/reports?limit=100").expect(200).data().path("items");
        Assert.assertEquals(StreamSupport.stream(second.spliterator(), false).filter(row -> row.path("name").asText().contains(name)).count(), 1L);
        admin.delete("/api/admin/schedules/" + schedule.path("id").asText()).expect(200);
    }
    @Test(groups = "regression") public void repeatedNotificationDeliveryDoesNotDuplicateReceipts() {
        var admin = new ApiClient().login("super"); String title = config.unique("idempotent-message");
        var notification = admin.post("/api/admin/notifications", ApiClient.body("title", title, "message", "Exactly one inbox receipt.", "audience", "user", "target", config.userId("member"), "status", "draft", "scheduledAt", null)).expect(200).data();
        String path = "/api/admin/notifications/" + notification.path("id").asText() + "/send";
        admin.post(path, Map.of()).expect(200); admin.post(path, Map.of()).expect(200);
        var inbox = new ApiClient().login("member").get("/api/community").expect(200).data().path("notifications");
        Assert.assertEquals(StreamSupport.stream(inbox.spliterator(), false).filter(row -> row.path("notification").path("title").asText().equals(title)).count(), 1L);
    }
    private void runWorker() { new ApiClient().request("POST", "/api/internal/admin-jobs", Map.of(), Map.of("Authorization", "Bearer " + config.jobSecret())).expect(200); }
}
