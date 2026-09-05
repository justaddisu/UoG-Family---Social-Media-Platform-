import "dotenv/config";
import express from "express";
import http from "http";
import path from "express-serve-static-core"; // Type safety helper
import pathNode from "path";
import fs from "fs";
import { Server as SocketServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const GEMINI_PLACEHOLDER_KEY = "MY_GEMINI_API_KEY";

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "uog_family_secret_jwt_key_2026_super_secure";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "uog_family_refresh_secret_key_2026_super_secure";

// Enable JSON bodies and CORS
app.use(express.json());

// Express CORS support
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Lazy-loaded Gemini AI client for UoG Family Content Moderation
// Optional feature: if configured, helps moderate user posts for harmful content
let geminiClient: GoogleGenAI | null = null;

function hasConfiguredGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== GEMINI_PLACEHOLDER_KEY);
}

async function promptHiddenInput(promptText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY || !stdout.isTTY) {
      resolve("");
      return;
    }

    let value = "";
    stdout.write(promptText);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.setRawMode?.(true);

    const cleanup = () => {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    const onData = (chunk: string) => {
      const char = String(chunk);

      if (char === "\u0003") {
        cleanup();
        stdout.write("\n");
        reject(new Error("Input cancelled by user."));
        return;
      }

      if (char === "\r" || char === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value.trim());
        return;
      }

      if (char === "\u0008" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      if (char >= " ") {
        value += char;
      }
    };

    stdin.on("data", onData);
  });
}

async function ensureGeminiProductKey(): Promise<void> {
  if (hasConfiguredGeminiKey()) {
    return;
  }

  if (process.env.NODE_ENV === "production" || !process.stdin.isTTY) {
    console.warn("UoG Family: GEMINI_API_KEY is missing. AI moderation will stay disabled.");
    return;
  }

  const providedKey = await promptHiddenInput("Enter Gemini product key (input hidden, press Enter to skip): ");

  if (providedKey) {
    process.env.GEMINI_API_KEY = providedKey;
    console.log("UoG Family: Gemini product key loaded for this runtime session.");
  } else {
    console.warn("UoG Family: No Gemini product key entered. AI moderation will stay disabled.");
  }
}

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== GEMINI_PLACEHOLDER_KEY) {
      try {
        geminiClient = new GoogleGenAI({ apiKey: key });
      } catch (e) {
        console.warn("UoG Family: Could not initialize AI content moderation.", e);
      }
    }
  }
  return geminiClient;
}

