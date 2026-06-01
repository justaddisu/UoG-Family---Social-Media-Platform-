import axios from "axios";

const baseUrl = "http://localhost:3000";
const adminCredentials = { email: "super.admin@uog.edu.et", password: "gondar123" };

async function request(method, path, data = null, token = null) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const requestConfig = { method, url: `${baseUrl}${path}`, headers };
  if (data !== null) {
    headers["Content-Type"] = "application/json";
    requestConfig.data = data;
  }
  try {
    const response = await axios(requestConfig);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`ERROR ${method} ${path}:`, error.response.status, error.response.data);
      return { error: error.response.data };
    }
    console.error(`ERROR ${method} ${path}:`, error.message);
    return { error: error.message };
  }
}

function getCount(response) {
  if (Array.isArray(response)) return response.length;
  if (response?.value && Array.isArray(response.value)) return response.value.length;
  if (response?.suggestions && Array.isArray(response.suggestions)) return response.suggestions.length;
  return 0;
}

async function runTests() {
  console.log("== UoG Family API smoke test ==");

  const login = await request("post", "/api/auth/login", adminCredentials);
  if (!login.accessToken) {
    console.error("Login failed.");
    return;
  }
  const token = login.accessToken;
  console.log("Login succeeded. user id=", login.user?.id);

  const myProfile = await request("get", "/api/auth/me", null, token);
  console.log("GET /api/auth/me ->", myProfile?.email || myProfile);

  const announcements = await request("get", "/api/announcements", null, token);
  console.log(`GET /api/announcements -> count=${getCount(announcements)}`);

  const suggestions = await request("get", "/api/users/suggestions", null, token);
  console.log(`GET /api/users/suggestions -> count=${getCount(suggestions)}`);

  const posts = await request("get", "/api/posts", null, token);
  console.log(`GET /api/posts -> count=${getCount(posts)}`);

  const newPost = await request("post", "/api/posts", {
    content: "Automated endpoint test post from UoG Family script.",
    visibility: "PUBLIC"
  }, token);
  console.log("POST /api/posts -> id=", newPost?.id || newPost);

  const createdPostId = newPost?.id;
  if (!createdPostId) return;

  const react = await request("post", `/api/posts/${createdPostId}/react`, { type: "LIKE" }, token);
  console.log("POST /api/posts/:id/react ->", react?.id ? "ok" : react);

  const comment = await request("post", `/api/posts/${createdPostId}/comments`, { content: "Test comment from script." }, token);
  console.log("POST /api/posts/:id/comments -> id=", comment?.id || comment);

  const bookmark = await request("post", `/api/posts/${createdPostId}/bookmark`, null, token);
  console.log("POST /api/posts/:id/bookmark ->", bookmark?.id ? "ok" : bookmark);

  const bookmarks = await request("get", "/api/bookmarks", null, token);
  console.log(`GET /api/bookmarks -> count=${getCount(bookmarks)}`);

  const communities = await request("get", "/api/communities", null, token);
  const communityId = Array.isArray(communities) ? communities[0]?.id : communities?.value?.[0]?.id;
  console.log(`GET /api/communities -> count=${getCount(communities)}`);

  if (communityId) {
    const join = await request("post", `/api/communities/${communityId}/join`, null, token);
    console.log(`POST /api/communities/${communityId}/join ->`, join?.id ? "ok" : join);
  }

  const events = await request("get", "/api/events", null, token);
  const eventId = Array.isArray(events) ? events[0]?.id : events?.value?.[0]?.id;
  console.log(`GET /api/events -> count=${getCount(events)}`);

  if (eventId) {
    const rsvp = await request("post", `/api/events/${eventId}/rsvp`, { rsvp: "MAYBE" }, token);
    console.log(`POST /api/events/${eventId}/rsvp ->`, rsvp?.isRegistered ? "ok" : rsvp);
  }

  const search = await request("get", "/api/search?query=UoG", null, token);
  console.log(`GET /api/search -> returned categories=${Object.keys(search).length}`);

  const notifications = await request("get", "/api/notifications", null, token);
  console.log(`GET /api/notifications -> count=${getCount(notifications)}`);

  const adminAnalytics = await request("get", "/api/admin/analytics", null, token);
  console.log(`GET /api/admin/analytics ->`, adminAnalytics?.timeline ? "ok" : adminAnalytics);

  const auditLogs = await request("get", "/api/admin/audit-logs", null, token);
  console.log(`GET /api/admin/audit-logs -> count=${getCount(auditLogs)}`);

  console.log("== Completed API smoke tests ==");
}

runTests().catch((error) => {
  console.error("Uncaught error during API tests:", error);
  process.exit(1);
});
