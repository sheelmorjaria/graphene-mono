// Admin account recovery, run directly against the database the backend
// .env points at. Passwords are bcrypt-hashed by the pre-save middleware
// in apps/backend/src/models/User.js — they cannot be retrieved, only reset.
//
//   node reset-admin-password.js --list              list accounts (email, role, created)
//   node reset-admin-password.js <admin-email>       reset that admin's password (prompted, hidden)
//   node reset-admin-password.js --create <email>    create a new admin (prompted, hidden)
import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import { stdin, stdout, exit } from "process";

dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: "./apps/backend/.env" });
}

const askHidden = (prompt) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    stdout.write(prompt);
    stdin.on("data", (ch) => {
      const s = ch.toString();
      if (s === "\n" || s === "\r" || s === "\u0004") {
        stdin.pause();
        return;
      }
      if (s === "\u0003") exit(1); // Ctrl+C
      stdout.clearLine(0);
      stdout.cursorTo(0);
      stdout.write(prompt + "*".repeat(rl.line.length + 1));
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const emailRegexFor = (email) =>
  new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  const { default: User } = await import("./apps/backend/src/models/User.js");

  // --list: show what accounts exist so the right one can be targeted
  if (process.argv[2] === "--list") {
    const users = await User.find({}).select("email role createdAt").sort("createdAt");
    console.log(`${users.length} account(s):`);
    for (const u of users) {
      console.log(`  ${u.email}  [${u.role}]  created ${u.createdAt?.toISOString?.().slice(0, 10)}`);
    }
    exit(0);
  }

  // --create <email>: add a new admin (for when no admin exists at all)
  if (process.argv[2] === "--create") {
    const email = process.argv[3];
    if (!email) {
      console.error("Usage: node reset-admin-password.js --create <email>");
      exit(1);
    }
    if (await User.findOne({ email: emailRegexFor(email) })) {
      console.error(`❌ An account already exists for ${email} — reset it instead.`);
      exit(1);
    }
    const newPassword = await askHidden("New admin password: ");
    if (newPassword.length < 8) {
      console.error("❌ Password must be at least 8 characters. Aborted — nothing changed.");
      exit(1);
    }
    const user = new User({
      firstName: "Admin",
      lastName: "User",
      email: email.toLowerCase(),
      password: newPassword, // hashed by pre-save middleware
      role: "admin",
    });
    await user.save();
    console.log(`✅ Admin ${email} created. Log in with the new password.`);
    exit(0);
  }

  // Default: reset an existing admin's password
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node reset-admin-password.js <admin-email> | --list | --create <email>");
    exit(1);
  }
  const user = await User.findOne({ email: emailRegexFor(email), role: "admin" });

  if (!user) {
    const anyRole = await User.findOne({ email: emailRegexFor(email) }).select("role");
    console.error(
      anyRole
        ? `❌ ${email} exists with role "${anyRole.role}", not "admin" — nothing changed.`
        : `❌ No account found for: ${email} — try --list to see accounts.`
    );
    exit(1);
  }

  if (await user.comparePassword("changeme123")) {
    console.log("⚠️  Current password is the seeded default (changeme123) — resetting it now is a good move.");
  }

  const newPassword = await askHidden("New password: ");
  if (newPassword.length < 8) {
    console.error("❌ Password must be at least 8 characters. Aborted — nothing changed.");
    exit(1);
  }

  user.password = newPassword; // hashed by pre-save middleware
  await user.save();

  // Verify round-trip with the saved hash before declaring success
  const saved = await User.findOne({ email: emailRegexFor(email) }).select("password");
  console.log((await saved.comparePassword(newPassword)) ? "✅ Password reset and verified." : "❌ Verification failed — password NOT confirmed, investigate before logging in.");
} catch (error) {
  console.error("❌ Failed:", error.message);
  exit(1);
} finally {
  await mongoose.disconnect().catch(() => {});
}
