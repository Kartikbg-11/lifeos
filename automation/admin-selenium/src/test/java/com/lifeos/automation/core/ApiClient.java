package com.lifeos.automation.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/** Real HTTP requests for setup and assertions; UI interactions remain Selenium WebDriver actions. */
public final class ApiClient {
    public static final ObjectMapper JSON = new ObjectMapper();
    // The local Next.js server speaks HTTP/1.1; avoid an h2c upgrade on POST requests.
    private final HttpClient http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofSeconds(15)).build();
    private String cookie = "";
    public record Result(int status, JsonNode json, byte[] bytes, Map<String, java.util.List<String>> headers) {
        public JsonNode data() { return json.path("data"); }
        public Result expect(int expected) { org.testng.Assert.assertEquals(status, expected, "Unexpected HTTP response: " + json.path("error").asText()); return this; }
    }
    public Result request(String method, String path, Object body, Map<String, String> extraHeaders) {
        try {
            var headers = new LinkedHashMap<String, String>();
            headers.put("Content-Type", "application/json"); headers.put("Origin", Config.get().baseUrl());
            if (!cookie.isEmpty()) headers.put("Cookie", cookie);
            headers.putAll(extraHeaders);
            var builder = HttpRequest.newBuilder(URI.create(Config.get().baseUrl() + path)).timeout(Duration.ofSeconds(60));
            headers.forEach(builder::header);
            builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
            var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            response.headers().allValues("set-cookie").stream().filter(v -> v.startsWith("lifeos-session=")).forEach(v -> cookie = v.split(";", 2)[0]);
            JsonNode json;
            try { json = JSON.readTree(response.body()); }
            catch (Exception ignored) { json = JSON.createObjectNode(); }
            return new Result(response.statusCode(), json == null ? JSON.createObjectNode() : json, response.body(), response.headers().map());
        } catch (Exception e) { throw new IllegalStateException("HTTP request failed: " + method + " " + path, e); }
    }
    public Result get(String path) { return request("GET", path, null, Map.of()); }
    public Result post(String path, Object body) { return request("POST", path, body, Map.of()); }
    public Result patch(String path, Object body) { return request("PATCH", path, body, Map.of()); }
    public Result delete(String path) { return request("DELETE", path, Map.of(), Map.of()); }
    public ApiClient login(String role) { login(Config.get().email(role), Config.get().password()).expect(200); return this; }
    public Result login(String email, String password) { return post("/api/auth/login", Map.of("email", email, "password", password)); }
    public String token() { if (!cookie.startsWith("lifeos-session=")) throw new IllegalStateException("Login did not issue a session"); return cookie.substring("lifeos-session=".length()); }
    public static Map<String, Object> body(Object... pairs) { var map = new LinkedHashMap<String, Object>(); for (int i = 0; i < pairs.length; i += 2) map.put((String)pairs[i], pairs[i + 1]); return map; }
    public static String encode(String value) { return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8); }
    // Deliberately no HTTP payload logging: passwords and session headers must not enter reports.
}
