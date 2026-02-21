import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI && process.env.SKIP_ENV_VALIDATION !== "1") {
	throw new Error("MONGODB_URI 환경변수를 .env.local에 설정해주세요");
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dotori";
const options = {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
	var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri, options);
		global._mongoClientPromise = client.connect();
	}
	clientPromise = global._mongoClientPromise;
} else {
	client = new MongoClient(uri, options);
	clientPromise = client.connect();
}

export default clientPromise;