// REST Middlewares
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Auto Seeding on Boot
async function seedDatabaseIfEmpty() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already initialized with data.");
    return;
  }

  console.log("Starting UoG Family initial database seeding...");

  // Hashes for initial users
  const passwordHash = await bcrypt.hash("gondar123", 10);

  // 1. Create Core Users & Profiles
  const usersToSeed = [
    {
      email: "super.admin@uog.edu.et",
      role: "SUPER_ADMIN",
      fullName: "Professor Solomon Tasew",
      department: "Office of the President",
      college: "University Administration",
      bio: "Welcome to UoG Family, the official digital hub for the University of Gondar community. Connecting centuries of heritage with modern digital collaboration.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    {
      email: "club.admin@uog.edu.et",
      role: "CLUB_ADMIN",
      fullName: "Kidist Belay",
      department: "Software Engineering",
      college: "College of Informatics",
      bio: "President of the Gondar Tech & Innovation Club. Organizing hackathons, codelabs, and community tech initiatives.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    },
    {
      email: "lecturer.cs@uog.edu.et",
      role: "LECTURER",
      fullName: "Dr. Aster Kassa",
      department: "Computer Science",
      college: "College of Informatics",
      bio: "Lecturer and AI research lead. Enthusiastic about introducing Ethiopian language models to the world.",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
    },
    {
      email: "student.jane@uog.edu.et",
      role: "STUDENT",
      fullName: "Jane Gobena",
      department: "Information Systems",
      college: "College of Informatics",
      bio: "Third-year IS student. Passionate about user interface design, visual arts, and Gondarian historic architectures. Let's study together!",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
    },
    {
      email: "alumni.bob@uog.edu.et",
      role: "ALUMNI",
      fullName: "Dr. Bob Tadesse",
      department: "General Medicine",
      college: "College of Medicine and Health Sciences",
      bio: "UoG Medicine Class of 2023. Currently practicing at Gondar University Specialized Hospital. Alumni networks are our greatest asset.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    },
    {
      email: "moderator@uog.edu.et",
      role: "MODERATOR",
      fullName: "Abebe Demeke",
      department: "Registrar Office",
      college: "Student Affairs",
      bio: "Official Student Affairs Moderator page. Feel free to report content violations or suggest campus events listings.",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
    }
  ];

  const seededUsers: any[] = [];
  for (const item of usersToSeed) {
    const user = await prisma.user.create({
      data: {
        email: item.email,
        password: passwordHash,
        role: item.role,
        isVerified: true,
        profile: {
          create: {
            fullName: item.fullName,
            department: item.department,
            college: item.college,
            bio: item.bio,
            avatarUrl: item.avatarUrl,
            coverUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600",
            skills: "React, Node.js, Public Relations, Medicine, Gondar History, Leadership, Research",
            interests: "Higher Education, Technology, Athletics, Traditional Coffee, Community Care"
          }
        }
      },
      include: { profile: true }
    });
    seededUsers.push(user);
  }

  // Extract critical ids
  const adminId = seededUsers[0].id;
  const clubAdminId = seededUsers[1].id;
  const lecturerId = seededUsers[2].id;
  const studentId = seededUsers[3].id;
  const alumniId = seededUsers[4].id;

  // 2. Seed Mutual Follows
  await prisma.follow.createMany({
    data: [
      { followerId: studentId, followingId: lecturerId },
      { followerId: lecturerId, followingId: studentId },
      { followerId: studentId, followingId: clubAdminId },
      { followerId: clubAdminId, followingId: studentId },
      { followerId: studentId, followingId: alumniId },
      { followerId: alumniId, followingId: studentId },
      { followerId: alumniId, followingId: adminId }
    ]
  });

  // 3. Seed Official Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Official Launch of the UoG Family Community Platform",
        content: `Today marks an exciting milestone! The University of Gondar is proud to officially launch "UoG Family" – our dedicated digital platform for student connection, academic dialogue, alumni outreach, and secure discussion. Explore the newsfeed, register for events, join college communities, and network with Gondar families worldwide.`,
        priority: "HIGH",
        isPinned: true,
        scope: "GENERAL",
        createdBy: "Office of the President"
      },
      {
        title: "Informatics College Academic Grading Systems Policy Updated",
        content: "The Academic Council has approved a standard revision of GPA and practical lab scoring systems for our Informatics undergraduate departments. Detail booklets are available at the Registrar's Office.",
        priority: "NORMAL",
        isPinned: false,
        scope: "DEPARTMENT",
        scopeId: "College of Informatics",
        createdBy: "Dr. Aster Kassa"
      }
    ]
  });

  // 4. Seed Communities (Groups)
  const groupTech = await prisma.group.create({
    data: {
      name: "Gondar Tech & Innovation Club",
      description: "The primary student innovation hub at Gondar. Organizing hackathons, campus codelabs, coding competitions, and open-source project accelerators.",
      type: "CLUB",
      coverUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600",
      avatarUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=150",
      createdById: clubAdminId,
      members: {
        create: [
          { userId: clubAdminId, role: "ADMIN" },
          { userId: studentId, role: "MEMBER" },
          { userId: lecturerId, role: "MEMBER" }
        ]
      }
    }
  });

  const groupMed = await prisma.group.create({
    data: {
      name: "UoG Medicine Alumni Network",
      description: "Official group for alumni, practicing doctors, house surgeons, and graduate research fellows of the prestigious Gondar College of Medicine & Health Sciences.",
      type: "ALUMNI_GROUP",
      coverUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600",
      avatarUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=150",
      createdById: alumniId,
      members: {
        create: [
          { userId: alumniId, role: "ADMIN" },
          { userId: adminId, role: "MEMBER" }
        ]
      }
    }
  });

  // 5. Seed Events
  const eventHack = await prisma.event.create({
    data: {
      title: "Gondar annual Hackathon 2026",
      description: "Join us for a 48-hour sprint of coding, design brainstorms, and AI integrations. Build local solutions for digital payments, agronomy, health delivery, and student productivity in Gondar.",
      location: "Informatics Labs, Maraki Campus",
      startDate: new Date("2026-06-15T09:00:00Z"),
      endDate: new Date("2026-06-17T18:00:00Z"),
      coverUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600",
      organId: groupTech.id,
      creatorRole: "CLUB_ADMIN",
      registrations: {
        create: [
          { userId: studentId, rsvp: "YES" },
          { userId: clubAdminId, rsvp: "YES" }
        ]
      }
    }
  });

  // 6. Seed Posts & Media
  const post1 = await prisma.post.create({
    data: {
      authorId: studentId,
      content: "Amazing morning studying at the historic Fasil Ghebbi! Looking forward to presenting my web interface project this afternoon. #GondarTech #StudentLife",
      visibility: "PUBLIC",
      media: {
        create: {
          url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600",
          type: "IMAGE"
        }
      }
    }
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: lecturerId,
      content: "Thrilled to announce that our research paper on 'Amharic Voice Synthesis Models for Agricultural Outreach' has been accepted for presentation. Our students in Informatics did a magnificent job. #UoGResearch",
      visibility: "PUBLIC"
    }
  });

  // 7. Seed Comments & Replies
  const comment = await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: lecturerId,
      content: "That is brilliant, Jane! Love the focus. Remember to practice your time-boxing during the demonstration."
    }
  });

  await prisma.commentReply.create({
    data: {
      commentId: comment.id,
      authorId: studentId,
      content: "Thank you Dr. Aster! Your advice on structural layouts was incredibly helpful."
    }
  });

  // 8. Seed Reactions
  await prisma.reaction.createMany({
    data: [
      { userId: lecturerId, postId: post1.id, type: "LIKE" },
      { userId: clubAdminId, postId: post1.id, type: "CELEBRATE" },
      { userId: studentId, postId: post2.id, type: "SUPPORT" },
      { userId: alumniId, postId: post2.id, type: "INSIGHTFUL" }
    ]
  });

  // 9. Seed Hashtags & Junctions
  await prisma.hashtag.createMany({
    data: [
      { name: "gondartech" },
      { name: "studentlife" },
      { name: "uogresearch" }
    ]
  });

  await prisma.postHashtag.createMany({
    data: [
      { postId: post1.id, hashtagName: "gondartech" },
      { postId: post1.id, hashtagName: "studentlife" },
      { postId: post2.id, hashtagName: "uogresearch" }
    ]
  });

  // 10. Seed Conversation and Messages
  const conversation = await prisma.conversation.create({
    data: {
      name: "Gondar Tech Sync Group",
      isGroup: true,
      members: {
        create: [
          { userId: clubAdminId },
          { userId: studentId },
          { userId: lecturerId }
        ]
      }
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: clubAdminId,
        content: "Hi team! Welcome to the official Tech sync group. Let's start coordinates for our upcoming 2026 hackathon."
      },
      {
        conversationId: conversation.id,
        senderId: studentId,
        content: "Awesome! I am working on the landing page layout right now. Will post some mockups inside the feed."
      }
    ]
  });

  // 11. Seed Notification
  await prisma.notification.create({
    data: {
      userId: studentId,
      senderId: lecturerId,
      type: "COMMENT",
      message: "Dr. Aster Kassa commented on your post.",
      entityId: post1.id,
      isRead: false
    }
  });

  console.log("UoG Family initial database seeding completed successfully!");
}

