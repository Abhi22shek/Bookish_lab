import HeroSection from "@/components/ui/HeroSection"
import { sampleBooks } from "@/lib/constants"
import BookCard from "@/components/ui/BookCard"

const Page = () => {
  return (
    <main className="wrapper pt-[94px] pb-18 min-h-screen">
      <HeroSection />

      <section>
        <h2 className="section-title mb-6">Popular Books</h2>
        <div className="library-books-grid">
          {sampleBooks.map((book) => (
            <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default Page