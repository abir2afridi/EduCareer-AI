import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import IubLogo from "../assets/iub-logo.png";

const Index = () => {
  const solutions = [
    {
      number: "01",
      title: "Adaptive Pathways",
      description: "Dynamic curricula that adjust to each learner’s pace, performance, and aspirations.",
      animationSrc: "https://lottie.host/95652c02-8ab0-4777-9134-dbd035430d27/QA3B1hjEK5.lottie",
      accentHover: "group-hover:bg-red-600",
      numberColor: "text-black",
    },
    {
      number: "02",
      title: "Career Navigation",
      description: "AI guidance bridges students to internships, mentors, and industry opportunities.",
      animationSrc: "https://lottie.host/84ac1398-45b1-4c0e-a7a2-98f9f257f18d/EVCs7SkkN2.lottie",
      accentHover: "group-hover:bg-blue-600",
      numberColor: "text-black",
    },
    {
      number: "03",
      title: "Insight Hub",
      description: "Unified analytics dashboards track outcomes, risk signals, and institutional KPIs.",
      animationSrc: "https://lottie.host/6beac0e6-614c-4641-a8ca-c112eb8f33c8/SXzHYft6TJ.lottie",
      accentHover: "group-hover:bg-emerald-500",
      numberColor: "text-black",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-black">
      <nav className="fixed top-0 left-0 z-50 w-full border-b border-black bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
          <a href="#top" className="flex items-center gap-3 text-xl font-bold tracking-tighter">
            <img src={IubLogo} alt="IUB Logo" className="h-10 w-10 object-contain" />
            EDUCAREER AI
          </a>
          <div className="flex items-center gap-6">
            <div className="hidden items-center space-x-8 md:flex">
              <a href="#work" className="text-sm uppercase tracking-widest transition-colors hover:text-red-600">
                Solutions
              </a>
              <a href="#about" className="text-sm uppercase tracking-widest transition-colors hover:text-red-600">
                About
              </a>
              <a href="#contact" className="text-sm uppercase tracking-widest transition-colors hover:text-red-600">
                Contact
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/auth/signin" className="text-sm font-semibold uppercase tracking-widest hover:text-red-600">
                Sign in
              </a>
              <a
                href="/auth/signup"
                className="rounded-full border border-black px-4 py-2 text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-black hover:text-white"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section id="top" className="container mx-auto grid grid-cols-12 gap-4 px-4 pt-32 pb-20 md:px-8">
        <div className="col-span-12 mb-8 md:col-span-7 md:mb-0">
          <h1 className="text-8xl font-bold leading-none tracking-tighter md:text-9xl">
            FUTURE-READY
            <br />
            LEARNING
          </h1>
          <p className="mt-6 max-w-xl text-xl">
            Empower institutions to deliver adaptive learning, real-time guidance, and career outcomes with one
            intelligent platform built for the next generation of education.
          </p>
        </div>
        <div className="col-span-12 flex items-center justify-center md:col-span-5">
          <div className="relative aspect-square w-full max-w-[520px]">
            <div className="pointer-events-none absolute inset-0 -m-6 border-4 border-black" />
            <div className="relative h-full w-full bg-red-600">
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 bg-black" />
              <div className="relative flex h-full w-full items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/abd771cf-8e42-42e0-bf5f-8df3867c3ea0/pvplgBICDD.lottie"
                  autoplay
                  loop
                  className="h-[520px] w-[520px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="work" className="bg-black py-20 text-white">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="mb-12 text-6xl font-bold tracking-tighter">SOLUTIONS</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((project) => (
              <div key={project.number} className="group">
                <div className="mb-4 aspect-square overflow-hidden">
                  {project.animationSrc ? (
                    <div
                      className={`relative flex h-full w-full items-center justify-center bg-neutral-100 transition-[transform,background-color] duration-300 group-hover:scale-[1.02] ${project.accentHover ?? "group-hover:bg-red-600"}`}
                    >
                      <div className="pointer-events-none absolute inset-0 border-4 border-black" />
                      <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <DotLottieReact
                        src={project.animationSrc}
                        autoplay
                        loop
                        className="h-[380px] w-[380px]"
                      />
                      <span className={`absolute top-4 left-4 text-6xl font-bold ${project.numberColor ?? "text-black"}`}>
                        {project.number}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 transition-colors duration-300 group-hover:bg-red-600">
                      <span className="text-8xl font-bold text-black">{project.number}</span>
                    </div>
                  )}
                </div>
                <h3 className="mb-2 text-xl font-bold">{project.title}</h3>
                <p className="text-neutral-400">{project.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="container mx-auto grid grid-cols-12 gap-8 px-4 md:px-8">
          <div className="col-span-12 md:col-span-5">
            <h2 className="mb-8 text-6xl font-bold tracking-tighter">ABOUT</h2>
            <div className="relative mb-8 aspect-square w-full max-w-sm bg-neutral-100 md:mb-0">
              <div className="pointer-events-none absolute inset-0 border-2 border-black" />
              <div className="pointer-events-none absolute -bottom-4 -right-4 h-14 w-14 bg-black" />
              <div className="relative flex h-full w-full items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/5e04d587-5945-4a93-b0ae-e2c324dc0f61/Vqpvjl94iL.lottie"
                  autoplay
                  loop
                  className="h-56 w-56"
                />
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 md:pt-24">
            <p className="mb-6 text-xl">
              EduCareer AI unifies academic coaching, career services, and employer engagement so learners progress from
              orientation to employment with clarity and confidence.
            </p>
            <p className="mb-6">
              Our platform blends behavioral data, skills intelligence, and assistive AI to personalize support while
              empowering staff with automation and actionable insights.
            </p>
            <p className="mb-6">
              We partner with universities, bootcamps, and workforce programs to measure impact beyond graduation and to
              build lifelong learner communities.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-2 text-sm uppercase tracking-widest">Capabilities</h3>
                <ul className="space-y-2">
                  <li>AI Learning Paths</li>
                  <li>Skills Intelligence Graph</li>
                  <li>Career Readiness Coaching</li>
                  <li>Automated Outreach</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm uppercase tracking-widest">Impact Metrics</h3>
                <ul className="space-y-2">
                  <li>Placement Velocity</li>
                  <li>Skills Mastery Score</li>
                  <li>Retention Health Index</li>
                  <li>Employer Satisfaction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-red-600 py-20 text-white">
        <div className="container mx-auto grid grid-cols-1 gap-12 px-4 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="mb-8 text-6xl font-bold tracking-tighter">CONTACT</h2>
            <p className="mb-8 text-xl">Ready to elevate learner outcomes? Let’s design your next education advantage.</p>
            <div className="grid gap-6 md:grid-cols-[1.4fr,1fr]">
              <div className="space-y-4">
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Email</span>
                  <a href="mailto:hello@educareer.ai" className="hover:underline">
                    hello@educareer.ai
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Phone</span>
                  <a href="tel:+18885551234" className="hover:underline">
                    +1 (888) 555-1234
                  </a>
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-sm uppercase tracking-widest">Location</span>
                  <span>Global · Remote-first</span>
                </p>
              </div>
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 border-2 border-black" />
                <div className="pointer-events-none absolute -bottom-3 -right-3 h-12 w-12 bg-black" />
                <div className="relative flex h-full min-h-[220px] items-center justify-center bg-white/10">
                  <DotLottieReact
                    src="https://lottie.host/ea645d51-f06a-4e12-a089-61475985c663/qynJSABDMD.lottie"
                    autoplay
                    loop
                    className="h-56 w-56"
                  />
                </div>
              </div>
            </div>
          </div>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm uppercase tracking-widest">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="w-full border-b-2 border-white bg-transparent py-2 px-0 placeholder-white/50 focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm uppercase tracking-widest">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Your email"
                className="w-full border-b-2 border-white bg-transparent py-2 px-0 placeholder-white/50 focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm uppercase tracking-widest">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder="Your message"
                className="w-full border-b-2 border-white bg-transparent py-2 px-0 placeholder-white/50 focus:border-black focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="mt-8 bg-black px-8 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-black py-8 text-white">
        <div className="container mx-auto flex flex-col items-center justify-between px-4 md:flex-row md:px-8">
          <p className="mb-4 text-sm md:mb-0">© 2025 TheDevAbir-CodeCrafted Studio. All rights reserved.</p>
          <div className="flex space-x-8">
            <a href="#" className="text-sm uppercase tracking-widest transition-colors hover:text-red-600">
              Instagram
            </a>
            <a href="#" className="text-sm uppercase tracking-widest transition-colors hover:text-red-600">
              Behance
            </a>
            <a href="#" className="text-sm uppercase tracking-widest transition-colors hover:text-red-600">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
