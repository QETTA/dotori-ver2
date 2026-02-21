import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authConfig } from "./auth.config";

const USER_DEFAULT_FIELDS = {
	nickname: "",
	phone: "",
	alimtalkOptIn: false,
	children: [],
	region: {
		sido: "",
		sigungu: "",
		dong: "",
	},
	preferences: {
		facilityTypes: [],
		features: [],
	},
	interests: [],
	gpsVerified: false,
	plan: "free",
	onboardingCompleted: false,
} as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.MONGODB_DB_NAME ?? "dotori" }),
	events: {
		async createUser({ user }) {
			await dbConnect();
			await User.findOneAndUpdate(
				{ _id: user.id },
				{ $setOnInsert: USER_DEFAULT_FIELDS },
				{ upsert: true },
			);
		},
	},
});
