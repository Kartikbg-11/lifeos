package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import com.lifeos.automation.pages.*;
import org.openqa.selenium.By;
import org.testng.Assert;
import org.testng.annotations.Test;
import java.util.stream.StreamSupport;

public final class ContentAndMessagingTest extends BaseUiTest {
    @Test(groups = {"smoke", "regression"}) public void draftPublishArchiveAndDeleteResource() {
        String title = config.unique("resource"); var member = new ApiClient().login("member"); signIn();
        var page = new RecordsPage(driver(), "content").visit(); page.create("resource"); page.field("Title", title);
        page.field("Content (plain text)", "A Selenium-verified learning resource."); page.save(); page.find(title);
        Assert.assertFalse(member.get("/api/community").expect(200).data().path("content").toString().contains(title));
        page.edit(title); page.option("Status", "published"); page.save();
        Assert.assertTrue(member.get("/api/community").expect(200).data().path("content").toString().contains(title));
        page.edit(title); page.option("Status", "archived"); page.save();
        Assert.assertFalse(member.get("/api/community").expect(200).data().path("content").toString().contains(title));
        page.remove(title); page.visible(BasePage.text("Record deleted."));
        Assert.assertEquals(admin().get("/api/admin/content?q=" + title).expect(200).data().path("total").asInt(), 0);
        Assert.assertTrue(admin().get("/api/admin/audit?q=" + title).expect(200).status() == 200);
    }
    @Test(groups = "regression") public void notificationReachesOnlyItsTargetAndCanBeRead() {
        String title = config.unique("notification"); signIn(); var page = new RecordsPage(driver(), "notifications").visit();
        page.create("notification"); page.field("Title", title); page.field("Message", "Your learning update is ready.");
        page.option("Audience", "user"); page.field("Target user ID or role ID", config.userId("member")); page.save(); page.send(title);
        page.visible(BasePage.text("Notification delivered to the in-app inbox."));
        var member = new ApiClient().login("member"); var inbox = member.get("/api/community").expect(200).data().path("notifications");
        var receipt = StreamSupport.stream(inbox.spliterator(), false).filter(row -> row.path("notification").path("title").asText().equals(title)).findFirst().orElseThrow();
        Assert.assertFalse(admin().get("/api/community").expect(200).data().path("notifications").toString().contains(title));
        member.patch("/api/community", ApiClient.body("id", receipt.path("id").asText())).expect(200);
        var updated = member.get("/api/community").expect(200).data().path("notifications");
        Assert.assertTrue(StreamSupport.stream(updated.spliterator(), false).anyMatch(row -> row.path("id").asText().equals(receipt.path("id").asText()) && !row.path("readAt").isNull()));
    }
    @Test(groups = "regression") public void supportCanResolveMemberFeedbackWithoutLeakingInternalNotes() {
        String title = config.unique("feedback"), note = config.unique("internal-note"); var member = new ApiClient().login("member");
        member.post("/api/community", ApiClient.body("type", "feedback", "title", title, "message", "Please add a weekly reflection.", "kind", "suggestion")).expect(200);
        signIn("support"); var page = new RecordsPage(driver(), "feedback").visit(); page.edit(title); page.option("Status", "resolved"); page.option("Priority", "high"); page.field("Internal notes / resolution", note); page.save();
        var feedback = member.get("/api/community").expect(200).data().path("feedback");
        Assert.assertTrue(StreamSupport.stream(feedback.spliterator(), false).anyMatch(row -> row.path("title").asText().equals(title) && row.path("status").asText().equals("resolved")));
        Assert.assertFalse(feedback.toString().contains(note));
    }
    @Test(groups = "regression") public void supportTicketCanBeAssignedAndClosed() {
        String title = config.unique("ticket"); var member = new ApiClient().login("member");
        member.post("/api/community", ApiClient.body("type", "support", "title", title, "message", "Help me understand my learning totals.")).expect(200);
        signIn("support"); var page = new RecordsPage(driver(), "support").visit(); page.edit(title); page.option("Status", "closed"); page.field("Assigned administrator email", config.email("support")); page.field("Internal notes / resolution", "Explained the totals."); page.save();
        Assert.assertTrue(member.get("/api/community").expect(200).data().path("support").toString().contains("closed"));
    }
}
