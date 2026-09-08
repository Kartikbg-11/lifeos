package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import com.lifeos.automation.pages.*;
import org.openqa.selenium.By;
import org.testng.Assert;
import org.testng.annotations.Test;

public final class UsersTest extends BaseUiTest {
    @Test(groups = {"smoke", "regression"}) public void createEditAndFindMember() {
        signIn(); var page = new UsersPage(driver()).visit();
        String email = config.unique("ui-member") + "@" + config.runId() + ".test.invalid";
        page.create("UI New Member", email, config.password()); page.find(email); page.edit(email); page.field("Full name", "UI Updated Member"); page.save();
        driver().navigate().refresh(); page.find(email); page.visible(BasePage.text("UI Updated Member"));
        var record = admin().get("/api/admin/users?q=" + ApiClient.encode(email)).expect(200).data().path("items").get(0);
        Assert.assertEquals(record.path("name").asText(), "UI Updated Member"); Assert.assertFalse(record.has("passwordHash"));
    }
    @Test(groups = {"regression", "security"}) public void suspendAndReactivateMember() {
        String email = createMember("Suspend member"); var member = new ApiClient(); member.login(email, config.password()).expect(200);
        signIn(); var page = new UsersPage(driver()).visit(); page.find(email); page.selectUser(email); page.click(BasePage.button("Suspend")); page.confirm();
        member.get("/api/auth/me").expect(401); new ApiClient().login(email, config.password()).expect(401);
        page.filterStatus("suspended"); page.find(email); page.selectUser(email); page.click(BasePage.button("Activate")); page.confirm();
        new ApiClient().login(email, config.password()).expect(200);
    }
    @Test(groups = "regression") public void deletedAccountCanBeRestored() {
        String email = createMember("Restore member"); signIn(); var page = new UsersPage(driver()).visit(); page.find(email);
        page.click(BasePage.button("Delete " + email)); page.confirm(); new ApiClient().login(email, config.password()).expect(401);
        page.filterStatus("deleted"); page.find(email); page.selectUser(email); page.click(BasePage.button("Activate")); page.confirm();
        new ApiClient().login(email, config.password()).expect(200);
    }
    @Test(groups = "regression") public void roleFilterColumnsAndPaginationWork() {
        signIn(); var page = new UsersPage(driver()).visit(); page.option("Filter user role", "member");
        page.visible(BasePage.button("Next page")); page.click(BasePage.button("Next page")); page.hasText(By.cssSelector(".ad-pagination"), "Page 2");
        page.click(BasePage.button("Previous page")); page.hasText(By.cssSelector(".ad-pagination"), "Page 1");
        page.click(By.cssSelector(".ad-columns summary")); page.click(By.xpath("//details//label[normalize-space(.)='activity']/input"));
        Assert.assertFalse(page.exists(By.xpath("//th[normalize-space(.)='Activity']")));
        page.search("no-match-" + config.unique("empty")); page.visible(BasePage.text("No users found"));
    }
    @Test(groups = "regression") public void superAdminCanAssignAStaffRole() {
        String email = createMember("Role member"); signIn(); var page = new UsersPage(driver()).visit(); page.find(email); page.edit(email); page.option("Role", "support"); page.save();
        var staff = new ApiClient(); staff.login(email, config.password()).expect(200);
        staff.get("/api/admin/support").expect(200); staff.get("/api/admin/payments").expect(403);
    }
}
