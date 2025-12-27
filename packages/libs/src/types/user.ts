import { Request } from "express";

interface User {
  id: string;
  email: string;
  name: string;
  password: string | null;
  following: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomRequest extends Request {
  user?: User | null;
}

export type Role = {
  id: string;
  role: "user" | "seller";
};
