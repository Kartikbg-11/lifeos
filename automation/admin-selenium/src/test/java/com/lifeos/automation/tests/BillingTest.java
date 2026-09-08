package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import com.lifeos.automation.pages.*;
import org.openqa.selenium.By;
import org.testng.Assert;
import org.testng.annotations.Test;

public final class BillingTest extends BaseUiTest {
    @Test(groups = "regression") public void planCanBeCreatedAndDisabled() {
        String name = config.unique("plan"); signIn(); var page = new RecordsPage(driver(), "plans").visit(); page.create("plan");
        page.field("Plan name", name); page.field("Price in minor units (100 = 1.00)", "49900"); page.field("Features (one per line)", "Learning reports\nProgress tracking"); page.save();
        page.search(name); page.click(By.xpath("//article[h2[normalize-space(.)=" + BasePage.literal(name) + "]]//button[normalize-space(.)='Edit plan']"));
        page.click(BasePage.label("Available for new subscriptions")); page.save();
        var record = admin().get("/api/admin/plans?q=" + name).expect(200).data().path("items").get(0);
        Assert.assertEquals(record.path("priceCents").asInt(), 49900); Assert.assertFalse(record.path("enabled").asBoolean());
    }
    @Test(groups = "regression") public void subscriptionPaymentAndRefundPersistInManualLedger() {
        var api = admin(); String name = config.unique("billing-plan");
        var plan = api.post("/api/admin/plans", ApiClient.body("name", name, "priceCents", 49900, "currency", "INR", "cycle", "monthly", "trialDays", 0, "enabled", true, "features", "Learning", "limits", "Test ledger")).expect(200).data();
        signIn(); var subscription = new RecordsPage(driver(), "subscriptions").visit(); subscription.create("subscription"); subscription.option("User", config.userId("member")); subscription.option("Plan", plan.path("id").asText()); subscription.option("Status", "active"); subscription.save();
        var subscriptions = api.get("/api/admin/subscriptions?limit=100").expect(200).data().path("items");
        String subscriptionId = java.util.stream.StreamSupport.stream(subscriptions.spliterator(), false).filter(row -> row.path("planId").asText().equals(plan.path("id").asText())).findFirst().orElseThrow().path("id").asText();
        String reference = config.unique("payment"); var payment = new RecordsPage(driver(), "payments").visit(); payment.create("payment record");
        payment.field("Unique transaction reference", reference); payment.option("User", config.userId("member")); payment.field("Subscription ID (optional)", subscriptionId);
        payment.field("Amount in minor units (100 = 1.00)", "49900"); payment.option("Status", "successful"); payment.save(); payment.find(reference);
        payment.edit(reference); payment.option("Status", "refunded"); payment.save();
        var row = api.get("/api/admin/payments?q=" + reference).expect(200).data().path("items").get(0);
        Assert.assertEquals(row.path("status").asText(), "refunded"); Assert.assertEquals(row.path("amountCents").asInt(), 49900);
        var changed = ApiClient.body("reference", reference, "userId", config.userId("member"), "subscriptionId", subscriptionId, "amountCents", 1, "currency", "INR", "method", "manual", "status", "refunded", "paidAt", row.path("paidAt").asText(), "note", "");
        api.patch("/api/admin/payments/" + row.path("id").asText(), changed).expect(409);
    }
}
