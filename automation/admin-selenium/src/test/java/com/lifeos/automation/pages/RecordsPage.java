package com.lifeos.automation.pages;

import org.openqa.selenium.*;

public final class RecordsPage extends AdminPage {
    private final String resource;
    public RecordsPage(WebDriver driver, String resource) { super(driver); this.resource = resource; }
    public RecordsPage visit() { visit(resource); return this; }
    public void create(String singular) { click(button("New " + singular)); visible(By.cssSelector(".ad-editor")); }
    public void find(String title) { search(title); visible(button("View " + title)); }
    public void edit(String title) { find(title); click(button("Edit " + title)); visible(By.cssSelector(".ad-editor")); }
    public void remove(String title) { find(title); click(button("Delete " + title)); click(button("Delete record")); absent(By.cssSelector("[role='dialog']")); }
    public void send(String title) { find(title); click(button("Send " + title)); click(By.xpath("//*[@role='dialog']//button[contains(.,'Send') and not(@type='button')] | //*[@role='dialog']//button[normalize-space(.)='Send now']")); absent(By.cssSelector("[role='dialog']")); }
}