// REST APIs Implementation

// AUTH API
app.post("/api/auth/register", async (req: any, res: any) => {
  try {
    const { email, password, fullName, role, department, college, graduationYear } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "STUDENT";

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
        isVerified: true,
        profile: {
          create: {
            fullName,
            department: department || "",
            college: college || "",
            graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
            privacySettings: "PUBLIC"
          }
        }
      },
      include: { profile: true }
    });

    const accessToken = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign({ id: newUser.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    // Remove sensitive data
    const { password: _, ...safeUser } = newUser;

    // Log the user registration
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: "REGISTER",
        description: `Successfully registered new account: ${email} as ${userRole}`
      }
    });

    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server registration failure." });
  }
});

app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "10d" });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });

    // Remove password
    const { password: _, ...safeUser } = user;

    // Log event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        description: `User successfully authenticated: ${email}`
      }
    });

    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server login failure." });
  }
});

app.post("/api/auth/refresh", async (req: any, res: any) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token is required." });

  try {
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) return res.status(403).json({ error: "Invalid refresh token." });

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { profile: true }
      });
      if (!user) return res.status(404).json({ error: "User not found." });

      const newAccessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
      const { password: _, ...safeUser } = user;

      res.json({ accessToken: newAccessToken, user: safeUser });
    });
  } catch (e) {
    res.status(500).json({ error: "Refresh process error." });
  }
});

app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: "Identification failed" });
  }
});

// USER & PROFILE API
app.get("/api/users/suggestions", authenticateToken, async (req: any, res: any) => {
  try {
    // Return users the current user does not follow
    const selfId = req.user.id;

    const followingRelations = await prisma.follow.findMany({
      where: { followerId: selfId },
      select: { followingId: true }
    });
    const followingIds = followingRelations.map(f => f.followingId).concat(selfId);

    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: { notIn: followingIds }
      },
      include: { profile: true },
      take: 6
    });

    const safeUsers = suggestedUsers.map(u => {
      const { password: _, ...safe } = u;
      return safe;
    });

    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed suggestions retrieval" });
  }
});

app.get("/api/users/:id/profile", authenticateToken, async (req: any, res: any) => {
  try {
    const targetUserId = req.params.id;
    const selfId = req.user.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            sentFollows: true, // Following count
            receivedFollows: true // Followers count
          }
        }
      }
    });

    if (!targetUser) return res.status(404).json({ error: "User profile not found." });

    // Check if following
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: selfId, followingId: targetUserId }
      }
    });

    const isFollowing = !!followRecord;
    const { password: _, ...safeUser } = targetUser;

    res.json({
      ...safeUser,
      isFollowing,
      stats: {
        posts: targetUser._count.posts,
        following: targetUser._count.sentFollows,
        followers: targetUser._count.receivedFollows
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error reading profile" });
  }
});

app.put("/api/users/profile", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const { fullName, bio, department, college, graduationYear, skills, interests, contactInfo, privacySettings, avatarUrl, coverUrl } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: selfId },
      data: {
        fullName,
        bio,
        department,
        college,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
        skills,
        interests,
        contactInfo,
        privacySettings,
        avatarUrl,
        coverUrl
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: selfId,
        action: "UPDATE_PROFILE",
        description: `User successfully modified profile fields for ${fullName}`
      }
    });

    res.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Could not update user profile" });
  }
});

// FOLLOWS
app.post("/api/users/:id/follow", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const targetId = req.params.id;

  if (selfId === targetId) return res.status(400).json({ error: "You cannot follow yourself" });

  try {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: selfId, followingId: targetId } }
    });

    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId: selfId, followingId: targetId } }
      });

      res.json({ isFollowing: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: { followerId: selfId, followingId: targetId }
      });

      // Notify
      const selfUser = await prisma.user.findUnique({
        where: { id: selfId },
        include: { profile: true }
      });

      await prisma.notification.create({
        data: {
          userId: targetId,
          senderId: selfId,
          type: "FOLLOW",
          message: `${selfUser?.profile?.fullName || "A user"} started following you.`,
          entityId: selfId
        }
      });

      // Socket emit notify
      const recipientSocket = onlineUsers.get(targetId);
      if (recipientSocket) {
        io.to(recipientSocket).emit("notification", {
          message: `${selfUser?.profile?.fullName || "A user"} started following you.`,
          type: "FOLLOW",
          entityId: selfId
        });
      }

      res.json({ isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Follow toggle failed" });
  }
});

