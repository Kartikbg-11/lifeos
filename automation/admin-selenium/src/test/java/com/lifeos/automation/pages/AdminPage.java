package com.lifeos.automation.pages;

import org.openqa.selenium.*;
import org.testng.Assert;

public class AdminPage extends BasePage {
    public AdminPage(WebDriver driver) { super(driver); }
    public AdminPage visit(String section) { open("/admin" + (section.isEmpty() ? "" : "/" + section)); ready(); return this; }
    public void ready() { visible(By.cssSelector(".ad-page-heading h1")); absent(By.cssSelector("[aria-label='Loading records']")); Assert.assertFalse(exists(By.cssSelector(".ad-error")), "Admin page shows an API error"); }
    public void heading(String expected) { hasText(By.cssSelector(".ad-page-heading h1"), expected); }
    public void search(String query) {
        ready();
        By input = By.cssSelector(".ad-toolbar .ad-search-field input");
        if (query.equals(visible(input).getDomProperty("value"))) return;
        // Search is debounced. A matching row may still belong to the old results.
        var previous = driver.findElements(By.cssSelector(".ad-panel .ad-table-scroll, .ad-panel .ad-plan-grid, .ad-panel .ad-empty"));
        fill(input, query);
        for (var result : previous) wait.until(org.openqa.selenium.support.ui.ExpectedConditions.stalenessOf(result));
        ready();
    }
    public void save() { click(By.xpath("//*[@role='dialog']//button[normalize-space(.)='Save changes']")); absent(By.cssSelector(".ad-editor")); }
    public void field(String name, String value) { fill(label(name), value); }
    public void option(String name, String value) { select(label(name), value); }
    public void confirm() { click(By.xpath("//*[@role='dialog']//button[normalize-space(.)='Confirm']")); absent(By.cssSelector("[role='dialog']")); }
    public void noHorizontalOverflow() { until(d -> Boolean.TRUE.equals(script("return document.documentElement.scrollWidth <= window.innerWidth"))); }
    public void signOut() { click(button("Admin profile menu")); click(By.xpath("//*[@role='menuitem' and contains(.,'Sign out')]")); urlEnds("/login"); }
    public void theme(String name) { click(button("Change theme")); click(By.xpath("//*[@role='menuitem' and starts-with(normalize-space(.)," + literal(name) + ")]")); until(d -> name.toLowerCase().equals(visible(By.cssSelector(".admin-root")).getAttribute("data-theme"))); }
}
