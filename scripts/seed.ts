import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });
config();

import Person from "../src/models/Person";
import Category from "../src/models/Category";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for seeding...");

  const peopleNames = ["Person 1", "Person 2", "Person 3"];
  for (const name of peopleNames) {
    const existing = await Person.findOne({ name });
    if (!existing) {
      await Person.create({ name, isActive: true });
      console.log(`Created person: ${name}`);
    } else {
      console.log(`Person already exists: ${name}`);
    }
  }

  const categoryNames = ["DSA", "JavaScript Problem Solving", "System Design"];
  for (const name of categoryNames) {
    const existing = await Category.findOne({ name });
    if (!existing) {
      await Category.create({ name, isActive: true });
      console.log(`Created category: ${name}`);
    } else {
      console.log(`Category already exists: ${name}`);
    }
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