// FOLLOWING / FOLLOWERS LIST
app.get("/api/users/:id/followers", authenticateToken, async (req: any, res: any) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: req.params.id },
      include: { follower: { include: { profile: true } } }
    });
    const result = follows.map(f => {
      const { password: _, ...safeUser } = f.follower;
      return safeUser;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Error getting followers" });
  }
});

app.get("/api/users/:id/following", authenticateToken, async (req: any, res: any) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.params.id },
      include: { following: { include: { profile: true } } }
    });
    const result = follows.map(f => {
      const { password: _, ...safeUser } = f.following;
      return safeUser;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Error getting following list" });
  }
});

// POST METHOD
app.post("/api/posts", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    let { content, visibility, mediaUrls, repostOfId } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content cannot be empty." });
    }

    // AI Content Filtration if Gemini is configured!
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `Analyze this university social network post. If there is strong hate speech, extreme toxicity, academic cheating assistance, or explicit verbal abuse, respond with ONLY the word "FLAGGED: <reason>". Otherwise, respond with the exact word "SAFE". Content: "${content}"`;
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        const auditText = response.text?.trim() || "";
        if (auditText.startsWith("FLAGGED")) {
          // Log a reported event and prevent creation or warning
          return res.status(400).json({
            error: "Our automated systems have flagged this post. Policy violation: content violates Gondar University ethics standards."
          });
        }
      } catch (gem_err) {
        console.error("Gemini AI content filtration failed:", gem_err);
      }
    }

    // Create the Post
    const post = await prisma.post.create({
      data: {
        authorId: selfId,
        content,
        visibility: visibility || "PUBLIC",
        repostOfId: repostOfId || undefined,
        media: mediaUrls && mediaUrls.length > 0 ? {
          create: mediaUrls.map((url: string) => ({
            url,
            type: url.endsWith(".mp4") ? "VIDEO" : "IMAGE"
          }))
        } : undefined
      },
      include: {
        author: { include: { profile: true } },
        media: true,
        reactions: true,
        comments: { include: { author: { include: { profile: true } } } }
      }
    });

    // Extract hashtags and link them
    const hashtagRegex = /#(\w+)/g;
    let match;
    const hashtagsFound = [];
    while ((match = hashtagRegex.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      hashtagsFound.push(tag);
    }

    if (hashtagsFound.length > 0) {
      for (const tag of hashtagsFound) {
        await prisma.hashtag.upsert({
          where: { name: tag },
          update: {},
          create: { name: tag }
        });
        await prisma.postHashtag.create({
          data: { postId: post.id, hashtagName: tag }
        }).catch(() => {}); // catch duplicate records
      }
    }

    res.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Could not publish post" });
  }
});

// GET NEWSFEED
app.get("/api/posts", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const { feedType } = req.query; // latest, following, trending

    let posts: any[] = [];

    if (feedType === "following") {
      const relations = await prisma.follow.findMany({
        where: { followerId: selfId },
        select: { followingId: true }
      });
      const activeIds = relations.map(r => r.followingId).concat(selfId);

      posts = await prisma.post.findMany({
        where: { authorId: { in: activeIds } },
        include: {
          author: { include: { profile: true } },
          media: true,
          reactions: true,
          comments: {
            include: {
              author: { include: { profile: true } },
              replies: { include: { author: { include: { profile: true } } } }
            },
            orderBy: { createdAt: "asc" }
          },
          repostOf: { include: { author: { include: { profile: true } } } }
        },
        orderBy: { createdAt: "desc" }
      });
    } else if (feedType === "trending") {
      // Feed ranked by total likes + comments count
      posts = await prisma.post.findMany({
        include: {
          author: { include: { profile: true } },
          media: true,
          reactions: true,
          comments: {
            include: {
              author: { include: { profile: true } },
              replies: { include: { author: { include: { profile: true } } } }
            }
          },
          repostOf: { include: { author: { include: { profile: true } } } }
        }
      });
      // Sort by interactions
      posts.sort((a, b) => {
        const scoreA = (a.reactions.length * 2) + a.comments.length;
        const scoreB = (b.reactions.length * 2) + b.comments.length;
        return scoreB - scoreA;
      });
    } else {
      // Default: Latest
      posts = await prisma.post.findMany({
        include: {
          author: { include: { profile: true } },
          media: true,
          reactions: true,
          comments: {
            include: {
              author: { include: { profile: true } },
              replies: { include: { author: { include: { profile: true } } } }
            },
            orderBy: { createdAt: "asc" }
          },
          repostOf: { include: { author: { include: { profile: true } } } }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    res.json(posts);
  } catch (error) {
    console.error("Listing posts error:", error);
    res.status(500).json({ error: "Failed listing posts" });
  }
});

// SINGLE POST VIEW
app.get("/api/posts/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { include: { profile: true } },
        media: true,
        reactions: true,
        comments: {
          include: {
            author: { include: { profile: true } },
            replies: { include: { author: { include: { profile: true } } } }
          },
          orderBy: { createdAt: "asc" }
        },
        repostOf: { include: { author: { include: { profile: true } } } }
      }
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: "Post details query error" });
  }
});

// DELETE POST
app.delete("/api/posts/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const selfRole = req.user.role;
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Allow deleting if is author or moderator/super admin
    if (post.authorId !== selfId && selfRole !== "MODERATOR" && selfRole !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Unauthorized Content Action" });
    }

    await prisma.post.delete({ where: { id: req.params.id } });

    // Log the delete action (moderation if admin)
    if (post.authorId !== selfId) {
      await prisma.moderationLog.create({
        data: {
          moderatorId: selfId,
          action: "DELETE_POST",
          targetId: req.params.id,
          targetType: "POST",
          reason: "Violates platform community guidelines"
        }
      });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Post deletion failed" });
  }
});

