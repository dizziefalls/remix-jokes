import { PrismaClient } from "@prisma/client";

let db: PrismaClient

declare global {
  var __db: PrismaClient | undefined
}

//workaround for avoiding production server restarts during dev

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient()
} else {
  if (!global.__db) {
    global.__db = new PrismaClient()
  }
  db = global.__db
}

export { db }