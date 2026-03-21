'use server'

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import { success } from "zod";
import BookSegment from "@/database/models/bookSegment.model";


export const getAllBooks = async () => {
    try {
        await connectToDatabase();

        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books)
        }
    } catch (error) {
        console.error("Error getting all books:", error);
        return {
            success: false,
            error: error
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: true,
                exists: true,
                data: serializeData(existingBook),

            }
        }
        return {
            exists: false
        }
    } catch (error) {
        console.error("Error checking book exists:", error);
        return {
            success: false,
            error: error
        }
    }
}

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }

        // cheeck subscriptioin limit



        //create new book
        const book = await Book.create({ ...data, slug, totalSegments: 0 })

        return {
            success: true,
            data: serializeData(book)
        }



    } catch (error) {
        console.error("Error creating book:", error);
        return {
            success: false,
            error: error
        }
    }
}

export const saveBookSegments = async (bookId: string, segments: TextSegment[], clerkId: string) => {
    try {
        await connectToDatabase();

        console.log("saving book segments...");

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
            clerkId, bookId, content: text, segmentIndex, pageNumber, wordCount
        }))

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log("Saved book segments successfully");

        return {
            success: true,
            data: { segmentsCreated: segments.length }
        }


    } catch (error) {
        console.error("Error saving book segments:", error);

        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);

        console.log("Deleted book segmetn and book due to failure to save segment")

        return {
            success: false,
            error: error
        }
    }
}

