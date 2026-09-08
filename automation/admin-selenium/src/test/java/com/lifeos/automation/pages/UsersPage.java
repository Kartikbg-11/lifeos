package com.lifeos.automation.pages;

import org.openqa.selenium.*;

public final class UsersPage extends AdminPage {
    public UsersPage(WebDriver driver) { super(driver); }
    public UsersPage visit() { visit("users"); return this; }
    public void create(String name, String email, String password) { click(button("Add user")); field("Full name", name); field("Email", email); field("Initial password", password); save(); }
    public void find(String email) { search(email); visible(By.xpath("//a[@aria-label=" + literal("View " + email) + "]")); }
    public void edit(String email) { click(button("Edit " + email)); visible(By.cssSelector(".ad-editor")); }
    public void status(String email, String status) { find(email); edit(email); option("Account status", status); save(); }
    public void filterStatus(String value) { option("Filter user status", value); }
    public void selectUser(String email) { click(By.cssSelector("input[aria-label='Select " + email + "']")); }
}