// REACTIONS
app.post("/api/posts/:id/react", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const postId = req.params.id;
  const { type } = req.body; // LIKE, LOVE, CELEBRATE, SUPPORT, INSIGHTFUL, FUNNY

  try {
    if (!type) return res.status(400).json({ error: "Reaction type required" });

    // Check existing reaction for the given post (commentId is null for post reactions)
    const existing = await prisma.reaction.findFirst({
      where: {
        userId: selfId,
        postId,
        commentId: null
      }
    });

    if (existing) {
      if (existing.type === type) {
        // Undo reaction
        await prisma.reaction.delete({
          where: { id: existing.id }
        });
        return res.json({ success: true, action: "REMOVED" });
      } else {
        // Update reaction
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type }
        });
        return res.json({ success: true, action: "UPDATED", reaction: updated });
      }
    } else {
      // Create reaction
      const r = await prisma.reaction.create({
        data: { userId: selfId, postId, type }
      });

      // Notify Author
      const post = await prisma.post.findUnique({ where: { id: postId } });
      const reactor = await prisma.user.findUnique({ where: { id: selfId }, include: { profile: true } });

      if (post && post.authorId !== selfId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            senderId: selfId,
            type: "REACTION",
            message: `${reactor?.profile?.fullName || "A user"} reacted ${type} to your post.`,
            entityId: postId
          }
        });

        const recSocket = onlineUsers.get(post.authorId);
        if (recSocket) {
          io.to(recSocket).emit("notification", {
            message: `${reactor?.profile?.fullName || "A user"} reacted ${type} to your post.`,
            type: "REACTION",
            entityId: postId
          });
        }
      }

      res.json({ success: true, action: "CREATED", reaction: r });
    }
  } catch (error) {
    console.error("Reacting failed:", error);
    res.status(500).json({ error: "Reacting failure" });
  }
});

// COMMENTS
app.post("/api/posts/:id/comments", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const postId = req.params.id;
  const { content } = req.body;

  try {
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Comment cannot be blank." });
    }

    const comment = await prisma.comment.create({
      data: { postId, authorId: selfId, content },
      include: { author: { include: { profile: true } } }
    });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    const authorRes = await prisma.user.findUnique({ where: { id: selfId }, include: { profile: true } });

    if (post && post.authorId !== selfId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          senderId: selfId,
          type: "COMMENT",
          message: `${authorRes?.profile?.fullName || "A user"} commented on your post.`,
          entityId: postId
        }
      });

      const recSoc = onlineUsers.get(post.authorId);
      if (recSoc) {
        io.to(recSoc).emit("notification", {
          message: `${authorRes?.profile?.fullName || "A user"} commented on your post.`,
          type: "COMMENT",
          entityId: postId
        });
      }
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Replying post failed" });
  }
});

// COMMENT REPLY (NESTED)
app.post("/api/comments/:id/replies", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const commentId = req.params.id;
  const { content } = req.body;

  try {
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Reply content required." });
    }

    const reply = await prisma.commentReply.create({
      data: { commentId, authorId: selfId, content },
      include: { author: { include: { profile: true } } }
    });

    const rootComment = await prisma.comment.findUnique({ where: { id: commentId } });
    const replier = await prisma.user.findUnique({ where: { id: selfId }, include: { profile: true } });

    if (rootComment && rootComment.authorId !== selfId) {
      await prisma.notification.create({
        data: {
          userId: rootComment.authorId,
          senderId: selfId,
          type: "REPLY",
          message: `${replier?.profile?.fullName || "A user"} replied to your comment.`,
          entityId: rootComment.postId
        }
      });
    }

    res.json(reply);
  } catch (error) {
    res.status(500).json({ error: "Reply submission fail" });
  }
});

// DELETE COMMENT
app.delete("/api/comments/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const role = req.user.role;
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.authorId !== selfId && role !== "MODERATOR" && role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Unauthorized comment action" });
    }

    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed comment delete" });
  }
});

// BOOKMARK POSTS
app.post("/api/posts/:id/bookmark", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const postId = req.params.id;

  try {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: selfId, postId } }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      res.json({ isBookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { userId: selfId, postId } });
      res.json({ isBookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Bookmark operations failure" });
  }
});

app.get("/api/bookmarks", authenticateToken, async (req: any, res: any) => {
  try {
    const bms = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        post: {
          include: {
            author: { include: { profile: true } },
            media: true,
            reactions: true,
            comments: { include: { author: { include: { profile: true } } } }
          }
        }
      }
    });
    res.json(bms.map(b => b.post));
  } catch (e) {
    res.status(500).json({ error: "Bookmarks extraction fail." });
  }
});

// REAL-TIME CHAT OPERATIONS (REST API HANDLERS)
app.get("/api/chats", authenticateToken, async (req: any, res: any) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: { some: { userId: req.user.id } }
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Chats recovery failed" });
  }
});

