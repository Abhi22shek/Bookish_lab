import { Document } from "mongoose";

export interface IBook extends Document {
    title: string;
    author: string;
    genre: string;
    isbn: string;
    publishedDate: Date;
    price: number;
    stock: number;
    coverImage: string;
    description: string;
    rating: number;
    reviewCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}
