import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-black">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            HELVETICA
          </Link>
          <div className="flex space-x-8">
            <Link href="#work" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Work
            </Link>
            <Link href="#about" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 container mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7 mb-8 md:mb-0">
            <h1 className="text-8xl md:text-9xl font-bold tracking-tighter leading-none mb-6">
              SWISS
              <br />
              DESIGN
            </h1>
            <p className="text-xl max-w-xl">
              Clarity. Precision. Objectivity. The principles of Swiss Design have shaped modern visual communication
              since the 1950s.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 flex items-center justify-center">
            <div className="relative w-full aspect-square bg-red-600">
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="py-20 px-4 md:px-8 bg-black text-white">
        <div className="container mx-auto">
          <h2 className="text-6xl font-bold tracking-tighter mb-12">WORK</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="group">
              <div className="aspect-square bg-white mb-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-neutral-100 group-hover:bg-red-600 transition-colors duration-300">
                  <span className="text-black text-8xl font-bold">01</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Typography Project</h3>
              <p className="text-neutral-400">Exploring grid systems and typographic hierarchy</p>
            </div>

            {/* Project 2 */}
            <div className="group">
              <div className="aspect-square bg-white mb-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-neutral-100 group-hover:bg-red-600 transition-colors duration-300">
                  <span className="text-black text-8xl font-bold">02</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Poster Design</h3>
              <p className="text-neutral-400">Minimalist approach to visual communication</p>
            </div>

            {/* Project 3 */}
            <div className="group">
              <div className="aspect-square bg-white mb-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-neutral-100 group-hover:bg-red-600 transition-colors duration-300">
                  <span className="text-black text-8xl font-bold">03</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Brand Identity</h3>
              <p className="text-neutral-400">Clean, systematic visual language for modern brands</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-5">
              <h2 className="text-6xl font-bold tracking-tighter mb-8">ABOUT</h2>
              <div className="aspect-[4/5] bg-neutral-100 relative mb-8 md:mb-0">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-black"></div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-7 md:pt-24">
              <p className="text-xl mb-6">
                Swiss Design, also known as International Typographic Style, emerged in Switzerland in the 1950s. It
                emphasizes cleanliness, readability, and objectivity.
              </p>
              <p className="mb-6">
                The style is characterized by the use of sans-serif typography (particularly Helvetica), grid systems,
                asymmetrical layouts, and photography instead of illustrations. Swiss Design pioneers believed that
                design should be clear, objective, and functional.
              </p>
              <p className="mb-6">
                Key figures in the movement include Josef Müller-Brockmann, Armin Hofmann, Emil Ruder, and Max Bill.
                Their work continues to influence graphic design, web design, and visual communication today.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-12">
                <div>
                  <h3 className="text-sm uppercase tracking-widest mb-2">Principles</h3>
                  <ul className="space-y-2">
                    <li>Minimalism</li>
                    <li>Grid-based layouts</li>
                    <li>Sans-serif typography</li>
                    <li>Objective photography</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest mb-2">Influences</h3>
                  <ul className="space-y-2">
                    <li>Bauhaus</li>
                    <li>De Stijl</li>
                    <li>Constructivism</li>
                    <li>New Typography</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 md:px-8 bg-red-600 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-6xl font-bold tracking-tighter mb-8">CONTACT</h2>
              <p className="text-xl mb-8">Interested in working together? Let's discuss your project.</p>
              <div className="space-y-4">
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Email</span>
                  <a href="mailto:hello@swissdesign.com" className="hover:underline">
                    hello@swissdesign.com
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Phone</span>
                  <a href="tel:+41123456789" className="hover:underline">
                    +41 123 456 789
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Location</span>
                  <span>Zürich, Switzerland</span>
                </p>
              </div>
            </div>
            <div>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm uppercase tracking-widest mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full bg-transparent border-b-2 border-white py-2 px-0 focus:outline-none focus:border-black placeholder-white/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full bg-transparent border-b-2 border-white py-2 px-0 focus:outline-none focus:border-black placeholder-white/50"
                    placeholder="Your email"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm uppercase tracking-widest mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full bg-transparent border-b-2 border-white py-2 px-0 focus:outline-none focus:border-black placeholder-white/50"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="mt-8 px-8 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 bg-black text-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">© 2025 Swiss Design Studio. All rights reserved.</p>
          <div className="flex space-x-8">
            <a href="#" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Behance
            </a>
            <a href="#" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