app.get("/api/chats/:id/messages", authenticateToken, async (req: any, res: any) => {
  try {
    const msgs = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: { sender: { include: { profile: true } } },
      orderBy: { createdAt: "asc" }
    });
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

app.post("/api/chats", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const { recipientId, isGroup, name, memberIds } = req.body;

  try {
    if (isGroup) {
      const gConv = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          members: {
            create: [
              { userId: selfId },
              ...(memberIds || []).map((id: string) => ({ userId: id }))
            ]
          }
        },
        include: {
          members: { include: { user: { include: { profile: true } } } }
        }
      });
      return res.json(gConv);
    }

    // 1-to-1 conversation checks to prevent duplicates
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: selfId } } },
          { members: { some: { userId: recipientId } } }
        ]
      },
      include: {
        members: { include: { user: { include: { profile: true } } } }
      }
    });

    if (existing) {
      return res.json(existing);
    }

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: selfId },
            { userId: recipientId }
          ]
        }
      },
      include: {
        members: { include: { user: { include: { profile: true } } } }
      }
    });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Error initiating conversation" });
  }
});

// MESSAGING
app.post("/api/chats/:id/messages", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const conversationId = req.params.id;
  const { content } = req.body;

  try {
    const msg = await prisma.message.create({
      data: { conversationId, senderId: selfId, content },
      include: { sender: { include: { profile: true } } }
    });

    // Notify other members
    const members = await prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: selfId } }
    });

    for (const member of members) {
      const userSocketId = onlineUsers.get(member.userId);
      if (userSocketId) {
        io.to(userSocketId).emit("message:received", msg);
      }
    }

    res.json(msg);
  } catch (e) {
    res.status(500).json({ error: "Message creation failed." });
  }
});

// COMMUNITIES
app.get("/api/communities", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const groups = await prisma.group.findMany({
      include: {
        members: true,
        _count: { select: { members: true } }
      }
    });

    const enriched = groups.map(g => {
      const isJoined = g.members.some(m => m.userId === selfId);
      return {
        ...g,
        isJoined,
        membersCount: g._count.members
      };
    });

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: "Problem listing communities" });
  }
});

app.post("/api/communities/:id/join", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const groupId = req.params.id;

  try {
    const ext = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: selfId } }
    });

    if (ext) {
      await prisma.groupMember.delete({ where: { id: ext.id } });
      res.json({ isJoined: false });
    } else {
      await prisma.groupMember.create({ data: { groupId, userId: selfId, role: "MEMBER" } });
      res.json({ isJoined: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed group toggling" });
  }
});

app.post("/api/communities", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const { name, description, type, coverUrl, avatarUrl } = req.body;

  try {
    if (!name) return res.status(400).json({ error: "Name is required" });

    const ng = await prisma.group.create({
      data: {
        name,
        description,
        type: type || "CLUB",
        coverUrl: coverUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=150",
        createdById: selfId,
        members: {
          create: { userId: selfId, role: "ADMIN" }
        }
      }
    });

    res.json(ng);
  } catch (error) {
    res.status(500).json({ error: "Group creation failed" });
  }
});

// EVENTS API
app.get("/api/events", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const events = await prisma.event.findMany({
      include: {
        registrations: true,
        _count: { select: { registrations: true } }
      },
      orderBy: { startDate: "asc" }
    });

    const enriched = events.map(ev => {
      const reg = ev.registrations.find(r => r.userId === selfId);
      return {
        ...ev,
        isRegistered: !!reg,
        userRsvp: reg ? reg.rsvp : undefined,
        registrationsCount: ev._count.registrations
      };
    });

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: "Calendar extraction failure" });
  }
});

app.post("/api/events/:id/rsvp", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const eventId = req.params.id;
  const { rsvp } = req.body; // YES, MAYBE, NO

  try {
    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId: selfId } }
    });

    if (existing) {
      if (rsvp === "NONE") {
        await prisma.eventRegistration.delete({ where: { id: existing.id } });
        return res.json({ isRegistered: false });
      } else {
        const u = await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { rsvp: rsvp || "YES" }
        });
        return res.json({ isRegistered: true, rsvp: u.rsvp });
      }
    } else {
      const u = await prisma.eventRegistration.create({
        data: { eventId, userId: selfId, rsvp: rsvp || "YES" }
      });
      return res.json({ isRegistered: true, rsvp: u.rsvp });
    }
  } catch (err) {
    res.status(500).json({ error: "RSVP register failed" });
  }
});

app.post("/api/events", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const role = req.user.role;
  const { title, description, location, startDate, endDate, coverUrl, organId } = req.body;

  try {
    const ev = await prisma.event.create({
      data: {
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        coverUrl: coverUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600",
        organId: organId || selfId,
        creatorRole: role
      }
    });

    res.json(ev);
  } catch (e) {
    res.status(500).json({ error: "Event publishing failed" });
  }
});

// ANNOUNCEMENTS
app.get("/api/announcements", authenticateToken, async (req: any, res: any) => {
  try {
    const list = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ]
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed fetching announcements" });
  }
});

app.post("/api/announcements", authenticateToken, async (req: any, res: any) => {
  try {
    const selfId = req.user.id;
    const role = req.user.role;

    if (role !== "MODERATOR" && role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Access denied. Admin announcements only." });
    }

    const { title, content, priority, isPinned, scope, scopeId } = req.body;

    const caller = await prisma.user.findUnique({
      where: { id: selfId },
      include: { profile: true }
    });

    const ann = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || "NORMAL",
        isPinned: !!isPinned,
        scope: scope || "GENERAL",
        scopeId,
        createdBy: caller?.profile?.fullName || "Administrative Council"
      }
    });

    // Notify all users in socket
    io.emit("announcement:new", {
      title,
      priority,
      message: "A new official administrative council memo has been pinned."
    });

    res.json(ann);
  } catch (e) {
    res.status(500).json({ error: "Failed publishing announcement" });
  }
});

