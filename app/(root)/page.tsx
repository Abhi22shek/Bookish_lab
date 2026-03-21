import HeroSection from "@/components/ui/HeroSection"
import BookCard from "@/components/ui/BookCard"
import { getAllBooks } from "@/lib/actions/book.actions"

const Page = async () => {
  const bookResults = await getAllBooks()
  const books = bookResults.success ? bookResults.data ?? [] : [];
  return (
    <main className="wrapper pt-[94px] pb-18 min-h-screen">
      <HeroSection />

      <section>
        <h2 className="section-title mb-6">Popular Books</h2>
        <div className="library-books-grid">
          {books.map((book) => (
            <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default Page