// NOTIFICATIONS
app.get("/api/notifications", authenticateToken, async (req: any, res: any) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: { sender: { include: { profile: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: "Failed listing notifications" });
  }
});

app.post("/api/notifications/read", authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Could not read notices" });
  }
});

// SEARCH API
app.get("/api/search", authenticateToken, async (req: any, res: any) => {
  const { q, type } = req.query; // q matches string, type matches users/posts/groups/events/hashtags

  try {
    const searchStr = q || "";

    if (type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: searchStr } },
            { profile: { fullName: { contains: searchStr } } },
            { profile: { department: { contains: searchStr } } }
          ]
        },
        include: { profile: true }
      });
      return res.json(users.map(u => {
        const { password: _, ...rest } = u;
        return rest;
      }));
    }

    if (type === "groups") {
      const groups = await prisma.group.findMany({
        where: {
          OR: [
            { name: { contains: searchStr } },
            { description: { contains: searchStr } }
          ]
        }
      });
      return res.json(groups);
    }

    if (type === "events") {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: searchStr } },
            { description: { contains: searchStr } },
            { location: { contains: searchStr } }
          ]
        }
      });
      return res.json(events);
    }

    // Default to search Posts
    let posts = [];
    if (searchStr.startsWith("#")) {
      const hash = searchStr.substring(1).toLowerCase();
      posts = await prisma.post.findMany({
        where: {
          hashtags: { some: { hashtagName: hash } }
        },
        include: {
          author: { include: { profile: true } },
          media: true,
          reactions: true,
          comments: { include: { author: { include: { profile: true } } } }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      posts = await prisma.post.findMany({
        where: {
          content: { contains: searchStr }
        },
        include: {
          author: { include: { profile: true } },
          media: true,
          reactions: true,
          comments: { include: { author: { include: { profile: true } } } }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    res.json(posts);
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: "Failed querying platform databases." });
  }
});

// Ensure uploads directory exists
const uploadsDir = pathNode.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// MEDIA UPLOAD HANDLER (Save local base64 images or fallback to Unsplash)
app.post("/api/media/upload", authenticateToken, async (req: any, res: any) => {
  const { filename, base64 } = req.body;
  try {
    // If base64 data is provided, save it locally
    if (base64) {
      try {
        const buffer = Buffer.from(base64, 'base64');
        const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = pathNode.join(uploadsDir, safeName);
        fs.writeFileSync(filePath, buffer);
        return res.json({ url: `/uploads/${safeName}` });
      } catch (writeErr) {
        console.error('Local image save failed, using Unsplash fallback:', writeErr);
      }
    }
    
    // Fallback: return random Unsplash campus image
    const urls = [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600",
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600",
      "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=600"
    ];
    const randomIndex = Math.floor(Math.random() * urls.length);
    res.json({ url: urls[randomIndex] });
  } catch (e) {
    console.error('Media upload error:', e);
    res.status(500).json({ error: "Failed to upload media" });
  }
});

// REPORTS & MODERATION
app.post("/api/reports", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const { targetType, targetId, reason, description } = req.body;

  try {
    const report = await prisma.report.create({
      data: {
        reporterId: selfId,
        targetType,
        targetId,
        reason,
        description,
        postId: targetType === "POST" ? targetId : undefined,
        commentId: targetType === "COMMENT" ? targetId : undefined,
        reportedUserId: targetType === "USER" ? targetId : undefined
      }
    });

    res.json(report);
  } catch (error) {
    console.error("Report filing failed:", error);
    res.status(500).json({ error: "Problem logging notification report" });
  }
});

app.get("/api/reports", authenticateToken, async (req: any, res: any) => {
  const role = req.user.role;
  if (role !== "MODERATOR" && role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const list = await prisma.report.findMany({
      include: {
        reporter: { include: { profile: true } },
        reportedUser: { include: { profile: true } },
        post: { include: { author: { include: { profile: true } } } },
        comment: { include: { author: { include: { profile: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Could not list reports" });
  }
});

app.post("/api/reports/:id/resolve", authenticateToken, async (req: any, res: any) => {
  const selfId = req.user.id;
  const role = req.user.role;
  if (role !== "MODERATOR" && role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { status, actionTaken } = req.body; // status: RESOLVED, DISMISSED. actionTaken: BAN, WARNING, DELETE, NONE

  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Take action
    if (actionTaken === "DELETE") {
      if (report.targetType === "POST") {
        await prisma.post.delete({ where: { id: report.targetId } }).catch(() => {});
      } else if (report.targetType === "COMMENT") {
        await prisma.comment.delete({ where: { id: report.targetId } }).catch(() => {});
      }
    } else if (actionTaken === "BAN" && report.reportedUserId) {
      // Modify user role or delete
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { role: "STUDENT", isVerified: false } // Soft Ban
      });
    }

    await prisma.moderationLog.create({
      data: {
        moderatorId: selfId,
        action: `RESOLVE_REPORT_${status}_${actionTaken}`,
        targetId: report.targetId,
        targetType: report.targetType,
        reason: `Report resolved by admin: ${status}. Action executed: ${actionTaken}`
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Could not resolve report node" });
  }
});

// ADMIN ANALYTICS & AUDIT LOGS
app.get("/api/admin/analytics", authenticateToken, async (req: any, res: any) => {
  const role = req.user.role;
  if (role !== "MODERATOR" && role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Administration access denied" });
  }

  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const commentCount = await prisma.comment.count();
    const reactionCount = await prisma.reaction.count();
    const groupsCount = await prisma.group.count();
    const eventCount = await prisma.event.count();

    const pendingReports = await prisma.report.count({ where: { status: "PENDING" } });
    const resolvedReports = await prisma.report.count({ where: { status: "RESOLVED" } });

    // Build timeline charts mock/dynamic payload based on database seed
    const analytics = {
      userGrowth: [
        { date: "May 25", count: userCount - 4 },
        { date: "May 27", count: userCount - 2 },
        { date: "May 31", count: userCount }
      ],
      activeUsersCount: userCount,
      engagementRate: postCount > 0 ? Math.round(((commentCount + reactionCount) / postCount) * 10) / 10 : 0,
      postsCount: postCount,
      commentsCount: commentCount,
      reactionsCount: reactionCount,
      groupGrowth: [
        { type: "CLUBS", count: await prisma.group.count({ where: { type: "CLUB" } }) },
        { type: "ALUMNI", count: await prisma.group.count({ where: { type: "ALUMNI_GROUP" } }) },
        { type: "DEPT", count: await prisma.group.count({ where: { type: "DEPARTMENT" } }) }
      ],
      mostActiveDepartments: [
        { department: "Computer Science", postsCount: Math.max(3, postCount) },
        { department: "General Medicine", postsCount: 1 }
      ],
      moderationCount: {
        pendingReports,
        resolvedReports
      }
    };

    res.json(analytics);
  } catch (e) {
    res.status(500).json({ error: "Could not gather system analytics" });
  }
});

app.get("/api/admin/audit-logs", authenticateToken, async (req: any, res: any) => {
  const role = req.user.role;
  if (role !== "SUPER_ADMIN") return res.status(403).json({ error: "Access restricted to Super Admin" });

  try {
    const list = await prisma.auditLog.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Audit retrieval error" });
  }
});

app.get("/api/admin/roles", authenticateToken, async (req: any, res: any) => {
  const role = req.user.role;
  if (role !== "SUPER_ADMIN") return res.status(403).json({ error: "Super Admin authorization required" });

  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(users.map(u => {
      const { password: _, ...safe } = u;
      return safe;
    }));
  } catch (e) {
    res.status(500).json({ error: "Failed fetching user roster" });
  }
});

app.put("/api/admin/roles/:id", authenticateToken, async (req: any, res: any) => {
  const role = req.user.role;
  if (role !== "SUPER_ADMIN") return res.status(403).json({ error: "Super Admin privileges required." });

  const { role: newRole } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: newRole },
      include: { profile: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "CHANGE_ROLE",
        description: `Upgraded User role of ${updated.email} to ${newRole}`
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Role modification error" });
  }
});


// Real-time Sockets Handler
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User online identity
  socket.on("user:identify", (userId: string) => {
    onlineUsers.set(userId, socket.id);
    io.emit("users:online", Array.from(onlineUsers.keys()));
    console.log(`User ${userId} binded to Socket ${socket.id}`);
  });

  // Chat channels subscriptions
  socket.on("chat:join", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
  });

  // Typing state indicators
  socket.on("typing:start", (data: { conversationId: string; userId: string; userName: string }) => {
    socket.to(data.conversationId).emit("typing:start", data);
  });

  socket.on("typing:stop", (data: { conversationId: string; userId: string }) => {
    socket.to(data.conversationId).emit("typing:stop", data);
  });

  // Client sent custom chat message
  socket.on("message:send", async (data: { conversationId: string; senderId: string; content: string }) => {
    try {
      const msg = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content
        },
        include: { sender: { include: { profile: true } } }
      });

      // Broadcast back inside room
      io.to(data.conversationId).emit("message:received", msg);

      // Emit visual notification alerts to offline / idle members
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { members: true }
      });

      if (conversation) {
        const otherMembers = conversation.members.filter(m => m.userId !== data.senderId);
        for (const m of otherMembers) {
          const recSocket = onlineUsers.get(m.userId);
          if (recSocket && !socket.rooms.has(data.conversationId)) {
            io.to(recSocket).emit("notification", {
              type: "MESSAGE",
              message: `${msg.sender.profile?.fullName || "A user"} messaged you: "${data.content.substring(0, 30)}..."`,
              entityId: data.conversationId
            });
          }
        }
      }
    } catch (err) {
      console.error("Socket chat writing failed:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} logged off.`);
        break;
      }
    }
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });
});

// STARTUP VITE INTEGRATIONS & STATIC FILES HANDLERS
async function startFullStackServer() {
  await ensureGeminiProductKey();

  // Sync core database data
  await seedDatabaseIfEmpty();

  // Mounting standard Vite pipelines
  if (process.env.NODE_ENV !== "production") {
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(viteInstance.middlewares);
  } else {
    // Standard Production Serve
    const prodDist = pathNode.join(process.cwd(), "dist");
    app.use(express.static(prodDist));
    app._router.get("*", (req: any, res: any) => {
      res.sendFile(pathNode.join(prodDist, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`UoG Family active at: http://localhost:${PORT}`);
  });
}

startFullStackServer().catch((error) => {
  console.error("Failed to bootstrap fullstack servers:", error);
});
